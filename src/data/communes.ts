import { CommuneKey, DeliveryService, Quartier, RouteCalculation } from '../types/order';
import routesMatrixJson from './routesMatrix.json';
import sheetQuartiersJson from './sheetQuartiers.json';
import { getLiveRoutes, versionRoutesLive } from './routesLive';
import { normalizePlaceName, getRouteKey } from '../utils/routeKeys';
import { signalerTrajetHorsGrille } from '../utils/telemetry';

// La normalisation vit dans utils/routeKeys.ts : elle est PARTAGÉE avec le pipeline de build
// (scripts/lib/route-normalize.cjs). Ré-export pour conserver l'API publique existante.
export { normalizePlaceName, getRouteKey };

export const COMMUNE_NAMES: Record<CommuneKey, string> = {
  cotonou: 'Cotonou',
  calavi: 'Abomey-Calavi',
  portonovo: 'Porto-Novo',
  ouidah: 'Ouidah & Pahou',
  seme: 'Sémè-Podji',
};

export const PHONE_DISPATCH_1 = '2290142016986';
export const PHONE_DISPLAY_1 = '+229 01 42 01 69 86';
export const PHONE_DISPATCH_2 = '2290159293085';
export const PHONE_DISPLAY_2 = '+229 01 59 29 30 85';

export const SERVICES: DeliveryService[] = [
  {
    id: 0,
    name: 'Colis & e-commerce',
    subtitle: 'Remise en main propre',
    badge: 'Standard / Express',
    description: 'Vêtements, chaussures, accessoires, électronique et commandes boutiques en ligne.',
    icon: 'package',
  },
  {
    id: 1,
    name: 'Repas & Nourriture',
    subtitle: 'Sac isotherme chaud/froid',
    badge: 'Maintien au chaud',
    description: 'Plats cuisinés de restaurants, traiteurs, gâteaux, fast-food livrés intacts et chauds.',
    icon: 'utensils',
  },
  {
    id: 2,
    name: 'Documents & plis',
    subtitle: 'Pochette scellée sécurisée',
    badge: 'Confidentiel',
    description: 'Contrats, passeports, diplômes, factures, dossiers d’appels d’offres et courriers urgents.',
    icon: 'file-text',
  },
  {
    id: 3,
    name: 'Courses marché & vivres',
    subtitle: 'Dantokpa & supermarché',
    badge: 'Achat & livraison',
    description: 'Achats au grand marché Dantokpa, vivres frais, épiceries, pièces détachées et pharmacies.',
    icon: 'shopping-bag',
  },
];

// ⚠️ La liste des quartiers est GÉNÉRÉE depuis le CSV officiel (src/data/sheetQuartiers.json).
// Aucune saisie manuelle : un quartier absent du CSV ne peut pas être choisi dans l'interface,
// et les libellés affichés sont exactement ceux écrits dans le document.
const QUARTIERS_CSV = sheetQuartiersJson.quartiersByCommune as unknown as Record<string, string[]>;

export const QUARTIERS_BY_COMMUNE: Record<CommuneKey, string[]> = (
  Object.keys(COMMUNE_NAMES) as CommuneKey[]
).reduce((acc, key) => {
  acc[key] = [...(QUARTIERS_CSV[key] || [])];
  return acc;
}, {} as Record<CommuneKey, string[]>);

// Communes réellement desservies (au moins un quartier dans le CSV) : sert à construire les
// filtres de l'interface sans jamais afficher une commune vide (Sémè-Podji est absent du CSV).
export const COMMUNES_SERVIES: { key: CommuneKey; label: string; quartiers: number }[] = (
  Object.keys(COMMUNE_NAMES) as CommuneKey[]
)
  .map((key) => ({ key, label: COMMUNE_NAMES[key], quartiers: QUARTIERS_BY_COMMUNE[key].length }))
  .filter((c) => c.quartiers > 0);

// Nombre de liaisons officielles = nombre de lignes du CSV (aucune paire calculée).
export const NOMBRE_LIAISONS = Object.keys(routesMatrixJson).length;

export function quartierParNom(nom: string): Quartier | undefined {
  return ALL_QUARTIERS.find((q) => q.name === nom);
}

export const ALL_QUARTIERS: Quartier[] = (
  Object.entries(QUARTIERS_BY_COMMUNE) as [CommuneKey, string[]][]
).flatMap(([commune, list]) =>
  list.map((name) => ({
    name,
    commune,
  }))
);

const ROUTES_LOOKUP: Record<string, [number, number]> = routesMatrixJson as unknown as Record<string, [number, number]>;

