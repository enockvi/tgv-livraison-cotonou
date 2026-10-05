import React from 'react';
import { PhoneCall } from 'lucide-react';
import { PHONE_DISPLAY_1 } from '../data/communes';

/**
 * AppFooter — barre de pied de page globale, volontairement minimaliste.
 *
 * Design 2026 : une seule ligne compacte (36 → 40 px) plutôt qu'un grand bloc
 * vert. Elle ne contient plus la mention du siège (affichée une seule fois,
 * dans le pied de la carte application) afin d'éviter toute répétition.
 * Contenu : marque, ligne de régulation cliquable, copyright.
 */
export const AppFooter: React.FC = () => {
  const year = new Date().getFullYear();
  const telHref = `tel:${PHONE_DISPLAY_1.replace(/\s+/g, '')}`;

  return (
    <footer
      className="w-full bg-brand-deep dark:bg-[#0a1a12] border-t border-white/5"
      aria-label="Pied de page de l'application"
    >
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 h-9 sm:h-10 flex items-center justify-between gap-3 text-[11px] text-emerald-100/70">
        {/* Marque */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-sora font-black text-[9px] tracking-tighter bg-accent text-heading px-1.5 py-[3px] rounded-md leading-none flex-shrink-0">
            TGV
          </span>
          <span className="truncate">Livraison express · Cotonou</span>
        </div>

        {/* Contact & copyright */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            title={`Appeler la régulation : ${PHONE_DISPLAY_1}`}
          >
            <PhoneCall className="w-3 h-3 text-accent" />
            <span className="font-mono hidden sm:inline">{PHONE_DISPLAY_1}</span>
          </a>
          <span className="w-px h-3 bg-white/10" aria-hidden="true" />
          <span className="whitespace-nowrap">© {year} TGV Livraison</span>
        </div>
      </div>
    </footer>
  );
};
