/**
 * Tests de la grille tarifaire STRICTE (843 liaisons du CSV) et de la normalisation des lieux.
 * Exécution : `npm run test:routes` (tsx).
 *
 * Invariant central : l'application ne facture QUE les lignes du CSV officiel.
 *   - chaque ligne du CSV doit être retrouvée à l'identique (distance ET tarif) ;
 *   - toute paire absente du CSV doit renvoyer tarif 0 / isExactSheetRoute=false
 *     (donc « à confirmer »), jamais un prix extrapolé ;
 *   - la liste des quartiers affichés est exactement celle du CSV.
 */
import {
  ALL_QUARTIERS,
  NOMBRE_LIAISONS,
  QUARTIERS_BY_COMMUNE,
  calculateRouteDetails,
  estLiaisonOfficielle,
  getRouteKey,
  liaisonsDepuis,
  normalizePlaceName,
} from '../src/data/communes';
import { setTelemetrySilencieuse } from '../src/utils/telemetry';
import sheetQuartiers from '../src/data/sheetQuartiers.json';
import routesMatrix from '../src/data/routesMatrix.json';
import parsedRoutes from '../scripts/parsed-routes.json';
import { getRouteKey as getRouteKeyBuild } from '../scripts/lib/route-normalize.cjs';

// Les paires absentes du CSV déclencheraient une ligne de log chacune : inutile ici.
setTelemetrySilencieuse(true);

const echecs: string[] = [];
const avertissements: string[] = [];

function verifier(condition: boolean, message: string): void {
  if (!condition) echecs.push(message);
}

function quitter(code: number): void {
  const p = (globalThis as { process?: { exit: (c: number) => void } }).process;
  if (p) p.exit(code);
}

// --------------------------- 1. Normalisation ---------------------------

const pairesEquivalentes: [string, string][] = [
  ['Fidjrossè', 'fidjrosse'],
  ['Vèdoko', 'Vedoko'],
  ['Zogbadjè', 'Zogbadje'],
  ['Jéricho / Marocana', 'Jericho/Marocana'],
  ['Patte d’Oie', "Patte d'Oie"],
  ['Akpakpa Dodomè', 'akpakpa dodome'],
  ['Sainte Rita, Cotonou', 'Sainte Rita'],
  ['Étoile Rouge', 'Etoile Rouge'],
  ['  Sémè   Centre  ', 'Seme Centre'],
  ['Quartier (bis)', 'Quartier'],
];

pairesEquivalentes.forEach(([a, b]) => {
  verifier(
    normalizePlaceName(a) === normalizePlaceName(b),
    `normalisation : « ${a} » et « ${b} » devraient donner la même clé (obtenu « ${normalizePlaceName(a)} » / « ${normalizePlaceName(b)} »)`
  );
});

verifier(getRouteKey('Fidjrossè', 'Agla') === getRouteKey('Agla', 'Fidjrossè'), 'la clé de paire doit être symétrique');

const echantillon = [...new Set([...ALL_QUARTIERS.map((q) => q.name), 'Pahou', 'Jéricho / Marocana'])];
echantillon.forEach((nom) => {
  verifier(
    normalizePlaceName(nom) === getRouteKeyBuild(nom, nom).split('|')[0],
    `divergence build/application pour le lieu « ${nom} » : « ${normalizePlaceName(nom)} » ne correspond pas à la normalisation du build`
  );
});

// --------------------------- 2. La liste des quartiers vient du CSV ---------------------------

const quartiersApp = ALL_QUARTIERS.map((q) => q.name).sort();
const quartiersCsv = (Object.values(sheetQuartiers.quartiersByCommune as Record<string, string[]>)
  .flat() as string[]).sort();

verifier(quartiersApp.join('|') === quartiersCsv.join('|'),
  `la liste des quartiers de l'application doit être EXACTEMENT celle du CSV (app : ${quartiersApp.length}, CSV : ${quartiersCsv.length})`);