export interface Liaison {
  quartier: Quartier;
  distance: number;
  tarif: number;
}

// Index des liaisons : pour chaque quartier, les destinations RÉELLEMENT desservies
// (la grille est symétrique : une liaison du CSV vaut dans les deux sens).
// Construit depuis le CSV, puis enrichi par la grille live quand elle est chargée.
let cacheLiaisons: { version: number; parQuartier: Record<string, Liaison[]> } | null = null;

function construireLiaisons(): Record<string, Liaison[]> {
  const indexQuartiers = new Map<string, Quartier>();
  ALL_QUARTIERS.forEach((q) => indexQuartiers.set(normalizePlaceName(q.name), q));

  const parQuartier: Record<string, Liaison[]> = {};
  const tables = [getLiveRoutes(), ROUTES_LOOKUP];

  tables.forEach((table) => {
    if (!table) return;
    Object.entries(table).forEach(([cle, valeur]) => {
      const [a, b] = cle.split('|');
      const qa = indexQuartiers.get(a);
      const qb = indexQuartiers.get(b);
      if (!qa || !qb || qa.name === qb.name) return;
      const ajouter = (depuis: Quartier, vers: Quartier) => {
        const liste = (parQuartier[depuis.name] = parQuartier[depuis.name] || []);
        if (liste.some((l) => l.quartier.name === vers.name)) return;
        liste.push({ quartier: vers, distance: valeur[0], tarif: valeur[1] });
      };
      ajouter(qa, qb);
      ajouter(qb, qa);
    });
  });

  Object.values(parQuartier).forEach((liste) =>
    liste.sort(
      (x, y) =>
        x.distance - y.distance ||
        x.tarif - y.tarif ||
        x.quartier.name.localeCompare(y.quartier.name, 'fr')
    )
  );
  return parQuartier;
}

/** Destinations desservies depuis un quartier, triées de la plus proche à la plus lointaine. */
export function liaisonsDepuis(depName: string): Liaison[] {
  const version = versionRoutesLive();
  if (!cacheLiaisons || cacheLiaisons.version !== version) {
    cacheLiaisons = { version, parQuartier: construireLiaisons() };
  }
  return cacheLiaisons.parQuartier[depName] || [];
}

export function estLiaisonOfficielle(a: string, b: string): boolean {
  if (!a || !b) return false;
  const key = getRouteKey(a, b);
  // Table FUSIONNÉE : la grille live d'abord (lignes ajoutées ou modifiées dans le Sheet),
  // puis la matrice du build. Une liaison présente uniquement dans le live est donc reconnue
  // tout de suite, sans attendre un redéploiement — cohérent avec liaisonsDepuis() et
  // calculateRouteDetails().
  const live = getLiveRoutes();
  return Boolean((live && live[key]) || ROUTES_LOOKUP[key]);
}

/**
 * Tarif de la liaison, SANS AUCUNE EXTRAPOLATION : si la paire n'est pas une ligne du CSV,
 * on renvoie distance 0 / tarif 0 avec isExactSheetRoute=false. L'appelant doit alors
 * afficher « tarif à confirmer » plutôt qu'un prix inventé.
 */
export function calculateRouteDetails(depName: string, dstName: string): RouteCalculation {
  if (!depName || !dstName) {
    return { distance: 0, tarif: 0, isExactSheetRoute: false };
  }

  const normA = normalizePlaceName(depName);
  const normB = normalizePlaceName(dstName);
  if (normA === normB) {
    // Le CSV ne contient aucune ligne intra-quartier : ce trajet n'existe pas dans la grille.
    return { distance: 0, tarif: 0, isExactSheetRoute: false };
  }

  // Priorité à la grille live (mêmes lignes du Sheet), repli sur la matrice du build.
  const key = getRouteKey(depName, dstName);
  const live = getLiveRoutes();
  const liveMatch = live ? live[key] : undefined;
  const match = liveMatch || ROUTES_LOOKUP[key];
  if (match) {
    return {
      distance: match[0],
      tarif: match[1],
      isExactSheetRoute: true,
      source: liveMatch ? 'live' : 'bundled',
    };
  }

  signalerTrajetHorsGrille(depName, dstName);
  return { distance: 0, tarif: 0, isExactSheetRoute: false };
}

export function calculateTarif(depZoneOrName: string, dstZoneOrName: string): number {
  return calculateRouteDetails(depZoneOrName, dstZoneOrName).tarif;
}

export function formatFCFA(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1).replace('.0', '')} km`;
}

export function generateOrderId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yearShort = String(d.getFullYear()).slice(2);
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TGV-${yearShort}${month}${day}-${rand}`;
}
