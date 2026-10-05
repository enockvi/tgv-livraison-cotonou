// Google Apps Script : reçoit les commandes et les ajoute dans la feuille « Commandes »,
// renvoie les statuts en direct (action: 'status') et expose un healthcheck GET.
//
// ⚠️ AUCUN SECRET DANS CE FICHIER : le token est lu dans les propriétés du script.
//    À faire UNE SEULE FOIS dans l'éditeur Apps Script, puis plus jamais dans le code :
//      configurerToken('<la même valeur que SHEET_TOKEN sur Vercel>')
//    (équivalent manuel : Projet > Paramètres du projet > Propriétés du script > SHEET_TOKEN)

const VERSION = '1.2.0';
const PROP_TOKEN = 'SHEET_TOKEN';
const PROP_ONGLET_TARIFS = 'ONGLET_TARIFS'; // nom de l'onglet tarifaire, si l'auto-détection échoue
const ONGLET_TARIFS_DEFAUT = 'Tarifs';
const CACHE_ROUTES_KEY = 'routes_cache_v2';
const CACHE_ROUTES_TTL = 600; // 10 min
const CACHE_ROUTES_MAX = 90000; // au-delà, la valeur dépasse la limite de CacheService (100 Ko)
const ONGLET = 'Commandes';
const STATUTS = ['Nouvelle', 'En cours', 'Livrée', 'Annulée'];

// SOURCE DE VÉRITÉ UNIQUE de la feuille : chaque colonne est liée à la clé de la ligne reçue en JSON.
// L'ordre écrit par appendRow est dérivé de ce tableau, donc l'en-tête et les valeurs ne peuvent
// plus se désaligner (c'était le défaut de l'ancienne version : 13 valeurs écrites pour 13 colonnes,
// mais `distance` et `destNom` étaient purement et simplement jetés).
const CHAMPS = [
  { col: 'Date et heure', cle: 'quand' },
  { col: 'Réf.', cle: 'id' },
  { col: 'Statut', cle: 'statut' },
  { col: 'Service', cle: 'service' },
  { col: 'Départ', cle: 'dep' },
  { col: 'Commune départ', cle: 'depZone' },
  { col: 'Destination', cle: 'dst' },
  { col: 'Commune destination', cle: 'dstZone' },
  { col: 'Priorité', cle: 'priorite' },
  { col: 'Tarif (FCFA)', cle: 'tarif' },
  { col: 'Note', cle: 'note' },
  { col: 'Position GPS', cle: 'gps' },
  { col: 'Téléphone client', cle: 'clientPhone' },
  // Colonnes ajoutées VOLONTAIREMENT EN FIN DE FEUILLE : les colonnes A→M des feuilles déjà
  // en production restent identiques (aucune donnée historique décalée).
  { col: 'Distance (km)', cle: 'distance' },
  { col: 'Destinataire', cle: 'destNom' },
  { col: 'Téléphone destinataire', cle: 'destPhone' },
  { col: 'Paiement', cle: 'paiement' }
];

const COLONNES = CHAMPS.map(function (c) { return c.col; });
const COL_ID = COLONNES.indexOf('Réf.') + 1;                // 2
const COL_STATUT = COLONNES.indexOf('Statut') + 1;          // 3
const COL_TEL_CLIENT = COLONNES.indexOf('Téléphone client') + 1;
const COL_TEL_DEST = COLONNES.indexOf('Téléphone destinataire') + 1;

// ---------------------------- Token ----------------------------

function getTokenAttendu() {
  return (PropertiesService.getScriptProperties().getProperty(PROP_TOKEN) || '').trim();
}

