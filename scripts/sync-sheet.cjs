/**
 * Synchronisation de la grille tarifaire depuis Google Sheets, exécutée en `prebuild`.
 *
 * 1. Lit `SHEET_CSV_URL` (export CSV public : Fichier > Partager > Publier sur le web > CSV).
 * 2. Télécharge le CSV, le parse et réécrit `scripts/parsed-routes.json`.
 * 3. Régénère `src/data/routesMatrix.json` + `src/data/sheetQuartiers.json`.
 *
 * FALLBACK : à la moindre anomalie (URL absente, réseau, HTTP, CSV vide ou tronqué),
 * le script conserve le `parsed-routes.json` versionné et se termine en succès.
 * Le build n'est donc JAMAIS bloqué par une panne de synchronisation.
 */
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const FICHIER_JSON = path.join(__dirname, 'parsed-routes.json');
const FICHIER_TRACE = path.join(__dirname, 'sheet-sync.json');

// Garde-fous anti-CSV tronqué : la grille réelle contient 843 trajets et 52 lieux.
const MIN_ROUTES = 500;
const MIN_PLACES = 40;
const TIMEOUT_MS = 20000;

// ----------------------------- .env -----------------------------

// Lecture minimale de .env (sans dépendance) : les variables déjà présentes dans
// l'environnement (Vercel, CI) ne sont jamais écrasées.
function chargerEnv() {
  const chemin = path.join(RACINE, '.env');
  if (!fs.existsSync(chemin)) return;
  fs.readFileSync(chemin, 'utf8')
    .split('\n')
    .forEach(function (ligne) {
      const m = ligne.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) return;
      let valeur = m[2].trim();
      if (/^".*"$/.test(valeur) || /^'.*'$/.test(valeur)) valeur = valeur.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = valeur;
    });
}

// ----------------------------- CSV -----------------------------

function parseLine(line) {
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      parts.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  parts.push(cur.trim());
  return parts;
}

// "Fidjrossè, Cotonou" -> nom + commune + clé de commune. Identique à parse-sheet.cjs.
function extractPlace(str) {
  const brut = str.replace(/^"|"$/g, '').trim();
  if (brut === 'Pahou') return { name: 'Pahou', commune: 'Ouidah', communeKey: 'ouidah', raw: brut };
  if (brut.includes(',')) {
    const idx = brut.lastIndexOf(',');
    const name = brut.slice(0, idx).trim();
    const comm = brut.slice(idx + 1).trim();
    let communeKey = 'cotonou';
    if (comm.toLowerCase().includes('calavi')) communeKey = 'calavi';
    else if (comm.toLowerCase().includes('porto')) communeKey = 'portonovo';
    else if (comm.toLowerCase().includes('ouidah')) communeKey = 'ouidah';
    else if (comm.toLowerCase().includes('seme')) communeKey = 'seme';
    return { name, commune: comm, communeKey, raw: brut };
  }
  return { name: brut, commune: brut, communeKey: brut.toLowerCase(), raw: brut };
}

// Retourne { routes, places } ou lève une erreur si le CSV est inexploitable.
function parseCsv(csv) {
  const lignes = csv.split(/\r?\n/).filter(function (l) { return l.trim(); });
  const entete = lignes.find(function (l) { return /d[ée]part/i.test(l) && /arriv[ée]e/i.test(l); });
  if (!entete) throw new Error('en-tête « Départ,Arrivée » introuvable');

  const routes = [];
  const places = new Map();
  let invalides = 0;

  lignes.forEach(function (ligne) {
    if (ligne === entete) return;
    const parts = parseLine(ligne);
    if (parts.length < 4) {
      invalides++;
      return;
    }
    const dist = parseFloat(String(parts[2]).replace(',', '.'));
    const tarif = parseInt(String(parts[3]).replace(/[^\d-]/g, ''), 10);
    if (!isFinite(dist) || dist <= 0 || !isFinite(tarif) || tarif <= 0) {
      invalides++;
      return;
    }
    const dep = extractPlace(parts[0]);
    const dst = extractPlace(parts[1]);
    if (!dep.name || !dst.name) {
      invalides++;
      return;
    }
    routes.push({ dep: dep, dst: dst, dist: dist, tarif: tarif });
    places.set(dep.raw, dep);
    places.set(dst.raw, dst);
  });

  if (routes.length < MIN_ROUTES) throw new Error('seulement ' + routes.length + ' trajets exploitables');
  if (places.size < MIN_PLACES) throw new Error('seulement ' + places.size + ' lieux distincts');
  if (invalides > routes.length * 0.1) throw new Error(invalides + ' lignes illisibles (CSV probablement tronqué)');

  return { routes: routes, places: Array.from(places.values()), invalides: invalides };
}

