// Logique de validation et de normalisation des commandes, PARTAGÉE entre la fonction
// serverless Vercel (api/order.js) et le middleware de développement Vite (vite.config.ts).
//
// Objectif (P0 architecture) : une seule source de vérité. Le comportement validé en local
// est exactement celui exécuté en production — plus de dérive possible entre les deux.
// Le préfixe « _ » empêche Vercel d'exposer ce fichier comme endpoint serverless.
//
// Le fichier porte aussi le CONTRÔLE SERVEUR DU TARIF (verifierTarifOfficiel) : le prix
// enregistré dans la feuille ne doit jamais être un tarif périmé venu du cache d'un navigateur.
import { fetchRoutesLive } from './routes.js';
// Import CommonJS explicite (pas d'import nommé) : la forme est garantie quel que soit le
// bundler utilisé par Vercel, et ce fichier n'est jamais embarqué dans le bundle navigateur.
import routeNormalize from '../scripts/lib/route-normalize.cjs';

const { getRouteKey } = routeNormalize;

export const ZONES = ['cotonou', 'calavi', 'seme', 'portonovo', 'ouidah'];

// Noms alignés sur l'ordre des SERVICES de src/data/communes.ts (couplage par index — à garder synchro).
export const SERVICE_NAMES = [
  'Colis & e-commerce',
  'Repas',
  'Documents & plis',
  'Courses marché',
];

export const ZONE_NOM = {
  cotonou: 'Cotonou',
  calavi: 'Abomey-Calavi',
  seme: 'Sémè-Podji',
  portonovo: 'Porto-Novo',
  ouidah: 'Ouidah & Pahou',
};

const ID_RE = /^TGV-\d{6}-[A-Z0-9]{4,8}$/;
const GPS_RE = /^-?\d{1,3}\.\d+,-?\d{1,3}\.\d+$/;

