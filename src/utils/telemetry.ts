/**
 * Signalement des trajets non desservis (paire absente du CSV officiel).
 *
 * La grille ne contient QUE les 843 liaisons officielles : aucune extrapolation. Quand une
 * paire inconnue est demandée (cas normalement impossible depuis l'interface, qui ne propose
 * que les destinations réellement desservies), on journalise au lieu de facturer un prix inventé.
 */
const dejaSignales = new Set<string>();
let silencieuse = false;

/** Utilisé par les tests pour éviter des milliers de lignes de log. */
export function setTelemetrySilencieuse(valeur: boolean): void {
  silencieuse = valeur;
}

export function signalerTrajetHorsGrille(dep: string, dst: string): void {
  const cle = `${dep} → ${dst}`;
  if (dejaSignales.has(cle)) return;
  dejaSignales.add(cle);
  if (silencieuse) return;
  console.warn(
    `[TGV] Liaison inconnue « ${cle} » : paire absente du CSV officiel, aucun tarif ne peut être calculé.`
  );
}

// Utilitaire de diagnostic (console) : paires inconnues rencontrées dans la session.
export function trajetsHorsGrille(): string[] {
  return Array.from(dejaSignales);
}