const lieuxCsv = new Set(parsedRoutes.places.map((p) => p.name));
quartiersApp.forEach((nom) => {
  verifier(lieuxCsv.has(nom), `le quartier « ${nom} » n'existe pas dans le CSV`);
});

// Une commune vide ne doit pas être proposée dans l'interface.
const communesVides = Object.entries(QUARTIERS_BY_COMMUNE as Record<string, string[]>)
  .filter(([, liste]) => liste.length === 0)
  .map(([k]) => k);
if (communesVides.length > 0) {
  avertissements.push(`communes sans quartier (masquées dans l'interface) : ${communesVides.join(', ')}`);
}

// --------------------------- 3. Chaque ligne du CSV doit être servie à l'identique ---------------------------

verifier(NOMBRE_LIAISONS === parsedRoutes.routes.length,
  `la matrice doit contenir une entrée par ligne du CSV (matrice : ${NOMBRE_LIAISONS}, CSV : ${parsedRoutes.routes.length})`);

let lignesVerifiees = 0;
parsedRoutes.routes.forEach((r, index) => {
  lignesVerifiees++;
  const cle = getRouteKey(r.dep.name, r.dst.name);
  const entree = (routesMatrix as unknown as Record<string, [number, number]>)[cle];
  if (!entree) {
    echecs.push(`ligne ${index + 1} du CSV absente de la matrice : ${r.dep.name} → ${r.dst.name} (clé ${cle})`);
    return;
  }
  if (entree[0] !== r.dist) echecs.push(`distance altérée ligne ${index + 1} (${r.dep.name} → ${r.dst.name}) : CSV ${r.dist} vs matrice ${entree[0]}`);
  if (entree[1] !== r.tarif) echecs.push(`tarif altéré ligne ${index + 1} (${r.dep.name} → ${r.dst.name}) : CSV ${r.tarif} vs matrice ${entree[1]}`);

  const aller = calculateRouteDetails(r.dep.name, r.dst.name);
  const retour = calculateRouteDetails(r.dst.name, r.dep.name);
  if (!aller.isExactSheetRoute) echecs.push(`l'application ne trouve pas la liaison ${r.dep.name} → ${r.dst.name}`);
  if (aller.distance !== r.dist || aller.tarif !== r.tarif) {
    echecs.push(`valeur inattendue pour ${r.dep.name} → ${r.dst.name} : ${aller.distance} km / ${aller.tarif} FCFA (CSV : ${r.dist} / ${r.tarif})`);
  }
  if (retour.tarif !== r.tarif || retour.distance !== r.dist) {
    echecs.push(`asymétrie sur ${r.dep.name} ↔ ${r.dst.name} : ${aller.tarif} vs ${retour.tarif}`);
  }
});

// --------------------------- 4. AUCUN prix inventé hors CSV ---------------------------

const nomsQuartiers = ALL_QUARTIERS.map((q) => q.name);
let pairesExactes = 0;
let pairesInconnues = 0;
let prixInventes = 0;
let liaisonsIndexees = 0;

