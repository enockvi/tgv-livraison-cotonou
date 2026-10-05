/**
 * Grille tarifaire « live » : récupérée depuis `/api/routes` (qui interroge l'onglet
 * tarifs du Google Sheet via Apps Script), avec cache localStorage et repli permanent
 * sur la matrice embarquée `routesMatrix.json`.
 *
 * Le chargement est totalement non bloquant : au pire, l'application utilise la grille
 * du dernier déploiement (comportement identique à avant l'introduction du live).
 *
 * Propagation d'un tarif modifié dans le Sheet (objectif : quelques minutes, sans
 * redéploiement) :
 *  1. le cache Apps Script et le cache CDN de `/api/routes` expirent en 60 s ;
 *  2. le client compare son empreinte à celle de `/api/routes-version` **toutes les 5 min**
 *     et **à chaque reprise de focus** — la grille complète n'est retéléchargée que si
 *     l'empreinte a réellement changé ;
 *  3. en cas d'échec réseau, la grille en mémoire est conservée telle quelle.
 */
import { getRouteKey } from '../utils/routeKeys';

const CACHE_KEY = 'tgv_routes_live_v1';
const TTL_MS = 20 * 60 * 1000; // 20 min : au-delà, on retente le réseau au démarrage
const VERIF_INTERVAL_MS = 5 * 60 * 1000; // vérification d'empreinte toutes les 5 min
const API_ROUTES = '/api/routes';
const API_VERSION = '/api/routes-version';

export type LiveRoutes = Record<string, [number, number]>;

let routesLive: LiveRoutes | null = null;
let empreinte: string | null = null;
let initLancee = false;
let veilleInstallee = false;
let verificationEnCours = false;

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

/** Empreinte des tarifs actuellement servis (`null` tant que la grille live n'a pas répondu). */
export function empreinteRoutesLive(): string | null {
  return empreinte;
}

const signaler = (msg: string) => console.warn(`[TGV] ${msg}`);

// Convertit [[dep, dst, dist, tarif], ...] en table indexée par clé de paire normalisée.
function construire(tuples: unknown, signalerErreur: (msg: string) => void): LiveRoutes | null {
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
  if (ignorees > 0) signalerErreur(`${ignorees} lignes de la grille live ignorées (format inattendu)`);
  return table;
}

// Table live si disponible, sinon null (l'appelant retombe sur la matrice embarquée).
export function getLiveRoutes(): LiveRoutes | null {
  return routesLive;
}

/**
 * Applique une grille (réseau ou cache local) et notifie l'interface.
 * @param persister true pour réécrire le cache localStorage (données fraîches du réseau).
 */
function appliquer(tuples: unknown, hash: string | null, persister: boolean): boolean {
  const table = construire(tuples, signaler);
  if (!table) return false;

  routesLive = table;
  empreinte = hash;
  notifier();

  if (persister) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), hash, routes: tuples }));
    } catch {
      /* quota dépassé : la grille reste en mémoire */
    }
  }
  return true;
}

/** Télécharge la grille complète et l'applique. Renvoie true si elle a été prise en compte. */
async function chargerGrille(): Promise<boolean> {
  try {
    const r = await fetch(API_ROUTES);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = (await r.json()) as { routes?: unknown; version?: string | null };
    const ok = appliquer(j && j.routes, (j && j.version) || null, true);
    if (ok) {
      console.info(`[TGV] Grille tarifaire live chargée : ${Object.keys(routesLive || {}).length} paires.`);
    }
    return ok;
  } catch (e) {
    console.info(
      '[TGV] Prix live indisponibles, grille précédente conservée :',
      e instanceof Error ? e.message : e
    );
    return false;
  }
}

/**
 * Vérifie la fraîcheur des tarifs et ne retélécharge la grille que si l'empreinte a changé.
 *
 * Appelée périodiquement (5 min), à chaque reprise de focus de l'onglet ou de la PWA
 * installée, et au retour de la connexion. Un verrou simple évite les appels concurrents.
 */
export async function verifierFraicheurRoutes(): Promise<void> {
  if (verificationEnCours || typeof window === 'undefined') return;
  verificationEnCours = true;
  try {
    // Aucune grille live en mémoire (ou empreinte inconnue) : on charge directement.
    if (!empreinte) {
      await chargerGrille();
      return;
    }

    const r = await fetch(API_VERSION);
    if (!r.ok) return;
    const j = (await r.json()) as { ok?: boolean; version?: string };
    if (!j || !j.ok || !j.version) return;

    if (j.version !== empreinte) {
      console.info('[TGV] Tarifs modifiés dans la feuille : rechargement de la grille.');
      await chargerGrille();
    }
  } catch {
    /* hors-ligne : la grille en mémoire reste valable, la prochaine vérification retentera */
  } finally {
    verificationEnCours = false;
  }
}

/**
 * Installe les déclencheurs de revalidation (une seule fois par session).
 * C'est ce qui remplace l'ancien comportement « un seul fetch au démarrage ».
 */
function installerVeille(): void {
  if (veilleInstallee || typeof window === 'undefined') return;
  veilleInstallee = true;

  window.setInterval(() => {
    void verifierFraicheurRoutes();
  }, VERIF_INTERVAL_MS);

  // Reprise de focus / réouverture de l'onglet ou de la PWA installée : le tarif affiché
  // repasse à jour en moins d'une seconde, sans rechargement de page.
  const surReprise = () => {
    if (document.visibilityState === 'visible') void verifierFraicheurRoutes();
  };
  document.addEventListener('visibilitychange', surReprise);
  window.addEventListener('focus', surReprise);
  window.addEventListener('online', () => {
    void verifierFraicheurRoutes();
  });
}

export function initLiveRoutes(): void {
  if (initLancee || typeof window === 'undefined') return;
  initLancee = true;

  installerVeille();

  // 1) Cache local : évite un appel réseau à chaque démarrage.
  try {
    const brut = localStorage.getItem(CACHE_KEY);
    if (brut) {
      const cache = JSON.parse(brut) as { at?: number; hash?: string | null; routes?: unknown };
      if (typeof cache.at === 'number' && Date.now() - cache.at < TTL_MS) {
        if (appliquer(cache.routes, cache.hash || null, false)) return;
      }
    }
  } catch {
    /* cache illisible : on continue simplement vers le réseau */
  }

  // 2) Grille live : en cas d'échec (hors-ligne, API absente, token invalide) on reste
  //    silencieusement sur la grille embarquée.
  void chargerGrille();
}

// Force un nouveau chargement (utile pour les tests ou après une mise à jour du sheet).
export function reinitialiserRoutesLive(): void {
  initLancee = false;
  routesLive = null;
  empreinte = null;
  notifier();
}
