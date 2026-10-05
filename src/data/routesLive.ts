/**
 * Grille tarifaire « live » : récupérée depuis `/api/routes` (qui interroge l'onglet
 * tarifs du Google Sheet via Apps Script), avec cache localStorage et repli permanent
 * sur la matrice embarquée `routesMatrix.json`.
 *
 * Le chargement est totalement non bloquant : au pire, l'application utilise la grille
 * du dernier déploiement (comportement identique à avant l'introduction du live).
 */
import { getRouteKey } from '../utils/routeKeys';

const CACHE_KEY = 'tgv_routes_live_v1';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 h : au-delà, on retente le réseau

export type LiveRoutes = Record<string, [number, number]>;

let routesLive: LiveRoutes | null = null;
let initialisationLancee = false;

// Compteur de version + abonnés : permet à l'interface de se rafraîchir quand la grille live
// arrive (le premier rendu utilise la grille embarquée, puis les liaisons live s'ajoutent).
let version = 0;
const abonnes = new Set<() => void>();

function notifier(): void {
  version += 1;
  abonnes.forEach((fn) => fn());
}

export function versionRoutesLive(): number {
  return version;
}

export function abonnerRoutesLive(fn: () => void): () => void {
  abonnes.add(fn);
  return () => {
    abonnes.delete(fn);
  };
}

// Convertit [[dep, dst, dist, tarif], ...] en table indexée par clé de paire normalisée.
function construire(tuples: unknown, signaler: (msg: string) => void): LiveRoutes | null {
  if (!Array.isArray(tuples)) return null;
  const table: LiveRoutes = {};
  let ignorees = 0;

  tuples.forEach((t) => {
    if (!Array.isArray(t) || t.length < 4) {
      ignorees++;
      return;
    }
    const [dep, dst, dist, tarif] = t as [unknown, unknown, unknown, unknown];
    const d = Number(dist);
    const ta = Number(tarif);
    if (typeof dep !== 'string' || typeof dst !== 'string' || !(d > 0) || !(ta > 0)) {
      ignorees++;
      return;
    }
    table[getRouteKey(dep, dst)] = [d, ta];
  });

  const lues = Object.keys(table).length;
  if (lues === 0) return null;
  if (ignorees > 0) signaler(`${ignorees} lignes de la grille live ignorées (format inattendu)`);
  return table;
}

// Table live si disponible, sinon null (l'appelant retombe sur la matrice embarquée).
export function getLiveRoutes(): LiveRoutes | null {
  return routesLive;
}

export function initLiveRoutes(): void {
  if (initialisationLancee || typeof window === 'undefined') return;
  initialisationLancee = true;

  const signaler = (msg: string) => console.warn(`[TGV] ${msg}`);

  // 1) Cache local : évite un appel réseau à chaque démarrage.
  try {
    const brut = localStorage.getItem(CACHE_KEY);
    if (brut) {
      const cache = JSON.parse(brut) as { at?: number; routes?: unknown };
      if (typeof cache.at === 'number' && Date.now() - cache.at < TTL_MS) {
        const table = construire(cache.routes, signaler);
        if (table) {
          routesLive = table;
          notifier();
          return;
        }
      }
    }
  } catch {
    /* cache illisible : on continue simplement vers le réseau */
  }

  // 2) Grille live : en cas d'échec (hors-ligne, API absente, token invalide) on reste
  //    silencieusement sur la grille embarquée.
  fetch('/api/routes')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((j: { routes?: unknown }) => {
      const table = construire(j && j.routes, signaler);
      if (!table) throw new Error('réponse vide');
      routesLive = table;
      notifier();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), routes: (j as { routes?: unknown }).routes }));
      } catch {
        /* quota dépassé : la grille reste en mémoire */
      }
      console.info(`[TGV] Grille tarifaire live chargée : ${Object.keys(table).length} paires.`);
    })
    .catch((e: unknown) => {
      console.info('[TGV] Prix live indisponibles, grille embarquée utilisée :', e instanceof Error ? e.message : e);
    });
}

// Force un nouveau chargement (utile pour les tests ou après une mise à jour du sheet).
export function reinitialiserRoutesLive(): void {
  initialisationLancee = false;
  routesLive = null;
  notifier();
}
