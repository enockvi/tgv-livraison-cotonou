/**
 * Génère les données de l'application À PARTIR DU SEUL CONTENU DU CSV OFFICIEL
 * (`scripts/parsed-routes.json`, lui-même produit depuis le CSV de 843 lignes).
 *
 * RÈGLE ABSOLUE : aucune ligne n'est ajoutée, aucune valeur n'est extrapolée.
 *   1 ligne du CSV  =  1 liaison dans `src/data/routesMatrix.json`.
 * Les paires absentes du CSV ne sont PAS tarifées : l'application les signalera comme
 * « non desservies » au lieu d'inventer un prix (voir calculateRouteDetails).
 *
 * Les noms de quartiers exposés à l'interface sont exactement ceux du CSV : ils sont
 * recopiés tels quels dans `src/data/sheetQuartiers.json`, qui est la source de la liste
 * affichée à l'étape 2.
 */
const fs = require('fs');
const data = require('./parsed-routes.json');
const { getRouteKey } = require('./lib/route-normalize.cjs');

// Écriture uniquement si le contenu change : évite de salir le dépôt à chaque build.
function ecrireSiDifferent(chemin, contenu) {
  const ancien = fs.existsSync(chemin) ? fs.readFileSync(chemin, 'utf8') : null;
  if (ancien === contenu) return false;
  fs.writeFileSync(chemin, contenu);
  return true;
}

// Libellés d'affichage des communes (les clés viennent des données, pas l'inverse).
const communes = {
  cotonou: 'Cotonou',
  calavi: 'Abomey-Calavi',
  portonovo: 'Porto-Novo',
  ouidah: 'Ouidah & Pahou',
  seme: 'Sémè-Podji'
};

// Liste des quartiers telle qu'écrite dans le CSV, regroupée par commune puis triée.
const quartiersByCommune = {
  cotonou: [],
  calavi: [],
  portonovo: [],
  ouidah: [],
  seme: []
};

data.places.forEach((p) => {
  // Défensif : une commune inattendue dans le CSV ne doit pas casser le build.
  if (!quartiersByCommune[p.communeKey]) quartiersByCommune[p.communeKey] = [];
  quartiersByCommune[p.communeKey].push(p.name);
});

Object.keys(quartiersByCommune).forEach((k) => {
  quartiersByCommune[k] = Array.from(new Set(quartiersByCommune[k])).sort((a, b) => a.localeCompare(b, 'fr'));
});

// Table officielle : une entrée par ligne du CSV, clé de paire non ordonnée (A→B = B→A).
const table = {};
const doublons = [];

data.routes.forEach((r) => {
  const cle = getRouteKey(r.dep.name, r.dst.name);
  if (table[cle]) {
    // Le CSV contient déjà la même liaison (dans un sens ou dans l'autre) : on conserve
    // la première ligne et on le signale, sans jamais moyenner ni remplacer une valeur.
    doublons.push(cle);
    return;
  }
  table[cle] = [r.dist, r.tarif];
});

const liaisons = Object.keys(table).length;
const quartiers = Object.values(quartiersByCommune).reduce((n, liste) => n + liste.length, 0);

console.log('Lignes du CSV            : ' + data.routes.length);
console.log('Liaisons officielles     : ' + liaisons + ' (aucune paire calculée)');
console.log('Quartiers du CSV         : ' + quartiers);
if (doublons.length > 0) {
  console.warn('⚠️  ' + doublons.length + ' liaison(s) en doublon dans le CSV, première occurrence conservée : ' + doublons.slice(0, 5).join(', '));
}

// Write to files (uniquement si le contenu a changé)
const majMatrice = ecrireSiDifferent('src/data/routesMatrix.json', JSON.stringify(table));
const majQuartiers = ecrireSiDifferent(
  'src/data/sheetQuartiers.json',
  JSON.stringify({ communes, quartiersByCommune }, null, 2)
);

console.log(
  'Generation completed successfully.' +
    (majMatrice ? ' [routesMatrix.json mis à jour]' : ' [routesMatrix.json inchangé]') +
    (majQuartiers ? ' [sheetQuartiers.json mis à jour]' : ' [sheetQuartiers.json inchangé]')
);
