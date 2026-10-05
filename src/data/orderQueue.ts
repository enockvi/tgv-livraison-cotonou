import { OrderRequest } from '../types/order';

/**
 * File d'attente hors-ligne des commandes (P0 architecture).
 *
 * Source de vérité unique, partagée par :
 *  - `Step4Confirmation` qui y place une commande quand l'envoi réseau échoue ;
 *  - `useOnlineStatus` qui observe le nombre d'éléments en attente et vide la file
 *    automatiquement au retour de la connexion.
 *
 * Ainsi, la promesse affichée dans la bannière (« transmise dès retour de la connexion »)
 * est réellement tenue : plus de code mort.
 */
const QUEUE_KEY = 'tgv_offline_queue';

type Listener = (count: number) => void;

const listeners = new Set<Listener>();

function readQueue(): OrderRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OrderRequest[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(list: OrderRequest[]): void {
  try {
    if (list.length > 0) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
    } else {
      localStorage.removeItem(QUEUE_KEY);
    }
  } catch (e) {
    console.error('Failed to persist offline queue:', e);
  }
}

let pending: OrderRequest[] = readQueue();

function emit(): void {
  listeners.forEach((fn) => fn(pending.length));
}

/** Abonne un composant aux changements de la file. Retourne la fonction de désabonnement. */
export function subscribeOrderQueue(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getPendingCount(): number {
  return pending.length;
}

export function enqueueOrder(order: OrderRequest): void {
  if (pending.some((o) => o.id === order.id)) return;
  pending = [...pending, order];
  writeQueue(pending);
  emit();
}

/** Envoi unitaire ; renvoie true si l'API a accepté la commande. */
async function postOrder(order: OrderRequest): Promise<boolean> {
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Envoie la commande. En cas d'échec réseau/serveur, elle est placée dans la file
 * hors-ligne et repartira automatiquement au retour de la connexion.
 * @returns true si transmise immédiatement, false si mise en attente.
 */
export async function sendOrderOrQueue(order: OrderRequest): Promise<boolean> {
  const sent = await postOrder(order);
  if (!sent) {
    enqueueOrder(order);
    return false;
  }
  return true;
}

/** Tente de transmettre toutes les commandes en attente. Renvoie le nombre restant. */
export async function flushOrderQueue(): Promise<number> {
  if (pending.length === 0) return 0;

  const remaining: OrderRequest[] = [];
  for (const order of pending) {
    const ok = await postOrder(order);
    if (!ok) remaining.push(order);
  }

  pending = remaining;
  writeQueue(pending);
  emit();
  return pending.length;
}

export function clearOrderQueue(): void {
  pending = [];
  writeQueue(pending);
  emit();
}
