/**
 * Normalisation des noms de lieux — SOURCE DE VÉRITÉ UNIQUE côté application.
 *
 * ⚠️ Doit rester strictement identique à `scripts/lib/route-normalize.cjs`, qui construit
 * les clés de `src/data/routesMatrix.json` au moment du build. Toute divergence entre les
 * deux implémentations fait échouer `npm run test:routes` (vérifié sur les 52 quartiers).
 */
export function normalizePlaceName(name: string): string {
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
export function getRouteKey(a: string, b: string): string {
  return [normalizePlaceName(a), normalizePlaceName(b)].sort().join('|');
}
