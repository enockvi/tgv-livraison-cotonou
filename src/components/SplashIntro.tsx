import React, { useCallback, useEffect, useRef, useState } from 'react';

interface SplashIntroProps {
  onComplete: () => void;
}

/** Durée d'affichage du slogan une fois le motard arrivé au bout. */
const HOLD_MS = 900;

/** Marge (px) ajoutée de part et d'autre du trajet du motard. */
const RIDER_MARGIN = 40;

/**
 * SplashIntro — portage fidèle de la maquette `Splashscreem.html` (racine du projet).
 *
 * Principes conservés à l'identique :
 *  - scène en position absolue, route horizontale fixée à 52 % de la hauteur ;
 *  - motard ancré sur la route (`bottom: calc(48% - 1px)`) et non dans le flux flex ;
 *  - le titre est révélé par `clip-path` en fonction de la position exacte du motard ;
 *  - typographie Sora 800 inclinée (`skewX(-9deg)`) avec tailles `clamp()` fluides ;
 *  - durée proportionnelle à la largeur de l'écran ;
 *  - `prefers-reduced-motion` court-circuite l'animation.
 *
 * Intégration applicative : un tap (ou Entrée / Espace / Échap) passe immédiatement
 * à l'application ; sinon l'écran se termine seul après l'animation.
 */
export const SplashIntro: React.FC<SplashIntroProps> = ({ onComplete }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const riderRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);

  const [tagVisible, setTagVisible] = useState(false);
  const finishedRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const holdRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const stage = stageRef.current;
    const rider = riderRef.current;
    const word = wordRef.current;

    if (word) word.style.clipPath = 'none';
    if (stage && rider) rider.style.transform = `translateX(${stage.clientWidth + 200}px)`;

    setTagVisible(true);
    holdRef.current = setTimeout(() => onCompleteRef.current(), HOLD_MS);
  }, []);

  const play = useCallback(() => {
    if (finishedRef.current) return;

    const stage = stageRef.current;
    const rider = riderRef.current;
    const word = wordRef.current;
    if (!stage || !rider || !word) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      finish();
      return;
    }

    const width = stage.clientWidth;
    const riderWidth = rider.offsetWidth || 96;
    const from = -riderWidth - RIDER_MARGIN;
    const to = width + RIDER_MARGIN;
    // Plus l'écran est large, plus le trajet dure (même courbe que la maquette).
    const duration = 2200 + width * 0.9;
    const start = performance.now();

    // Boîte du titre mesurée AVANT l'animation : c'est elle qui détermine la découpe.
    const wordBox = word.getBoundingClientRect();
    const stageLeft = stage.getBoundingClientRect().left;

    word.style.clipPath = 'inset(-12px 100% -12px 0)';

    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const x = from + (to - from) * progress;
      rider.style.transform = `translateX(${x}px)`;

      const edge = x + riderWidth * 0.06 + stageLeft - wordBox.left;
      const cut = Math.max(-20, Math.min(wordBox.width, wordBox.width - edge));
      word.style.clipPath = `inset(-12px ${cut}px -12px 0)`;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        finish();
      }
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [finish]);

  // Démarrage après le chargement des polices : évite un reflow du titre en pleine animation.
  useEffect(() => {
    let cancelled = false;
    let startTimer: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      if (cancelled) return;
      startTimer = setTimeout(() => {
        if (!cancelled) play();
      }, 250);
    };

    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts && fonts.ready) {
      fonts.ready.then(start).catch(start);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      if (startTimer !== undefined) clearTimeout(startTimer);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      if (holdRef.current !== undefined) clearTimeout(holdRef.current);
    };
  }, [play]);

  // Bloquer le défilement de l'arrière-plan tant que l'intro est affichée.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Passer l'intro immédiatement (tap, Entrée, Espace ou Échap).
  const skip = useCallback(() => {
    if (finishedRef.current && holdRef.current === undefined) return;
    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    if (holdRef.current !== undefined) clearTimeout(holdRef.current);
    finishedRef.current = true;
    onCompleteRef.current();
  }, []);

  return (
    <div
      ref={stageRef}
      role="button"
      tabIndex={0}
      aria-label="Introduction TGV Livraison. Touchez pour passer."
      onClick={skip}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
          event.preventDefault();
          skip();
        }
      }}
      className="fixed inset-0 z-50 overflow-hidden select-none cursor-pointer outline-none"
      style={{
        background:
          'radial-gradient(circle at 50% 52%, rgba(70, 198, 48, 0.16), transparent 55%), linear-gradient(165deg, #0C6B32 0%, #07401F 55%, #052C16 100%)',
      }}
    >
      {/* Route */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'max(12px, 4vw)',
          right: 'max(12px, 4vw)',
          top: '52%',
          height: 1,
          background: 'rgba(255, 255, 255, 0.16)',
        }}
      />

      {/* Titre — révélé au passage du motard */}
      <div
        ref={wordRef}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(48% + 10px)',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          clipPath: 'inset(-12px 100% -12px 0)',
        }}
      >
        <span
          className="font-sora"
          style={{
            display: 'inline-block',
            transform: 'skewX(-9deg)',
            fontSize: 'clamp(28px, 9vw, 76px)',
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}
        >
          TGV <b style={{ color: '#46C630', fontWeight: 'inherit' }}>Livraison</b>
        </span>
      </div>

      {/* Slogan */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 'calc(52% + 22px)',
          textAlign: 'center',
          padding: '0 clamp(16px, 6vw, 32px)',
          fontSize: 'clamp(13px, 3.8vw, 18px)',
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.75)',
          opacity: tagVisible ? 1 : 0,
          transform: tagVisible ? 'none' : 'translateY(6px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        Livré à temps, reçu avec le sourire
      </div>

      {/* Motard (roues ancrées sur la route) */}
      <div
        ref={riderRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 'calc(48% - 1px)',
          width: 'clamp(72px, 20vw, 120px)',
          willChange: 'transform',
          transform: 'translateX(-200px)',
        }}
      >
        <svg
          viewBox="0 0 96 64"
          fill="none"
          style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
        >
          <path
            d="M-46 32h40M-32 42h26M-40 22h32"
            stroke="#46C630"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          <rect x="6" y="22" width="22" height="18" rx="3" fill="#46C630" />
          <path d="M22 44L58 44L62 38L48 34L30 36Z" fill="#fff" />
          <path
            d="M40 34L52 38L54 46"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M36 34L44 14L52 16L48 34Z" fill="#fff" />
          <path d="M50 18L64 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="48" cy="8" r="6.5" fill="#fff" />
          <path
            d="M78 48L68 28L62 30M64 27L72 26"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="splash-wheel">
            <circle cx="20" cy="48" r="10" stroke="#fff" strokeWidth="3" />
            <circle cx="20" cy="41" r="1.8" fill="#46C630" />
          </g>
          <g className="splash-wheel">
            <circle cx="78" cy="48" r="10" stroke="#fff" strokeWidth="3" />
            <circle cx="78" cy="41" r="1.8" fill="#46C630" />
          </g>
        </svg>
      </div>
    </div>
  );
};
