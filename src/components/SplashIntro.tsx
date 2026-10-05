import React, { useCallback, useEffect, useRef } from 'react';

// `?raw` : le contenu de Splashscreem.html (racine du projet) est intégré TEL QUEL au bundle.
// Ce fichier est donc l'unique source de vérité du splash — aucun portage, aucun décalage possible.
import splashHtml from '../../Splashscreem.html?raw';

interface SplashIntroProps {
  onComplete: () => void;
}

/** Doit rester aligné sur la constante HOLD_MS du fichier Splashscreem.html. */
const HOLD_MS = 900;

/** Marge de sécurité si la détection de fin d'animation est indisponible. */
const SAFETY_MARGIN_MS = 400;

/**
 * SplashIntro — affiche la maquette `Splashscreem.html` à l'identique.
 *
 * Choix technique : le fichier est injecté dans une iframe `srcDoc`. Un document
 * `srcdoc` hérite de l'origine de la page, on peut donc observer son DOM sans le
 * modifier : l'élément `#tag` reçoit la classe `on` quand l'animation est terminée
 * (voir `finish()` dans Splashscreem.html). On en déduit le moment où rendre la main
 * à l'application — le fichier reste ainsi inchangé et demeure la source exacte.
 *
 * Un calque transparent au-dessus de l'iframe sert de bouton « passer » : le fichier
 * ne reçoit aucun clic, son propre gestionnaire (rejouer) n'est jamais déclenché.
 */
export const SplashIntro: React.FC<SplashIntroProps> = ({ onComplete }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<MutationObserver | undefined>(undefined);
  const holdRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  }, []);

  // Accessibilité : si l'utilisateur limite les animations, on entre directement dans l'app.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      complete();
    }
  }, [complete]);

  // Filet de sécurité : si l'observation du DOM échoue, on calcule la durée de l'animation
  // avec la même formule que Splashscreem.html (2200 + largeur * 0.9) + le délai de départ.
  useEffect(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 400;
    const estimated = 250 + (2200 + width * 0.9) + HOLD_MS + SAFETY_MARGIN_MS;
    safetyRef.current = setTimeout(complete, estimated);
    return () => {
      if (safetyRef.current !== undefined) clearTimeout(safetyRef.current);
    };
  }, [complete]);

  // Nettoyage des observateurs et minuteries.
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (holdRef.current !== undefined) clearTimeout(holdRef.current);
      if (safetyRef.current !== undefined) clearTimeout(safetyRef.current);
    };
  }, []);

  // Bloquer le défilement de l'arrière-plan tant que l'intro est affichée.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleFrameLoad = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;

    const tag = doc.getElementById('tag');
    if (!tag) return;

    // `finish()` ajoute la classe « on » : c'est le signal de fin, sans toucher au fichier.
    const checkDone = () => {
      if (!tag.classList.contains('on')) return;
      if (holdRef.current !== undefined) return;
      holdRef.current = setTimeout(complete, HOLD_MS);
    };

    checkDone();

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(checkDone);
      observer.observe(tag, { attributes: true, attributeFilter: ['class'] });
      observerRef.current = observer;
    }
  }, [complete]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#07401F]"
      role="dialog"
      aria-modal="true"
      aria-label="Introduction TGV Livraison"
    >
      <iframe
        ref={frameRef}
        title="Animation d'introduction TGV Livraison"
        srcDoc={splashHtml}
        onLoad={handleFrameLoad}
        scrolling="no"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Calque de sortie : un tap n'importe où passe immédiatement à l'application. */}
      <button
        type="button"
        onClick={complete}
        aria-label="Passer l'introduction et accéder à l'application"
        className="absolute inset-0 w-full h-full cursor-pointer bg-transparent outline-none"
      />
    </div>
  );
};
