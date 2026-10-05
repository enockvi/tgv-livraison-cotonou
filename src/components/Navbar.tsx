import React, { useState } from 'react';
import { ArrowLeft, Clock, PhoneCall, Smartphone, Sun, Moon } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerRipple } from '../utils/ripple';
import { PWAInstallModal } from './PWAInstallModal';
import { PHONE_DISPLAY_1 } from '../data/communes';

interface NavbarProps {
  step: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBack: () => void;
  onOpenHistory: () => void;
  pastOrdersCount: number;
  onReplaySplash: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  step,
  theme,
  onToggleTheme,
  onBack,
  onOpenHistory,
  pastOrdersCount,
  onReplaySplash,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleInstallClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRipple(e);
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line/60 px-4 sm:px-6 pt-3 pb-2.5 transition-all">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between min-h-[44px]">
            {/* Back Button or Logo */}
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <button
                  onClick={onBack}
                  className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-ink hover:bg-brand-soft active:scale-95 transition-all"
                  aria-label="Étape précédente"
                >
                  <ArrowLeft className="w-5 h-5 text-heading" />
                </button>
              ) : null}

              <button
                onClick={onReplaySplash}
                className="flex items-center gap-2 text-left group focus:outline-none"
                title="Revoir l'animation TGV"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-deep flex items-center justify-center text-accent font-black text-xs tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
                  <span>TGV</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-sora font-extrabold text-base tracking-tight text-ink leading-none">
                    TGV <span className="text-brand">Livraison</span>
                  </span>
                  <span className="text-[10px] text-muted font-medium tracking-wide">
                    Cotonou & environs
                  </span>
                </div>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {/* Bouton « Installer l'app » (F15) */}
              {!isInstalled && (isInstallable || isIOS) && (
                <button
                  onClick={handleInstallClick}
                  className="btn-ripple flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-brand-soft text-brand text-xs font-bold hover:bg-brand-solid hover:text-white dark:bg-[#123020] dark:text-[#46c630] dark:hover:bg-[#46c630] dark:hover:text-[#0e1512] transition shadow-xs cursor-pointer"
                  title="Installer l'application sur l'écran d'accueil"
                  aria-label="Installer l'application sur votre écran d'accueil"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Installer l'app</span>
                  <span className="sm:hidden">Installer</span>
                </button>
              )}

            {/* Bascule mode clair / sombre (F16) */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-muted hover:text-heading hover:bg-brand-soft transition cursor-pointer"
              title={theme === 'dark' ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
              aria-label="Basculer le mode clair / sombre"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-500 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-muted hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Order history */}
            <button
              onClick={onOpenHistory}
              className="relative p-2 rounded-xl text-muted hover:text-heading hover:bg-brand-soft transition"
              title="Historique de mes commandes"
              aria-label="Historique des commandes"
            >
              <Clock className="w-5 h-5" />
              {pastOrdersCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-solid text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {pastOrdersCount}
                </span>
              )}
            </button>

            {/* Direct hotline call */}
            <a
              href={`tel:${PHONE_DISPLAY_1.replace(/\s+/g, '')}`}
              className="p-2 rounded-xl text-brand hover:bg-brand-soft transition"
              title={`Appeler la régulation : ${PHONE_DISPLAY_1}`}
              aria-label="Appeler la régulation"
            >
              <PhoneCall className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Step indicator bar */}
        <div className="mt-2.5">
          <div className="flex justify-between items-center text-xs font-semibold text-muted mb-1.5">
            <span className="text-heading">
              {step === 1 && '1. Que faire livrer ?'}
              {step === 2 && '2. Trajet & Adresses'}
              {step === 3 && '3. Précisions & Urgence'}
              {step === 4 && '4. Vérification & WhatsApp'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              Étape {step} / 4
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-full rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-brand-solid' : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </header>

    <PWAInstallModal
      isOpen={isInstallModalOpen}
      onClose={() => setIsInstallModalOpen(false)}
      onInstall={install}
      canPrompt={isInstallable}
    />
  </>
  );
};
