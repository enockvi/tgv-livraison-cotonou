import React from 'react';
import { Building2, MapPin, PhoneCall, ShieldCheck } from 'lucide-react';
import { PHONE_DISPLAY_1 } from '../data/communes';

/**
 * AppFooter — Pied de page global de l'application.
 *
 * Il est rendu « en dessous de toutes les interfaces » : il reste visible
 * quel que soit l'écran ou l'étape du parcours de commande.
 *
 * Il met en avant le siège de l'application : Akpakpa Kpondéhou (Cotonou, Bénin).
 */
export const AppFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t border-[#DAD6CC]/70 dark:border-[#1E2A24] bg-[#07401F] dark:bg-[#0A1A12] text-white"
      aria-label="Pied de page — siège de l'application"
    >
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Siège de l'application */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 dark:bg-[#46C630]/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-[#46C630]" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#46C630]">
              Siège de l'application
            </p>
            <p className="font-sora font-extrabold text-sm text-white">
              Akpakpa Kpondéhou
            </p>
            <p className="text-[11px] text-emerald-100/80 flex items-center justify-center md:justify-start gap-1">
              <MapPin className="w-3 h-3 text-[#46C630]" />
              Cotonou, Bénin
            </p>
          </div>
        </div>

        {/* Rappel confiance & contact */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[11px] text-emerald-100/85">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#46C630]" />
            Service de livraison express certifié
          </span>
          <a
            href={`tel:${PHONE_DISPLAY_1.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition font-mono font-bold text-white"
            title={`Appeler la régulation : ${PHONE_DISPLAY_1}`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#46C630]" />
            {PHONE_DISPLAY_1}
          </a>
        </div>

        {/* Copyright */}
        <p className="text-[10px] text-emerald-100/60 md:text-right">
          © {year} TGV Livraison · Tous droits réservés
        </p>
      </div>
    </footer>
  );
};
