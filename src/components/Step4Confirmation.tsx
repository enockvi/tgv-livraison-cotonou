import React, { useState } from 'react';
import { Quartier, DeliveryService, OrderPayload } from '../types/order';
import {
  COMMUNE_NAMES,
  calculateRouteDetails,
  formatFCFA,
  formatDistance,
  PHONE_DISPATCH_1,
  PHONE_DISPLAY_1,
  PHONE_DISPATCH_2,
  PHONE_DISPLAY_2,
} from '../data/communes';
import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  PhoneCall,
  Clock,
  Banknote,
  Smartphone,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  User,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { triggerRipple } from '../utils/ripple';
import { sendOrderOrQueue } from '../data/orderQueue';

interface Step4ConfirmationProps {
  orderId: string;
  service: DeliveryService;
  dep: Quartier;
  dst: Quartier;
  urgent: number;
  note: string;
  recipientName: string;
  recipientPhone: string;
  gps: string | null;
  onOrderSaved: (order: OrderPayload) => void;
  onResetOrder: () => void;
}

export const Step4Confirmation: React.FC<Step4ConfirmationProps> = ({
  orderId,
  service,
  dep,
  dst,
  urgent,
  note,
  recipientName,
  recipientPhone,
  gps,
  onOrderSaved,
  onResetOrder,
}) => {
  const [paymentMode, setPaymentMode] = useState<'cod' | 'momo'>('cod');
  const [isSending, setIsSending] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  // true si l'envoi réseau a échoué : la commande a été placée dans la file hors-ligne.
  const [queuedOffline, setQueuedOffline] = useState(false);

  const routeDetails = calculateRouteDetails(dep.name, dst.name);
  const tarif = routeDetails.tarif;
  const distance = routeDetails.distance;
  // Grille stricte : une liaison absente du CSV n'a pas de tarif officiel → jamais de « 0 FCFA ».
  const tarifDisponible = routeDetails.isExactSheetRoute && tarif > 0;
  const tarifAffiche = tarifDisponible ? formatFCFA(tarif) : 'À confirmer';

  // Build raw WhatsApp message
  const rawWhatsAppText = (() => {
    const lines = [
      '⚡ *NOUVELLE COMMANDE TGV LIVRAISON*',
      `📋 *Réf.* : ${orderId}`,
      `📦 *Service* : ${service.name}`,
      `📍 *Départ* : ${dep.name}, ${COMMUNE_NAMES[dep.commune]}`,
      `🏁 *Destination* : ${dst.name}, ${COMMUNE_NAMES[dst.commune]}`,
      `📏 *Distance estimée* : ~${formatDistance(distance)}`,
      `👤 *Destinataire* : ${recipientName || 'Non spécifié'}`,
      `📞 *Tél. Destinataire* : ${recipientPhone ? `+229 ${recipientPhone}` : 'Non spécifié'}`,
      `⏱️ *Priorité* : ${urgent ? '⚡ Urgent Express' : '🟢 Standard'}`,
      tarifDisponible
        ? `💰 *Tarif officiel* : ${formatFCFA(tarif)}`
        : '💰 *Tarif* : à confirmer par la régulation (liaison hors grille)',
      `💳 *Paiement* : ${paymentMode === 'cod' ? 'Espèces au livreur' : 'Mobile Money (MTN/Moov)'}`,
    ];

    if (note.trim()) {
      lines.push(`📝 *Repère/Note* : ${note.trim()}`);
    }

    // Trajet absent de la grille tarifaire : le motard doit savoir que le prix est à confirmer.
    if (!routeDetails.isExactSheetRoute) {
      lines.push('⚠️ *Tarif estimé* : trajet hors grille tarifaire, à confirmer par la régulation');
    }

    if (gps) {
      lines.push(`🛰️ *Position GPS Google Maps* : https://maps.google.com/?q=${gps}`);
    }

    lines.push('\n_Merci de me confirmer la prise en charge par un motard !_');
    return lines.join('\n');
  })();

  const primaryWhatsAppUrl = `https://wa.me/${PHONE_DISPATCH_1}?text=${encodeURIComponent(rawWhatsAppText)}`;
  const secondaryWhatsAppUrl = `https://wa.me/${PHONE_DISPATCH_2}?text=${encodeURIComponent(rawWhatsAppText)}`;

  // Send order to API / Google Sheets and open WhatsApp
  const handleConfirmOrder = async (whatsappUrl: string) => {
    setIsSending(true);

    const payload: OrderPayload = {
      id: orderId,
      svc: service.id,
      dep: { q: dep.name, v: dep.commune },
      dst: { q: dst.name, v: dst.commune },
      urgent,
      note,
      recipientName,
      recipientPhone,
      gps: gps || '',
      createdAt: new Date().toISOString(),
      distance,
      tarif,
      status: 'Nouvelle',
    };

    // Sauvegarde locale immédiate (historique de commandes)
    onOrderSaved(payload);

    // Envoi vers l'API / Google Sheets. En cas d'échec réseau ou serveur, la commande est
    // placée dans la file hors-ligne et repartira automatiquement au retour de la connexion :
    // la promesse affichée par la bannière hors-ligne est réellement tenue.
    const sent = await sendOrderOrQueue({
      ...payload,
      destNom: recipientName,
      destPhone: recipientPhone,
      // Mode de paiement collecté à l'écran 4 : sans cette ligne, la colonne
      // « Paiement » de la feuille reste vide.
      paiement: paymentMode === 'cod' ? 'Espèces au livreur' : 'Mobile Money',
      // Alerte côté Vercel (logs) : le tarif n'a pas été trouvé dans la grille officielle.
      tarifEstime: !routeDetails.isExactSheetRoute,
    });

    setIsSending(false);
    setQueuedOffline(!sent);
    setOrderConfirmed(true);
    // Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const copyRef = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const copyFullMessage = () => {
    navigator.clipboard.writeText(rawWhatsAppText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  // If order was sent to WhatsApp -> Render Écran 5 (« Message prêt »)
  if (orderConfirmed) {
    return (
      <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-[#E3F1E9] text-[#0B7A4B] mx-auto flex items-center justify-center mb-3 ring-8 ring-[#E3F1E9]/40">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-[#0E1512] tracking-tight">
            Votre message est prêt !
          </h1>
          <p className="text-sm text-[#4B5751] mt-1.5 max-w-sm mx-auto">
            Appuyez sur <b className="text-[#0B7A4B]">Envoyer</b> dans WhatsApp pour confirmer immédiatement votre course avec la régulation.
          </p>
        </div>

        {queuedOffline && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] font-semibold text-amber-800 leading-snug">
              Commande enregistrée hors-ligne : elle sera transmise automatiquement à la régulation
              dès le retour de la connexion. Envoyez tout de même le message WhatsApp dès que possible.
            </span>
          </div>
        )}

        {/* Message preview card */}
        <div className="p-4 rounded-2xl bg-[#F6F4EF] border-2 border-[#DAD6CC] space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#DAD6CC]">
            <span className="font-bold text-[#4B5751] flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#0B7A4B]" />
              Message préparé ({orderId})
            </span>
            <span className="font-bold text-[#07401F] bg-[#E3F1E9] px-2 py-0.5 rounded-full">
              {tarifAffiche}
            </span>
          </div>

          <pre className="text-[11px] leading-relaxed font-sans whitespace-pre-wrap text-[#0E1512] max-h-36 overflow-y-auto p-2.5 bg-white rounded-xl border border-[#DAD6CC]/60">
            {rawWhatsAppText}
          </pre>
        </div>

        {/* 3 Strict Actions per Specification F13 */}
        <div className="space-y-2.5 pt-1">
          {/* Action 1 : Rouvrir WhatsApp */}
          <button
            type="button"
            onClick={(e) => {
              triggerRipple(e);
              window.open(primaryWhatsAppUrl, '_blank', 'noopener,noreferrer');
            }}
            className="cta btn-ripple w-full h-14 rounded-2xl bg-[#0B7A4B] text-white font-sora font-bold text-base hover:bg-[#07401F] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white text-[#0B7A4B]" />
            <span>Rouvrir WhatsApp</span>
          </button>

          {/* Action 2 : Copier le message */}
          <button
            type="button"
            onClick={(e) => {
              triggerRipple(e);
              copyFullMessage();
            }}
            className="cta btn-ripple w-full h-12 rounded-2xl bg-white border-2 border-[#DAD6CC] text-[#0E1512] font-semibold text-sm hover:bg-[#F6F4EF] hover:border-[#0B7A4B] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedMessage ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Message copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#0B7A4B]" />
                <span>Copier le message complet</span>
              </>
            )}
          </button>

          {/* Action 3 : Nouvelle commande */}
          <button
            type="button"
            onClick={(e) => {
              triggerRipple(e);
              onResetOrder();
            }}
            className="cta btn-ripple w-full h-12 rounded-2xl bg-transparent border border-dashed border-[#DAD6CC] text-[#4B5751] hover:text-[#0E1512] hover:bg-[#F6F4EF] hover:-translate-y-0.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#4B5751]" />
            <span>Nouvelle commande</span>
          </button>
        </div>

        {/* Discrete second line fallback per F11 */}
        <div className="text-center text-xs text-[#4B5751] pt-2">
          <span>Un problème sur la ligne principale ? </span>
          <a
            href={secondaryWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0B7A4B] font-bold underline hover:text-[#07401F]"
          >
            Envoyer sur la Ligne 2 ({PHONE_DISPLAY_2})
          </a>
        </div>
      </div>
    );
  }

  // Écran 4 : Vérification et Récapitulatif
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-[#0E1512] tracking-tight">
          Vérifiez et confirmez
        </h1>
        <p className="text-sm text-[#4B5751] mt-1">
          La course sera transmise directement à la régulation TGV sur WhatsApp.
        </p>
      </div>

      {/* Recap Card */}
      <div className="bg-white border-2 border-[#DAD6CC] rounded-3xl p-5 shadow-xs space-y-4">
        {/* Order Reference Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DAD6CC]/70">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5751]">
              Référence Course
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-sora font-extrabold text-base text-[#07401F]">
                {orderId}
              </span>
              <button
                type="button"
                onClick={copyRef}
                className="p-1 rounded-md text-[#4B5751] hover:text-[#0B7A4B] hover:bg-[#E3F1E9] transition cursor-pointer"
                title="Copier la référence"
              >
                {copiedRef ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <span className="text-xs font-bold text-[#0B7A4B] bg-[#E3F1E9] px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0B7A4B] animate-pulse" />
            Prête à expédier
          </span>
        </div>

        {/* Detailed Rows */}
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#4B5751] font-medium">Service</span>
            <span className="font-bold text-[#0E1512]">{service.name}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#4B5751] font-medium">Départ (Collecte)</span>
            <span className="font-bold text-[#0E1512] text-right">
              {dep.name} <span className="text-[#0B7A4B]">({COMMUNE_NAMES[dep.commune]})</span>
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#4B5751] font-medium">Arrivée (Dépôt)</span>
            <span className="font-bold text-[#0E1512] text-right">
              {dst.name} <span className="text-[#0B7A4B]">({COMMUNE_NAMES[dst.commune]})</span>
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#4B5751] font-medium">Distance estimée</span>
            <span className="font-bold text-[#0B7A4B] text-right">
              ~{formatDistance(distance)}
            </span>
          </div>

          {/* Trajet hors grille tarifaire : on ne facture plus silencieusement */}
          {!routeDetails.isExactSheetRoute && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] font-semibold text-amber-800 leading-snug">
                Cette liaison n’est <b>pas dans la grille officielle</b> : aucun tarif n’est appliqué
                automatiquement. La régulation confirmera le prix avant la prise en charge.
              </span>
            </div>
          )}

          {/* Contact Destinataire (F6) */}
          {(recipientName || recipientPhone) && (
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-[#4B5751] font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#0B7A4B]" />
                Destinataire
              </span>
              <span className="font-bold text-[#0E1512] text-right">
                {recipientName || 'Client'}
                {recipientPhone && (
                  <span className="block text-xs font-semibold text-[#0B7A4B]">
                    +229 {recipientPhone}
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#4B5751] font-medium">Priorité</span>
            <span
              className={`font-bold ${
                urgent ? 'text-amber-700' : 'text-[#0B7A4B]'
              }`}
            >
              {urgent ? '⚡ Urgent Express' : '🟢 Standard'}
            </span>
          </div>

          {note && (
            <div className="py-1 border-b border-gray-100">
              <span className="text-[#4B5751] font-medium block mb-0.5">Repères & Notes :</span>
              <p className="text-[#0E1512] italic bg-[#F6F4EF] p-2 rounded-xl">« {note} »</p>
            </div>
          )}

          {gps && (
            <div className="flex justify-between py-1 border-b border-gray-100 items-center">
              <span className="text-[#4B5751] font-medium">Position GPS</span>
              <a
                href={`https://maps.google.com/?q=${gps}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B7A4B] font-bold flex items-center gap-1 hover:underline"
              >
                <span>Voir sur Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Total Price Row */}
        <div className="pt-2 flex justify-between items-center">
          <div>
            <span className="text-xs text-[#4B5751] block font-medium">Tarif officiel</span>
            <span className="text-[11px] text-[#0B7A4B] font-semibold">
              Paiement direct au coursier
            </span>
          </div>
          <span className="font-sora font-extrabold text-2xl text-[#07401F]">
            {tarifAffiche}
          </span>
        </div>
      </div>

      {/* Payment Options (Règlement au livreur) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5751]">
          Règlement au coursier (à la livraison)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setPaymentMode('cod')}
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
              paymentMode === 'cod'
                ? 'border-[#0B7A4B] bg-[#E3F1E9]/40 ring-2 ring-[#0B7A4B]/20'
                : 'border-[#DAD6CC] bg-white hover:border-[#0B7A4B]/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-[#0E1512]">Payer en espèces</div>
                <div className="text-[11px] text-[#4B5751]">Remise directe en mains propres</div>
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                paymentMode === 'cod' ? 'border-[#0B7A4B]' : 'border-[#DAD6CC]'
              }`}
            >
              {paymentMode === 'cod' && (
                <div className="w-2 h-2 rounded-full bg-[#0B7A4B]" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('momo')}
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
              paymentMode === 'momo'
                ? 'border-[#0B7A4B] bg-[#E3F1E9]/40 ring-2 ring-[#0B7A4B]/20'
                : 'border-[#DAD6CC] bg-white hover:border-[#0B7A4B]/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-[#0E1512]">Mobile Money</div>
                <div className="text-[11px] text-[#4B5751]">MTN MoMo ou Moov Money</div>
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                paymentMode === 'momo' ? 'border-[#0B7A4B]' : 'border-[#DAD6CC]'
              }`}
            >
              {paymentMode === 'momo' && (
                <div className="w-2 h-2 rounded-full bg-[#0B7A4B]" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Primary Action Button: WhatsApp avec prix incrusté (Action 2 demandée) */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          disabled={isSending}
          onClick={(e) => {
            triggerRipple(e);
            handleConfirmOrder(primaryWhatsAppUrl);
          }}
          className="cta btn-ripple w-full h-15 rounded-2xl bg-[#0B7A4B] text-white font-sora font-extrabold text-base hover:bg-[#07401F] hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Préparation du message...</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5 fill-white text-[#0B7A4B]" />
              <span>{tarifDisponible ? `Envoyer sur WhatsApp · ${tarifAffiche}` : 'Envoyer sur WhatsApp'}</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center text-xs text-[#4B5751] px-1">
          <a
            href={`tel:${PHONE_DISPLAY_1.replace(/\s+/g, '')}`}
            className="text-[#4B5751] hover:text-[#07401F] flex items-center gap-1 font-semibold"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#0B7A4B]" />
            <span>Appel direct ({PHONE_DISPLAY_1})</span>
          </a>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#4B5751] pt-1">
        🔒 Zéro compte requis · Historique sauvegardé en local dans votre navigateur.
      </div>
    </div>
  );
};
