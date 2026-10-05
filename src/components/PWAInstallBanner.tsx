import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      {/* Discreet top bar banner on mobile if installable */}
      {(isInstallable || isIOS) && (
        <div className="bg-[#E3F1E9] border-b border-[#0B7A4B]/20 text-[#07401F] px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0B7A4B] text-white flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>Installez TGV Livraison</strong> sur votre écran d'accueil pour commander en 1 clic !
            </span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {isInstallable && (
              <button
                onClick={install}
                className="px-3 py-1 bg-[#0B7A4B] text-white font-bold rounded-lg hover:bg-[#07401F] transition text-xs shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Installer
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="px-3 py-1 bg-[#0B7A4B] text-white font-bold rounded-lg hover:bg-[#07401F] transition text-xs shadow-sm flex items-center gap-1.5"
              >
                <Share className="w-3.5 h-3.5" />
                Installer
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-[#4B5751] hover:text-[#0E1512] p-1"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-[#0E1512] relative border border-[#DAD6CC]">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#07401F] flex items-center justify-center text-white shadow-md">
                <span className="font-sora font-extrabold text-sm tracking-tight text-[#46C630]">TGV</span>
              </div>
              <div>
                <h3 className="font-sora font-bold text-base text-[#0E1512]">Installer sur iPhone / iPad</h3>
                <p className="text-xs text-[#4B5751]">Accès direct sans passer par l'App Store</p>
              </div>
            </div>

            <div className="space-y-3.5 text-sm text-[#4B5751] my-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F6F4EF]">
                <div className="w-7 h-7 rounded-lg bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  Appuyez sur le bouton <strong>Partager</strong> <Share className="inline w-4 h-4 text-[#0B7A4B] mx-1 align-sub" /> en bas de l'écran dans Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F6F4EF]">
                <div className="w-7 h-7 rounded-lg bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  Faites défiler vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong> <PlusSquare className="inline w-4 h-4 text-[#0B7A4B] mx-1 align-sub" />.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F6F4EF]">
                <div className="w-7 h-7 rounded-lg bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  Touchez <strong>« Ajouter »</strong> en haut à droite. L'icône TGV Livraison apparaîtra sur votre écran !
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-2 w-full rounded-xl bg-[#0B7A4B] text-white py-3 text-sm font-bold hover:bg-[#07401F] transition shadow-md"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
};
