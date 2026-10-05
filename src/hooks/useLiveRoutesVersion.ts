import { useEffect, useState } from 'react';
import { abonnerRoutesLive, versionRoutesLive } from '../data/routesLive';

/**
 * Re-rend le composant quand la grille tarifaire live arrive (ou change).
 * Au premier rendu, la grille de build est utilisée ; dès que le Sheet répond,
 * les liaisons sont mises à jour sans rechargement de page.
 */
export function useLiveRoutesVersion(): number {
  const [version, setVersion] = useState(() => versionRoutesLive());

  useEffect(() => abonnerRoutesLive(() => setVersion(versionRoutesLive())), []);

  return version;
}
