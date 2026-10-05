// Logique de validation et de normalisation des commandes, PARTAGÉE entre la fonction
// serverless Vercel (api/order.js) et le middleware de développement Vite (vite.config.ts).
//
// Objectif (P0 architecture) : une seule source de vérité. Le comportement validé en local
// est exactement celui exécuté en production — plus de dérive possible entre les deux.
// Le préfixe « _ » empêche Vercel d'exposer ce fichier comme endpoint serverless.

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
