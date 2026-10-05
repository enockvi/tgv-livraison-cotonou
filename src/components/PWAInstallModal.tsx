import React from 'react';
import { Smartphone, X, Share2, PlusSquare, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall?: () => void;
  canPrompt?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  canPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card dark:bg-[#15201a] p-6 shadow-2xl border border-line dark:border-[#223328] flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-soft dark:bg-[#123020] text-brand dark:text-[#46c630] flex items-center justify-center shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 id="pwa-modal-title" className="font-sora font-bold text-lg text-ink dark:text-[#f6f4ef] leading-tight">
                Installer l'application
              </h3>
              <p className="text-xs text-muted dark:text-[#8e9f97] font-medium mt-0.5">
                Accès direct & commandes instantanées
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-brand-soft dark:text-[#8e9f97] dark:hover:text-[#f6f4ef] dark:hover:bg-[#123020] transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on prompt capability */}
        {canPrompt ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted dark:text-[#8e9f97] leading-relaxed">
              Ajoutez TGV Livraison directement sur votre écran d'accueil pour profiter d'une expérience plein écran rapide, sans passer par la barre d'adresse.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onInstall) onInstall();
                  onClose();
                }}
                className="btn-ripple w-full py-3.5 px-4 rounded-xl bg-brand-solid hover:bg-brand-deep text-white font-sora font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Installer maintenant</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-muted dark:text-[#8e9f97] hover:bg-surface dark:hover:bg-[#1a2821] transition"
              >
                Plus tard
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted dark:text-[#8e9f97]">
              Suivez ces 3 étapes simples pour ajouter l'icône sur votre écran d'accueil :
            </p>

            <ol className="space-y-3 text-sm text-ink dark:text-[#f6f4ef]">
              <li className="flex items-start gap-2.5">
                <span className="flex-none w-5 h-5 rounded-full bg-brand-soft dark:bg-[#123020] text-brand dark:text-[#46c630] font-bold text-xs flex items-center justify-center mt-0.5">
                  1
                </span>
                <span className="leading-snug">
                  Appuyez sur le bouton <strong>Partager</strong>{' '}
                  <Share2 className="inline w-3.5 h-3.5 text-brand dark:text-[#46c630] mx-0.5" /> dans le menu de votre navigateur.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex-none w-5 h-5 rounded-full bg-brand-soft dark:bg-[#123020] text-brand dark:text-[#46c630] font-bold text-xs flex items-center justify-center mt-0.5">
                  2
                </span>
                <span className="leading-snug">
                  Faites défiler vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong>{' '}
                  <PlusSquare className="inline w-3.5 h-3.5 text-brand dark:text-[#46c630] mx-0.5" />.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex-none w-5 h-5 rounded-full bg-brand-soft dark:bg-[#123020] text-brand dark:text-[#46c630] font-bold text-xs flex items-center justify-center mt-0.5">
                  3
                </span>
                <span className="leading-snug">
                  Confirmez en haut à droite avec <strong>« Ajouter »</strong>.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={onClose}
              className="btn-ripple w-full mt-2 py-3 px-4 rounded-xl bg-brand-solid hover:bg-brand-deep text-white font-sora font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>J'ai compris</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
