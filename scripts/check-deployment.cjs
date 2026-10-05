/**
 * Diagnostic du déploiement Google Apps Script (`npm run check:sheet`).
 *
 * Vérifie, dans cet ordre et SANS RIEN ÉCRIRE dans la feuille :
 *   1. GET /exec        -> le déploiement expose-t-il doGet (donc la version 1.2.0+) ?
 *   2. POST action:status -> le token de .env est-il accepté par le script déployé ?
 *   3. POST action:routes -> UNIQUEMENT si l'étape 1 prouve que le script déployé connaît
 *      cette action. Sinon on s'arrête : sur l'ancienne version, une action inconnue
 *      retombait dans la branche d'ENREGISTREMENT et ajoutait une ligne vide à « Commandes ».
 *
 * Lecture seule de bout en bout : aucune commande n'est créée, aucun tarif n'est modifié.
 */
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const TIMEOUT_MS = 20000;

function chargerEnv() {
  const chemin = path.join(RACINE, '.env');
  if (!fs.existsSync(chemin)) return;
  fs.readFileSync(chemin, 'utf8').split('\n').forEach(function (ligne) {
    const m = ligne.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) return;
    let valeur = m[2].trim();
    if (/^".*"$/.test(valeur) || /^'.*'$/.test(valeur)) valeur = valeur.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = valeur;
  });
}

async function appel(url, options) {
  const ctl = new AbortController();
  const timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
  const debut = Date.now();
  try {
    const res = await fetch(url, Object.assign({ redirect: 'follow', signal: ctl.signal }, options));
    const texte = await res.text();
    return { status: res.status, texte: texte, duree: Date.now() - debut };
  } finally {
    clearTimeout(timer);
  }
}

function extraireVersion(texte) {
  try {
    const j = JSON.parse(texte);
    return j && j.ok === true && typeof j.version === 'string' ? j.version : null;
  } catch (e) {
    return null;
  }
}

async function main() {
  chargerEnv();
  const url = (process.env.SHEET_WEBHOOK_URL || '').trim();
  const token = (process.env.SHEET_TOKEN || '').trim();

  console.log('— Diagnostic du déploiement Apps Script —\n');
  if (!url || !token) {
    console.log('❌ SHEET_WEBHOOK_URL ou SHEET_TOKEN absent de .env : rien à tester.');
    process.exit(1);
  }
  console.log('URL /exec      :', url.slice(0, 60) + '…');
  console.log('Token (long.)  :', token.length, 'caractères\n');

  // 1) doGet
  let version = null;
  try {
    const g = await appel(url, { method: 'GET' });
    version = extraireVersion(g.texte);
    console.log('1) GET /exec        : HTTP ' + g.status + ' en ' + g.duree + ' ms');
    if (version) {
      console.log('   ✅ doGet présent — version déployée : ' + version);
    } else {
      const extrait = g.texte.replace(/\s+/g, ' ').slice(0, 90);
      console.log('   ⚠️  doGet absent — le déploiement est ANTÉRIEUR à la version 1.2.0');
      console.log('       Réponse : ' + extrait);
      console.log('       -> action:"routes" est indisponible tant que le déploiement n\'est pas mis à jour.');
      console.log('       -> NE PAS tester action:"routes" maintenant : l\'ancien script écrirait une ligne vide.');
    }
  } catch (e) {
    console.log('1) GET /exec        : ❌ ' + e.message);
  }

  // 2) Token via l'action status (lecture seule, aucune écriture possible)
  let tokenOk = false;
  try {
    const p = await appel(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ token: token, action: 'status', ids: [] })
    });
    const j = (function () { try { return JSON.parse(p.texte); } catch (e) { return null; } })();
    console.log('\n2) POST action:status : HTTP ' + p.status + ' en ' + p.duree + ' ms');
    if (j && j.ok) {
      tokenOk = true;
      console.log('   ✅ Token accepté par le script déployé (statuts renvoyés : ' + Object.keys(j.statuts || {}).length + ')');
    } else if (j && j.error === 'unauthorized') {
      console.log('   ❌ Token REFUSÉ (unauthorized) : les valeurs Vercel / Apps Script ne correspondent pas.');
    } else if (j && j.error === 'token_non_configure') {
      console.log('   ❌ Propriété SHEET_TOKEN absente dans le script déployé (version 1.1.0+ sans propriété).');
    } else {
      console.log('   ⚠️  Réponse inattendue : ' + p.texte.replace(/\s+/g, ' ').slice(0, 150));
    }
  } catch (e) {
    console.log('\n2) POST action:status : ❌ ' + e.message);
  }

  // 3) Grille tarifaire live — uniquement si le déploiement est prouvé récent
  if (!version || !tokenOk) {
    console.log('\n3) Grille tarifaire live : test ignoré (déploiement non conforme ou token invalide).');
    console.log('\nConclusion : corrigez les points ci-dessus, puis relancez npm run check:sheet.');
    process.exit(0);
  }

  try {
    const p = await appel(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ token: token, action: 'routes' })
    });
    const j = (function () { try { return JSON.parse(p.texte); } catch (e) { return null; } })();
    console.log('\n3) POST action:routes : HTTP ' + p.status + ' en ' + p.duree + ' ms');
    if (!j || !j.ok) {
      console.log('   ❌ Grille indisponible : ' + ((j && j.error) || 'réponse illisible'));
      if (j && j.error === 'onglet_tarifs_introuvable') {
        console.log('       -> renseignez la propriété de script ONGLET_TARIFS avec le nom exact de l\'onglet.');
      }
      if (j && j.error === 'colonnes_tarifs_introuvables') {
        console.log('       -> en-têtes trouvés : ' + JSON.stringify(j.entete));
      }
      process.exit(1);
    }

    const locales = (function () {
      try { return require('./parsed-routes.json').routes.length; } catch (e) { return null; }
    })();
    const lignes = Array.isArray(j.routes) ? j.routes.length : 0;
    console.log('   ✅ Grille live : ' + lignes + ' trajets, onglet « ' + j.onglet + ' »');
    console.log('      générée le      : ' + j.generatedAt);
    console.log('      snapshot local  : ' + (locales === null ? 'inconnu' : locales + ' trajets (scripts/parsed-routes.json)'));
    if (locales !== null && lignes !== locales) {
      console.log('      ℹ️  ÉCART de ' + Math.abs(lignes - locales) + ' trajets : le Sheet a évolué depuis le dernier build.');
    }
    console.log('      exemple         : ' + JSON.stringify((j.routes || [])[0]));
  } catch (e) {
    console.log('\n3) POST action:routes : ❌ ' + e.message);
    process.exit(1);
  }
}

main();