// ----------------------------- Écriture -----------------------------

function ecrireSiDifferent(chemin, contenu) {
  const ancien = fs.existsSync(chemin) ? fs.readFileSync(chemin, 'utf8') : null;
  if (ancien === contenu) return false;
  const temporaire = chemin + '.tmp';
  fs.writeFileSync(temporaire, contenu);
  fs.renameSync(temporaire, chemin); // écriture atomique : jamais de fichier à moitié écrit
  return true;
}

function tracer(source, detail) {
  const info = { source: source, url: detail.url || null, fetchedAt: detail.fetchedAt || null, routes: detail.routes || null, places: detail.places || null, invalides: detail.invalides || 0, note: detail.note || '' };
  try { fs.writeFileSync(FICHIER_TRACE, JSON.stringify(info, null, 2) + '\n'); } catch (e) { /* trace non bloquante */ }
}

function regenerer(nouveauJson) {
  if (!nouveauJson) {
    const actuel = fs.readFileSync(FICHIER_JSON, 'utf8');
    const data = JSON.parse(actuel);
    console.log('[sync-sheet] parsed-routes.json conservé : ' + data.routes.length + ' trajets / ' + data.places.length + ' lieux.');
  }
  require('./generate-data.cjs');
}

// ----------------------------- Programme -----------------------------

async function main() {
  chargerEnv();
  const url = (process.env.SHEET_CSV_URL || '').trim();

  if (!url) {
    console.log('[sync-sheet] SHEET_CSV_URL absent : source = parsed-routes.json versionné (fallback).');
    tracer('fallback', { note: 'SHEET_CSV_URL absent' });
    regenerer(false);
    return;
  }

  const debut = Date.now();
  try {
    const ctl = new AbortController();
    const timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
    const res = await fetch(url, { redirect: 'follow', signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const csv = await res.text();
    const data = parseCsv(csv);
    const contenu = JSON.stringify({ routes: data.routes, places: data.places }, null, 2);
    const change = ecrireSiDifferent(FICHIER_JSON, contenu);

    console.log('[sync-sheet] grille récupérée depuis le CSV public : ' + data.routes.length + ' trajets, ' + data.places.length + ' lieux (' + Math.round((Date.now() - debut) / 100) / 10 + ' s' + (change ? ', fichier mis à jour' : ', inchangé') + ').');
    tracer('web', { url: url.replace(/\/[^/]*$/, '/…'), fetchedAt: new Date().toISOString(), routes: data.routes.length, places: data.places.length, invalides: data.invalides });
    regenerer(true);
  } catch (e) {
    // Fallback silencieux côté build, mais visible dans les logs.
    console.warn('[sync-sheet] récupération impossible (' + (e && e.message ? e.message : e) + ') : parsed-routes.json versionné conservé.');
    tracer('fallback', { url: url.replace(/\/[^/]*$/, '/…'), note: String((e && e.message) || e) });
    regenerer(false);
  }
}

main().catch(function (e) {
  console.error('[sync-sheet] échec inattendu : ' + e);
  console.error('Le fichier parsed-routes.json versionné reste la source ; vérifiez-le (npm run test:routes).');
  process.exit(1);
});
