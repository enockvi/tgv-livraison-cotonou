/**
 * Normalisation des noms de lieux — SOURCE DE VÉRITÉ UNIQUE côté build.
 *
 * ⚠️ Cette implémentation DOIT produire exactement le même résultat que
 * `src/utils/routeKeys.ts` (côté application). Si les deux divergent, les clés de
 * `src/data/routesMatrix.json` ne correspondent plus aux clés calculées au runtime et
 * les tests de `scripts/test-routes.ts` échouent bruyamment (c'est le filet de sécurité).
 */
function normalizePlaceName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents : Fidjrossè -> fidjrosse, Vèdoko -> vedoko
    .replace(/\s*\(.*?\)/g, '') // parenthèses éventuelles
    // Retire le suffixe de commune quand il est explicite : « Sainte Rita, Cotonou » -> « sainte rita ».
    // (Volontairement limité au cas avec virgule : « Pahou » est un quartier, pas une commune à retirer.)
    .replace(/,\s*(cotonou|abomey[-\s]?calavi|calavi|porto[-\s]?novo|portonovo|ouidah|seme[-\s]?podji|seme)\s*$/, '')
    .replace(/[’']/g, ' ') // apostrophes : Patte d'Oie -> patte d oie
    .replace(/[,;]/g, '')
    .replace(/\s*\/\s*/g, ' / ') // "Jéricho/Marocana" et "Jéricho / Marocana" -> identiques
    .replace(/\s+/g, ' ')
    .trim();
}

// Clé de paire non ordonnée : le trajet A->B et B->A partagent la même clé.
function getRouteKey(a, b) {
  return [normalizePlaceName(a), normalizePlaceName(b)].sort().join('|');
}

module.exports = { normalizePlaceName, getRouteKey };
