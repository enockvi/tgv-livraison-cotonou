import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';

interface SplashIntroProps {
  onComplete: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  // Le slogan n'est plus un état : il est dérivé de la progression (monotone).
  // Il n'est donc plus une dépendance de l'effet, qui ne peut plus être relancé à 75 %
  // de l'animation (c'était la cause de la barre qui reculait et du motard qui repartait).
  const showTag = progress >= 0.75;

  // Le callback du parent est lu via une ref : l'effet d'animation n'a plus aucune dépendance,
  // il survit donc à un re-rendu de App (événement online/offline, thème, etc.).
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let animationFrameId: number;
    let endTimerId: ReturnType<typeof setTimeout> | undefined;
    const duration = 2400; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        endTimerId = setTimeout(() => {
          onCompleteRef.current();
        }, 600);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (endTimerId !== undefined) clearTimeout(endTimerId);
    };
  }, []);

  // Accessibilité : si l'utilisateur limite les animations, on entre immédiatement dans l'app.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onCompleteRef.current();
    }
  }, []);

  // Bloquer le défilement de l'arrière-plan tant que l'intro est affichée.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Calculate cut percentage for the text reveal
  const cutPercent = Math.max(0, 100 - progress * 130);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introduction TGV Livraison"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none bg-brand-deep"
      style={{
        background:
          'radial-gradient(circle at 50% 50%, rgba(70, 198, 48, 0.16) 0%, transparent 60%), linear-gradient(165deg, #0C6B32 0%, #07401F 55%, #042613 100%)',
      }}
    >
      {/* Background speed streaks */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse" />
        <div className="absolute top-3/4 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse" />
      </div>

      <div className="relative w-full max-w-2xl px-6 flex flex-col items-center">
        {/* Road line */}
        <div className="w-full h-[1px] bg-white/20 mb-8 relative">
          <div
            className="absolute top-0 bottom-0 bg-accent shadow-[0_0_8px_#46C630]"
            style={{
              left: 0,
              width: `${progress * 100}%`,
              transition: 'width 0.05s linear',
            }}
          />
        </div>

        {/* Motorcycle Courier Moving */}
        <div
          className="w-full relative h-20 -mt-16 pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <div
            className="absolute top-0 transition-transform duration-75"
            style={{
              left: `calc(${progress * 110}% - 80px)`,
            }}
          >
            <svg
              className="w-24 h-16 overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              viewBox="0 0 96 64"
              fill="none"
              aria-hidden="true"
            >
              {/* Speed lines behind */}
              <path
                d="M-40 32h34 M-26 42h20 M-34 22h26"
                stroke="#46C630"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Delivery Box */}
              <rect x="6" y="22" width="22" height="18" rx="4" fill="#46C630" />
              {/* Bike Body */}
              <path d="M22 44L58 44L62 38L48 34L30 36Z" fill="#fff" />
              <path
                d="M40 34L52 38L54 46"
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Courier Torso */}
              <path d="M36 34L44 14L52 16L48 34Z" fill="#fff" />
              {/* Arms */}
              <path d="M50 18L64 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              {/* Helmet */}
              <circle cx="48" cy="8" r="6.5" fill="#fff" />
              {/* Fork */}
              <path
                d="M78 48L68 28L62 30M64 27L72 26"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Wheels with spin */}
              <g className="animate-spin" style={{ transformOrigin: '20px 48px' }}>
                <circle cx="20" cy="48" r="10" stroke="#fff" strokeWidth="3" />
                <circle cx="20" cy="41" r="2" fill="#46C630" />
              </g>
              <g className="animate-spin" style={{ transformOrigin: '78px 48px' }}>
                <circle cx="78" cy="48" r="10" stroke="#fff" strokeWidth="3" />
                <circle cx="78" cy="41" r="2" fill="#46C630" />
              </g>
            </svg>
          </div>
        </div>

        {/* Brand Name with wipe reveal */}
        <div className="text-center my-6 relative overflow-hidden">
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-sora italic"
            style={{
              clipPath: `inset(0 ${cutPercent}% 0 0)`,
              transition: 'clip-path 0.05s linear',
            }}
          >
            TGV <span className="text-accent">Livraison</span>
          </h1>

          <p
            className={`mt-4 text-base sm:text-xl text-emerald-100/90 font-medium tracking-wide transition-all duration-700 ${
              showTag ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            Livré à temps, reçu avec le sourire
          </p>
        </div>

        {/* Skip / Enter Action */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => onComplete()}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-accent text-heading font-bold text-sm tracking-wide shadow-[0_8px_20px_rgba(70,198,48,0.35)] hover:bg-accent-bright transition-all transform hover:scale-105 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Commander une course</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-xs text-white/50">Livraison en 4 étapes · Aucun compte requis</span>
        </div>
      </div>
    </div>
  );
};
