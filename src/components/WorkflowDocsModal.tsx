import React from 'react';
import {
  X,
  Workflow,
  CheckCircle,
  Smartphone,
  MessageCircle,
  Table,
  Cloud,
  ShieldCheck,
  MapPin,
  WifiOff,
  Send,
  Zap,
} from 'lucide-react';

interface WorkflowDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowDocsModal: React.FC<WorkflowDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-card p-5 sm:p-7 shadow-2xl text-ink relative border border-line max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-deep text-accent flex items-center justify-center shadow-sm">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sora font-extrabold text-lg sm:text-xl text-ink">
                Workflow Complet de TGV Livraison
              </h2>
              <p className="text-xs text-muted">
                Fonctionnement technique & parcours utilisateur de bout en bout
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-sm">
          {/* Step-by-step Flow */}
          <div className="space-y-4">
            <h3 className="font-sora font-bold text-base text-heading flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>1. Le Parcours Utilisateur en 4 Étapes Simples</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-1">
                <span className="font-sora font-bold text-brand block">
                  Étape 1 : Choix du Service
                </span>
                <p className="text-muted">
                  Le client sélectionne le type de course : Colis & E-commerce, Repas isotherme, Documents confidentiels ou Courses marché Dantokpa.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-1">
                <span className="font-sora font-bold text-brand block">
                  Étape 2 : Lieux & Position GPS
                </span>
                <p className="text-muted">
                  Sélection du quartier de collecte et de livraison avec auto-complétion sur 4 communes (Cotonou, Calavi, Sémè, Porto-Novo) + bouton GPS en 1 clic.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-1">
                <span className="font-sora font-bold text-brand block">
                  Étape 3 : Précisions & Urgence
                </span>
                <p className="text-muted">
                  Saisie d'un repère terrain (porte, pharmacie, contact) et choix de la priorité (Standard ou Urgent Express).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border border-line space-y-1">
                <span className="font-sora font-bold text-brand block">
                  Étape 4 : Confirmation & Envoi
                </span>
                <p className="text-muted">
                  Attribution de la référence unique <code>TGV-YYMMDD-XXXX</code>, affichage du total (1 000 ou 1 500 FCFA), et dispatch multi-canal.
                </p>
              </div>
            </div>
          </div>

          {/* Dual Channel Dispatch System */}
          <div className="p-4 rounded-2xl bg-brand-soft border border-brand/20 space-y-3">
            <h3 className="font-sora font-bold text-sm text-heading flex items-center gap-2">
              <Send className="w-4 h-4 text-brand" />
              <span>2. Le Double Dispatch Automatique (WhatsApp + Google Sheets)</span>
            </h3>

            <div className="space-y-2 text-xs text-ink">
              <div className="flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Canal 1 - WhatsApp Motard :</strong> Ouvre directement une conversation avec la régulation TGV avec toutes les informations formatées (service, adresses, repères, lien GPS Google Maps cliquable).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Table className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Canal 2 - Google Sheets Automatique :</strong> L'application appelle <code>/api/order</code> (Fonction Vercel) qui transmet la ligne sécurisée dans votre Google Sheet (onglet « Commandes ») avec déduplication et statut « Nouvelle ».
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <WifiOff className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Résilience Hors-ligne :</strong> Si le réseau est instable à Cotonou, la commande est stockée dans la file locale <code>tgv_offline_queue</code> et automatiquement synchronisée dès retour d'Internet !
                </div>
              </div>
            </div>
          </div>

          {/* Vercel Deployment Checklist */}
          <div className="space-y-3">
            <h3 className="font-sora font-bold text-sm text-heading flex items-center gap-2">
              <Cloud className="w-4 h-4 text-brand" />
              <span>3. Déploiement Vercel en 3 Étapes</span>
            </h3>

            <div className="space-y-2.5 text-xs text-muted">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <strong className="text-ink block mb-1">Étape A : Google Apps Script</strong>
                Collez le script fourni dans <code>apps-script/Code.gs</code> dans votre Google Sheet (Extensions &gt; Apps Script), déployez en Application Web (accès : Tout le monde) et notez l'URL <code>/exec</code> ainsi que votre <code>TOKEN</code>.
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <strong className="text-ink block mb-1">Étape B : Import sur Vercel</strong>
                Connectez votre dépôt GitHub sur <strong>vercel.com</strong> (Framework Preset : Vite).
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <strong className="text-ink block mb-1">Étape C : Variables d'environnement</strong>
                Dans Settings &gt; Environment Variables sur Vercel, ajoutez :
                <ul className="list-disc pl-4 mt-1 space-y-0.5 font-mono text-[11px] text-heading">
                  <li><code>SHEET_WEBHOOK_URL</code> = https://script.google.com/macros/s/.../exec</li>
                  <li><code>SHEET_TOKEN</code> = votre_secret_choisi</li>
                </ul>
              </div>
            </div>
          </div>

          {/* PWA Standard */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong>PWA 100% installable :</strong> Service Worker actif, icônes Android/iOS conformes, invite d'installation intégrée, et guide Safari iOS pas à pas.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-line flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cta btn-ripple px-5 py-2.5 bg-brand-solid text-white font-bold text-xs rounded-xl hover:bg-brand-deep transition shadow-xs cursor-pointer"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