/** Neutralise l'injection de formules dans Google Sheets (=, +, -, @ en début de texte). */
export function sanitizeSheetText(value, maxLen = 160) {
  const s = String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Normalise un numéro béninois (8, 10, 11 ou 13 chiffres → format 229…). */
export function normalizeBeninPhone(rawValue) {
  const raw = String(rawValue || '').replace(/\D/g, '');
  if (raw.length === 8) return '229' + raw;
  if (raw.length === 10 && raw.startsWith('01')) return '229' + raw;
  if (raw.length === 11 && raw.startsWith('229')) return raw;
  if (raw.length === 13 && raw.startsWith('22901')) return raw;
  return raw;
}

/** Transforme « lat,lng » en lien Google Maps, sinon chaîne vide. */
export function normalizeGps(value) {
  return GPS_RE.test(value || '') ? 'https://maps.google.com/?q=' + value : '';
}

/**
 * Valide les champs critiques d'une commande brute.
 * @param {any} d
 * @returns {{ok: false, status: number, error: string} | {ok: true}}
 */
export function validateOrder(d) {
  const payload = d || {};
  const okId = ID_RE.test(payload.id || '');
  const okSvc = Number.isInteger(payload.svc) && payload.svc >= 0 && payload.svc < SERVICE_NAMES.length;
  const okZone = Boolean(
    payload.dep &&
      payload.dst &&
      ZONES.includes(payload.dep.v) &&
      ZONES.includes(payload.dst.v) &&
      payload.dep.q &&
      payload.dst.q
  );
  if (!okId || !okSvc || !okZone) return { ok: false, status: 400, error: 'invalid' };
  return { ok: true };
}

/**
 * Valide puis construit la ligne envoyée à Google Sheets.
 * @param {any} d commande brute reçue de l'application
 * @param {string|undefined} token jeton du Sheets (SHEET_TOKEN)
 * @returns {{ok: false, status: number, error: string} | {ok: true, row: any, statut: string, isDevis: boolean}}
 */
export function buildOrderRow(d, token) {
  const validation = validateOrder(d);
  if (!validation.ok) return validation;

  const payload = d;
  const isDevis = Boolean(payload.isDevis);
  const phone = normalizeBeninPhone(payload.destPhone || payload.recipientPhone || payload.phone);

  const row = {
    token,
    id: payload.id,
    statut: isDevis ? 'Devis demandé' : 'À confirmer',
    service: SERVICE_NAMES[payload.svc],
    dep: sanitizeSheetText(payload.dep.q),
    depZone: ZONE_NOM[payload.dep.v] || payload.dep.v,
    dst: sanitizeSheetText(payload.dst.q),
    dstZone: ZONE_NOM[payload.dst.v] || payload.dst.v,
    distance: isDevis ? '' : Number(payload.distance) > 0 ? Number(payload.distance) : '',
    tarif: isDevis ? '' : Number(payload.tarif) > 0 ? Number(payload.tarif) : 1000,
    priorite: payload.urgent ? 'Urgent' : 'Standard',
    destNom: sanitizeSheetText(payload.destNom || payload.recipientName || '', 60),
    destPhone: phone,
    phone,
    note: sanitizeSheetText(payload.note, 300),
    gps: normalizeGps(payload.gps),
    // Colonnes ajoutées dans apps-script/Code.gs (Téléphone client / Paiement).
    clientPhone: String(payload.clientPhone || '').replace(/[^\d+]/g, '').slice(0, 20),
    paiement: sanitizeSheetText(payload.paiement, 40),
  };

  return { ok: true, row, statut: row.statut, isDevis };
}

// ---------------------- Contrôle serveur du tarif (autoritatif) ----------------------

/**
 * Cache mémoire de la grille officielle, par instance de fonction « chaude » : évite de
 * retélécharger les 843 lignes à chaque commande. Une instance qui vient de servir
 * /api/routes réutilise ici la même grille.
 */
const GRILLE_TTL_MS = 10 * 60 * 1000;
let grille = { at: 0, table: null };

/** Table de correspondance « clé de paire normalisée → [distance, tarif] ». */
async function chargerGrilleOfficielle() {
  if (grille.table && Date.now() - grille.at < GRILLE_TTL_MS) return grille.table;

  const data = await fetchRoutesLive();
  // Panne amont (token absent, Apps Script indisponible) : on garde la dernière grille
  // connue, ou `null` — dans les deux cas l'appelant n'écrit jamais un tarif inventé.
  if (!data.ok || !Array.isArray(data.routes)) return grille.table;

  const table = new Map();
  data.routes.forEach((t) => {
    table.set(getRouteKey(t[0], t[1]), [t[2], t[3]]);
  });
  grille = { at: Date.now(), table };
  return table;
}

/**
 * Confronte le tarif envoyé par le navigateur à la grille officielle.
 *
 * Un client peut encore servir un prix périmé (cache localStorage, onglet resté ouvert) :
 * sans ce contrôle, la colonne « Tarif (FCFA) » enregistrerait ce montant obsolète. Ici le
 * prix officiel gagne TOUJOURS lorsqu'il existe, et l'écart est journalisé pour l'opérateur.
 *
 * Cette fonction ne bloque jamais une commande : en cas de panne de la grille amont elle
 * renvoie `{ officiel: false }` et l'appelant conserve le tarif reçu.
 *
 * @param {any} row ligne construite par buildOrderRow (dep, dst, tarif déjà normalisés)
 * @returns {Promise<{officiel: false, corrige: false} | {officiel: true, corrige: boolean, tarif: number, distance: number}>}
 */
export async function verifierTarifOfficiel(row) {
  try {
    const table = await chargerGrilleOfficielle();
    if (!table) return { officiel: false, corrige: false };

    const match = table.get(getRouteKey(row.dep, row.dst));
    if (!match) return { officiel: false, corrige: false };

    const tarifClient = Number(row.tarif);
    return {
      officiel: true,
      corrige: tarifClient !== match[1],
      tarif: match[1],
      distance: match[0],
    };
  } catch {
    return { officiel: false, corrige: false };
  }
}
