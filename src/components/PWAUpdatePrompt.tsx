import React, { useEffect } from 'react';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Bandeau PWA : signale qu'une nouvelle version est prête (mise à jour du Service Worker)
 * ou que l'application est désormais utilisable hors-ligne.
 *
 * Le Service Worker n'est plus enregistré par `public/registerSW.js` : `injectRegister: 'auto'`
 * détecte l'usage de `virtual:pwa-register/react` et laisse ce composant gérer l'enregistrement.
 */
export const PWAUpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // La confirmation « prêt hors-ligne » est informative : elle disparaît toute seule.
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  if (!offlineReady && !needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-40 px-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-[520px] flex items-center gap-3 p-3.5 rounded-2xl bg-[#07401F] text-white border border-white/10 shadow-[0_16px_40px_rgba(14,21,18,0.35)]">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            needRefresh ? 'bg-[#46C630] text-[#07401F]' : 'bg-white/10 text-[#46C630]'
          }`}
        >
          {needRefresh ? (
            <RefreshCw className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold font-sora">
            {needRefresh ? 'Nouvelle version disponible' : 'Application prête hors-ligne'}
          </p>
          <p className="text-[11px] text-emerald-100/80 leading-snug">
            {needRefresh
              ? 'Rechargez pour charger les derniers tarifs et correctifs.'
              : 'Les écrans et les tarifs restent accessibles sans réseau.'}
          </p>
        </div>

        {needRefresh ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-2 rounded-xl bg-[#46C630] text-[#07401F] text-xs font-bold hover:bg-[#58d443] active:scale-95 transition cursor-pointer"
            >
              Recharger
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              aria-label="Ignorer la mise à jour"
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOfflineReady(false)}
            aria-label="Fermer"
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