nomsQuartiers.forEach((dep) => {
  const destinations = liaisonsDepuis(dep);
  liaisonsIndexees += destinations.length;

  const vus = new Set<string>();
  destinations.forEach((l) => {
    if (vus.has(l.quartier.name)) echecs.push(`destination en double dans l'index : ${dep} → ${l.quartier.name}`);
    vus.add(l.quartier.name);
    if (l.quartier.name === dep) echecs.push(`une liaison ne peut pas pointer sur elle-même : ${dep}`);
    if (!estLiaisonOfficielle(dep, l.quartier.name)) echecs.push(`liaison indexée mais absente du CSV : ${dep} → ${l.quartier.name}`);
    if (!(l.distance > 0) || !(l.tarif > 0)) echecs.push(`liaison sans distance/tarif valide : ${dep} → ${l.quartier.name}`);
  });

  for (let i = 1; i < destinations.length; i++) {
    if (destinations[i - 1].distance > destinations[i].distance) {
      echecs.push(`les destinations de ${dep} ne sont pas triées par distance croissante`);
      break;
    }
  }

  nomsQuartiers.forEach((dst) => {
    const details = calculateRouteDetails(dep, dst);
    if (details.isExactSheetRoute) {
      pairesExactes++;
      if (dep === dst) echecs.push(`le CSV ne contient aucune liaison intra-quartier : ${dep}`);
      if (!(details.tarif > 0)) echecs.push(`tarif invalide sur une liaison exacte : ${dep} → ${dst}`);
    } else {
      pairesInconnues++;
      if (details.tarif !== 0 || details.distance !== 0) {
        prixInventes++;
        echecs.push(`PAIRE NON DESSERVIE TARIFÉE : ${dep} → ${dst} renvoie ${details.tarif} FCFA / ${details.distance} km`);
      }
    }
  });
});

verifier(pairesExactes === NOMBRE_LIAISONS * 2,
  `paires exactes attendues : ${NOMBRE_LIAISONS * 2} (= 843 liaisons × 2 sens), obtenues : ${pairesExactes}`);
verifier(liaisonsIndexees === NOMBRE_LIAISONS * 2,
  `index de liaisons attendu : ${NOMBRE_LIAISONS * 2} entrées dirigées, obtenu : ${liaisonsIndexees}`);
verifier(prixInventes === 0, `${prixInventes} paire(s) non desservie(s) se voient attribuer un tarif : c'est interdit`);

// --------------------------- 5. Contrats de repli ---------------------------

const vide = calculateRouteDetails('', '');
verifier(vide.tarif === 0 && vide.distance === 0 && !vide.isExactSheetRoute, 'entrée vide : doit renvoyer distance 0 / tarif 0 / exact=false');

const inconnu = calculateRouteDetails('Zone inconnue XYZ', 'Autre zone ABC');
verifier(!inconnu.isExactSheetRoute && inconnu.tarif === 0, 'un trajet hors CSV doit être signalé non desservi, sans tarif');

const memeQuartier = calculateRouteDetails(nomsQuartiers[0], nomsQuartiers[0]);
verifier(!memeQuartier.isExactSheetRoute && memeQuartier.tarif === 0, 'un trajet intra-quartier n’existe pas dans le CSV et ne doit pas être tarifé');

// --------------------------- Résultat ---------------------------

const destinationsParQuartier = nomsQuartiers.map((q) => liaisonsDepuis(q).length);
const min = Math.min(...destinationsParQuartier);
const max = Math.max(...destinationsParQuartier);
const moyenne = destinationsParQuartier.reduce((n, v) => n + v, 0) / destinationsParQuartier.length;

console.log('');
console.log('— Grille tarifaire (CSV strict) —');
console.log(`lignes du CSV            : ${lignesVerifiees}`);
console.log(`liaisons officielles     : ${NOMBRE_LIAISONS} (aucune paire calculée)`);
console.log(`quartiers du CSV         : ${quartiersApp.length}`);
console.log(`paires exactes vérifiées : ${pairesExactes} (les 2 sens)`);
console.log(`paires non desservies    : ${pairesInconnues} → tarif 0, à confirmer`);
console.log(`destinations par quartier: min ${min} · max ${max} · moy ${moyenne.toFixed(1)}`);
avertissements.forEach((a) => console.warn(`[avertissement] ${a}`));

if (echecs.length > 0) {
  console.error('');
  echecs.slice(0, 20).forEach((e) => console.error(`[échec] ${e}`));
  if (echecs.length > 20) console.error(`… et ${echecs.length - 20} autres échecs`);
  console.error(`\n${echecs.length} échec(s).`);
  quitter(1);
}

console.log('\n✅ Grille stricte conforme : aucune ligne ajoutée, aucun tarif extrapolé.');