// Comparaison à temps constant : évite de laisser fuiter le token par le temps de réponse.
function tokenValide(recu) {
  const attendu = getTokenAttendu();
  if (!attendu) return { ok: false, error: 'token_non_configure' };
  const valeur = typeof recu === 'string' ? recu.trim() : '';
  if (valeur.length !== attendu.length) return { ok: false, error: 'unauthorized' };
  let diff = 0;
  for (let i = 0; i < attendu.length; i++) diff |= attendu.charCodeAt(i) ^ valeur.charCodeAt(i);
  return diff === 0 ? { ok: true, error: '' } : { ok: false, error: 'unauthorized' };
}

/**
 * À exécuter UNE FOIS depuis l'éditeur (menu Exécuter) pour installer le token.
 * Ensuite : plus aucun secret dans le code, et la même valeur va dans SHEET_TOKEN sur Vercel.
 */
function configurerToken(token) {
  const valeur = String(token || '').trim();
  if (valeur.length < 20) throw new Error('Token trop court : 20 caractères minimum.');
  PropertiesService.getScriptProperties().setProperty(PROP_TOKEN, valeur);
  return 'Token enregistré dans les propriétés du script.';
}

// ---------------------------- Entrées HTTP ----------------------------

// Healthcheck : ouvrir l'URL /exec dans un navigateur doit renvoyer ce JSON.
// Ne divulgue jamais le token, seulement s'il est configuré.
function doGet() {
  return sortie({
    ok: true,
    version: VERSION,
    token: getTokenAttendu() ? 'configure' : 'absent',
    onglet: ONGLET,
    colonnes: COLONNES.length
  });
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const verdict = tokenValide(d.token);
    if (!verdict.ok) return sortie({ ok: false, error: verdict.error });

    // 1) Lecture en direct du statut des commandes (sans verrou, avec cache 20 s)
    if (d.action === 'status') return repondreStatuts(d);

    // 2) Grille tarifaire live (onglet de tarifs), avec cache 10 min
    if (d.action === 'routes') return repondreRoutes();

    // 3) Enregistrement d'une nouvelle commande (avec verrou d'écriture)
    //    Garde-fou : une action inconnue ou une charge utile incomplète ne doit JAMAIS créer
    //    de ligne vide dans la feuille (comportement des versions antérieures du script,
    //    qui retombaient ici pour tout ce qui n'était ni « status » ni « routes »).
    if (!/^TGV-\d{6}-[A-Z0-9]{4,8}$/.test(String(d.id || '')) || !d.dep || !d.dst) {
      return sortie({ ok: false, error: 'requete_invalide' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sh = ss.getSheetByName(ONGLET) || ss.insertSheet(ONGLET);
      garantirEntetes(sh);

      // Déduplication : évite les doublons si le client réessaie.
      const ids = sh.getRange(2, COL_ID, Math.max(sh.getLastRow() - 1, 1), 1).getValues().flat();
      if (ids.indexOf(d.id) !== -1) return sortie({ ok: true, doublon: true });

      const quand = Utilities.formatDate(new Date(), 'Africa/Lagos', 'dd/MM/yyyy HH:mm:ss'); // fuseau Bénin (UTC+1)
      const valeurs = {
        quand: quand,
        id: d.id,
        statut: 'Nouvelle',
        service: d.service,
        dep: d.dep,
        depZone: d.depZone,
        dst: d.dst,
        dstZone: d.dstZone,
        priorite: d.priorite,
        tarif: d.tarif,
        note: d.note,
        gps: d.gps,
        clientPhone: d.clientPhone || '',
        distance: (d.distance === undefined || d.distance === null) ? '' : d.distance,
        destNom: d.destNom || '',
        destPhone: d.destPhone || d.phone || '',
        paiement: d.paiement || ''
      };

      // L'ordre suit exactement CHAMPS (= COLONNES) : aucun décalage possible.
      sh.appendRow(CHAMPS.map(function (c) { return valeurs[c.cle]; }));

      try { CacheService.getScriptCache().remove('status_cache'); } catch (err) {}
      return sortie({ ok: true, version: VERSION });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return sortie({ ok: false, error: String(err) });
  }
}

// ---------------------------- Statuts ----------------------------

function repondreStatuts(d) {
  const cache = CacheService.getScriptCache();
  let map = {};
  const cached = cache.get('status_cache');
  if (cached) {
    try { map = JSON.parse(cached); } catch (err) { map = {}; }
  } else {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(ONGLET);
    if (sh && sh.getLastRow() >= 2) {
      const last = sh.getLastRow();
      const start = Math.max(2, last - 1999);
      const count = last - start + 1;
      // Colonnes Réf. (B) et Statut (C) : contiguës, donc 2 colonnes depuis COL_ID.
      const rows = sh.getRange(start, COL_ID, count, 2).getValues();
      rows.forEach(function (r) {
        if (r[0]) map[String(r[0])] = String(r[1] || 'Nouvelle');
      });
      try { cache.put('status_cache', JSON.stringify(map), 20); } catch (err) {}
    }
  }

  const statuts = {};
  const ids = Array.isArray(d.ids) ? d.ids : [];
  ids.forEach(function (id) { statuts[id] = map[id] || 'Inconnue'; });
  return sortie({ ok: true, statuts: statuts, version: VERSION });
}

// ---------------------------- Grille tarifaire live ----------------------------

// Comparaison d'en-têtes insensible aux accents et à la casse (« Départ » == « depart »).
function sansAccent(valeur) {
  return String(valeur || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Trouve l'onglet de tarifs : propriété ONGLET_TARIFS, puis onglet « Tarifs », puis le premier
// onglet dont l'en-tête contient « départ » ET « arrivée » (l'onglet des commandes est ignoré).
function trouverOngletTarifs(ss) {
  const nom = (PropertiesService.getScriptProperties().getProperty(PROP_ONGLET_TARIFS) || '').trim();
  if (nom) {
    const force = ss.getSheetByName(nom);
    if (force && force.getLastRow() > 1) return force;
  }

  const candidats = [];
  const defaut = ss.getSheetByName(ONGLET_TARIFS_DEFAUT);
  if (defaut) candidats.push(defaut);
  ss.getSheets().forEach(function (sh) {
    if (candidats.indexOf(sh) === -1) candidats.push(sh);
  });

  for (let i = 0; i < candidats.length; i++) {
    const sh = candidats[i];
    if (sh.getName() === ONGLET || sh.getLastRow() < 2) continue;
    const entete = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(sansAccent);
    let aDepart = false;
    let aArrivee = false;
    entete.forEach(function (c) {
      if (c.indexOf('depart') !== -1) aDepart = true;
      if (c.indexOf('arrivee') !== -1) aArrivee = true;
    });
    if (aDepart && aArrivee) return sh;
  }
  return null;
}

// Renvoie la grille au format compact [[départ, arrivée, distance, tarif], ...].
// L'application y accède via /api/routes et retombe sur la matrice embarquée en cas d'échec.
function repondreRoutes() {
  const cache = CacheService.getScriptCache();
  const enCache = cache.get(CACHE_ROUTES_KEY);
  if (enCache) {
    try { return sortie(JSON.parse(enCache)); } catch (err) { /* cache corrompu : on recalcule */ }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = trouverOngletTarifs(ss);
  if (!sh) return sortie({ ok: false, error: 'onglet_tarifs_introuvable' });

  const entete = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(sansAccent);
  const iDep = entete.map(function (c, i) { return c.indexOf('depart') !== -1 ? i : -1; }).filter(function (i) { return i >= 0; })[0];
  const iDst = entete.map(function (c, i) { return c.indexOf('arrivee') !== -1 ? i : -1; }).filter(function (i) { return i >= 0; })[0];
  const iDist = entete.map(function (c, i) { return c.indexOf('distance') !== -1 ? i : -1; }).filter(function (i) { return i >= 0; })[0];
  const iTarif = entete.map(function (c, i) { return c.indexOf('tarif') !== -1 ? i : -1; }).filter(function (i) { return i >= 0; })[0];

  if (iDep === undefined || iDst === undefined || iDist === undefined || iTarif === undefined) {
    return sortie({ ok: false, error: 'colonnes_tarifs_introuvables', entete: entete });
  }

  const nbLignes = sh.getLastRow() - 1;
  const lignes = nbLignes > 0 ? sh.getRange(2, 1, nbLignes, sh.getLastColumn()).getValues() : [];
  const routes = [];
  lignes.forEach(function (l) {
    const dep = String(l[iDep] || '').trim();
    const dst = String(l[iDst] || '').trim();
    const dist = Number(String(l[iDist]).replace(',', '.'));
    const tarif = Number(String(l[iTarif]).replace(/[^\d.-]/g, ''));
    if (!dep || !dst || !isFinite(dist) || dist <= 0 || !isFinite(tarif) || tarif <= 0) return;
    routes.push([dep, dst, dist, tarif]);
  });

  const reponse = {
    ok: true,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    onglet: sh.getName(),
    count: routes.length,
    routes: routes
  };
  const texte = JSON.stringify(reponse);
  if (texte.length < CACHE_ROUTES_MAX) {
    try { cache.put(CACHE_ROUTES_KEY, texte, CACHE_ROUTES_TTL); } catch (err) {}
  }
  return sortie(reponse);
}

// ---------------------------- Feuille ----------------------------

/**
 * Crée ou complète l'en-tête SANS JAMAIS décaler les données existantes :
 * les colonnes déjà présentes sont laissées telles quelles, seules les colonnes
 * absentes (typiquement Distance, Destinataire, Téléphone destinataire, Paiement)
 * sont ajoutées en fin de tableau. Idempotent : peut être appelé à chaque écriture.
 */
function garantirEntetes(sh) {
  const nb = COLONNES.length;
  const ligne1 = sh.getRange(1, 1, 1, nb).getValues()[0];

  if (String(ligne1.join('')).trim() === '') {
    // Feuille vierge : en-tête complet d'un coup.
    sh.getRange(1, 1, 1, nb).setValues([COLONNES]);
    sh.setFrozenRows(1);
  } else {
    // Feuille existante : on ne remplit que les en-têtes vides (migration douce).
    for (let i = 1; i <= nb; i++) {
      if (String(ligne1[i - 1] || '').trim() === '') sh.getRange(1, i).setValue(COLONNES[i - 1]);
    }
  }

  sh.getRange(1, 1, 1, nb).setFontWeight('bold').setBackground('#E3F1E9');
  sh.getRange(2, COL_STATUT, Math.max(sh.getMaxRows() - 1, 1), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUTS, true).build());
  formaterTexte(sh, COL_TEL_CLIENT);
  formaterTexte(sh, COL_TEL_DEST);
}

// Les numéros doivent rester du texte : sinon Sheets supprime le 0 initial et transforme
// 22901xxxxxxx en notation scientifique.
function formaterTexte(sh, index1) {
  if (index1 < 1) return;
  sh.getRange(2, index1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
}

// ---------------------------- Utilitaires ----------------------------

/**
 * Test rapide depuis l'éditeur : injecte une commande factice (Réf. fixe, donc
 * les appels suivants renvoient { doublon: true } au lieu de polluer la feuille).
 */
function testEnregistrement() {
  const faux = {
    token: getTokenAttendu(),
    id: 'TGV-000000-TEST',
    service: 'Colis & e-commerce',
    dep: 'Test départ',
    depZone: 'Cotonou',
    dst: 'Test arrivée',
    dstZone: 'Abomey-Calavi',
    priorite: 'Standard',
    tarif: 1000,
    note: 'Ligne de test',
    gps: '',
    distance: 1.5,
    destNom: 'Destinataire test',
    destPhone: '2290100000000',
    paiement: 'Mobile Money',
    clientPhone: ''
  };
  return doPost({ postData: { contents: JSON.stringify(faux) } }).getContent();
}

function sortie(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
