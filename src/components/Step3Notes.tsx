import React, { useState } from 'react';
import { Quartier } from '../types/order';
import { calculateRouteDetails, formatFCFA, formatDistance } from '../data/communes';
import { Clock, Zap, MessageSquare, Compass, User, Phone, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { triggerRipple } from '../utils/ripple';
import { analyzeBeninPhone, formatWithMask } from '../utils/phoneMask';

interface Step3NotesProps {
  note: string;
  urgent: number;
  dep: Quartier;
  dst: Quartier;
  recipientName: string;
  recipientPhone: string;
  onSetNote: (note: string) => void;
  onSetUrgent: (urgent: number) => void;
  onSetRecipientName: (name: string) => void;
  onSetRecipientPhone: (phone: string) => void;
  onContinue: () => void;
}

export const Step3Notes: React.FC<Step3NotesProps> = ({
  note,
  urgent,
  dep,
  dst,
  recipientName,
  recipientPhone,
  onSetNote,
  onSetUrgent,
  onSetRecipientName,
  onSetRecipientPhone,
  onContinue,
}) => {
  const [touched, setTouched] = useState(false);

  const routeDetails = calculateRouteDetails(dep.name, dst.name);
  const tarif = routeDetails.tarif;
  // Grille stricte : une liaison absente du CSV n'a pas de tarif, on ne l'invente pas.
  const tarifDisponible = routeDetails.isExactSheetRoute && tarif > 0;
  const tarifAffiche = tarifDisponible ? formatFCFA(tarif) : 'À confirmer';
  const distance = routeDetails.distance;

  const isNameValid = recipientName.trim().length >= 2;
  const phoneAnalysis = analyzeBeninPhone(recipientPhone);
  const isPhoneValid = phoneAnalysis.isValid;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWithMask(e.target.value);
    onSetRecipientPhone(formatted);
  };

  const handleQuickAddPrefix = () => {
    let digits = recipientPhone.replace(/\D/g, '');
    if (digits.startsWith('229')) digits = digits.slice(3);
    if (!digits.startsWith('01')) {
      const newDigits = ('01' + digits).slice(0, 10);
      onSetRecipientPhone(formatWithMask(newDigits));
    }
  };

  const handleProceed = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRipple(e);
    setTouched(true);
    if (!isNameValid || !isPhoneValid) {
      return;
    }
    onContinue();
  };

  const quickSnippets = [
    'Devant la pharmacie',
    'Portail noir à côté de la boutique',
    'Appeler au dépôt',
    'À remettre en mains propres',
    'Sonner au portail',
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-[#0E1512] tracking-tight">
          Destinataire & Précisions
        </h1>
        <p className="text-sm text-[#4B5751] mt-1">
          Renseignez le contact du destinataire et vos repères pour un dépôt rapide.
        </p>
      </div>

      {/* Recipient Contact Card (Obligatoire F6) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#DAD6CC] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0E1512]">Contact du destinataire</h2>
            <p className="text-[11px] text-[#4B5751]">Obligatoire pour que le livreur puisse le joindre à l'arrivée</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Nom du destinataire */}
          <div className="space-y-1.5">
            <label
              htmlFor="recipient-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#4B5751] flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#0B7A4B]" />
              <span>Nom du destinataire <span className="text-red-500">*</span></span>
            </label>
            <input
              id="recipient-name"
              type="text"
              value={recipientName}
              onChange={(e) => onSetRecipientName(e.target.value)}
              placeholder="Ex. : M. Aurel Koudjo"
              className={`w-full h-12 px-3.5 rounded-xl border-2 text-sm font-medium text-[#0E1512] bg-[#F7F6F2] placeholder:text-[#4B5751]/50 focus:bg-white focus:outline-none transition-all ${
                touched && !isNameValid
                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100'
                  : 'border-[#DAD6CC] focus:border-[#0B7A4B] focus:ring-2 focus:ring-[#0B7A4B]/20'
              }`}
            />
            {touched && !isNameValid && (
              <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium pt-0.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Veuillez indiquer le nom ou prénom du destinataire.
              </p>
            )}
          </div>

          {/* Téléphone du destinataire avec masque visuel 01 XX XX XX XX */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="recipient-phone"
                className="text-xs font-bold uppercase tracking-wider text-[#4B5751] flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#0B7A4B]" />
                <span>Téléphone destinataire <span className="text-red-500">*</span></span>
              </label>

              {/* Opérateur détecté ou indicateur de progression */}
              {phoneAnalysis.operator ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F1E9] text-[#07401F] border border-[#0B7A4B]/30">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: phoneAnalysis.operatorColor || '#0B7A4B' }}
                  />
                  {phoneAnalysis.operator}
                </span>
              ) : phoneAnalysis.digitCount > 0 ? (
                <span className="text-[10px] font-semibold text-[#4B5751]">
                  {phoneAnalysis.digitCount}/10 chiffres
                </span>
              ) : null}
            </div>

            <div className="relative flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border-2 border-r-0 border-[#DAD6CC] bg-[#E3F1E9] text-xs font-bold text-[#07401F] select-none">
                🇧🇯 +229
              </span>
              <input
                id="recipient-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={14}
                value={recipientPhone}
                onChange={handlePhoneChange}
                placeholder="01 97 00 00 00"
                className={`w-full h-12 px-3.5 rounded-r-xl border-2 text-sm font-semibold tracking-wide text-[#0E1512] bg-[#F7F6F2] placeholder:text-[#4B5751]/40 focus:bg-white focus:outline-none transition-all ${
                  touched && !isPhoneValid
                    ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100'
                    : isPhoneValid
                    ? 'border-[#0B7A4B] focus:ring-2 focus:ring-[#0B7A4B]/20 bg-emerald-50/20'
                    : 'border-[#DAD6CC] focus:border-[#0B7A4B] focus:ring-2 focus:ring-[#0B7A4B]/20'
                }`}
              />
            </div>

            {/* Masque de saisie visuel segmenté (ex: 01 XX XX XX XX) */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 select-none">
                <span className="text-[10px] font-bold text-[#4B5751] uppercase tracking-wider mr-1">
                  Masque :
                </span>
                {phoneAnalysis.slots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 py-1 text-center rounded-lg text-xs font-mono font-bold transition-all border ${
                      slot.isFilled
                        ? 'bg-[#E3F1E9] text-[#07401F] border-[#0B7A4B]/40 shadow-xs'
                        : idx === 0 && phoneAnalysis.digitCount === 0
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-[#F7F6F2] text-[#8E9F97] border-[#DAD6CC]/70'
                    }`}
                  >
                    {slot.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton de suggestion rapide si 8 chiffres sans 01 */}
            {phoneAnalysis.digitCount === 8 && !phoneAnalysis.digits.startsWith('01') && (
              <button
                type="button"
                onClick={handleQuickAddPrefix}
                className="mt-1.5 w-full py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>Format national : Cliquer pour ajouter le préfixe <strong>01</strong></span>
              </button>
            )}

            {/* Feedback en temps réel & messages d'erreur */}
            {phoneAnalysis.error ? (
              <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{phoneAnalysis.error}</span>
              </p>
            ) : isPhoneValid ? (
              <p className="text-[11px] text-[#0B7A4B] flex items-center gap-1 font-semibold pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Numéro valide {phoneAnalysis.operator ? `· ${phoneAnalysis.operator}` : '· Format 10 chiffres'}
                </span>
              </p>
            ) : (
              <p className="text-[10px] text-[#4B5751] pt-0.5">
                Format national béninois à 10 chiffres (ex. : <strong>01 97 00 00 00</strong>)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Note / Instructions field */}
      <div className="space-y-2">
        <label
          htmlFor="order-note"
          className="block text-xs font-bold uppercase tracking-wider text-[#4B5751] flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#0B7A4B]" />
          Repère ou instruction pour le coursier (optionnel)
        </label>
        <textarea
          id="order-note"
          rows={3}
          value={note}
          onChange={(e) => onSetNote(e.target.value)}
          placeholder="Ex. : En face de la pharmacie, 2e portail à gauche après les pavés."
          className="w-full p-4 rounded-2xl border-2 border-[#DAD6CC] bg-white text-sm font-medium text-[#0E1512] placeholder:text-[#4B5751]/50 focus:border-[#0B7A4B] focus:outline-none focus:ring-3 focus:ring-[#0B7A4B]/20 transition-all resize-none"
        />

        {/* Quick snippets chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickSnippets.map((snip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const updated = note ? `${note}. ${snip}` : snip;
                onSetNote(updated);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#DAD6CC] hover:bg-[#E3F1E9] text-[#4B5751] transition"
            >
              + {snip}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#4B5751] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#0B7A4B]" />
          Priorité de livraison
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* Standard */}
          <button
            type="button"
            onClick={() => onSetUrgent(0)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              urgent === 0
                ? 'border-[#0B7A4B] bg-[#E3F1E9]/40 shadow-xs ring-2 ring-[#0B7A4B]/20'
                : 'border-[#DAD6CC] bg-white hover:border-[#0B7A4B]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-sora font-bold text-sm text-[#0E1512]">Standard</span>
              <Clock className="w-4 h-4 text-[#0B7A4B]" />
            </div>
            <p className="text-xs text-[#4B5751]">
              Course régulière dans la tournée de notre motard.
            </p>
          </button>

          {/* Urgent */}
          <button
            type="button"
            onClick={() => onSetUrgent(1)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              urgent === 1
                ? 'border-[#0B7A4B] bg-[#E3F1E9]/40 shadow-xs ring-2 ring-[#0B7A4B]/20'
                : 'border-[#DAD6CC] bg-white hover:border-[#0B7A4B]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-sora font-bold text-sm text-[#07401F] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#0B7A4B] text-[#0B7A4B]" />
                Urgent Express
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-[#46C630] text-[#07401F] px-1.5 py-0.5 rounded">
                Prioritaire
              </span>
            </div>
            <p className="text-xs text-[#4B5751]">
              Départ immédiat, motard dédié exclusivement à votre colis.
            </p>
          </button>
        </div>
      </div>

      {/* Recap Route Card */}
      <div className="p-4 rounded-2xl bg-[#E3F1E9] border border-[#0B7A4B]/20 flex items-center justify-between shadow-xs">
        <div>
          <div className="text-xs font-bold text-[#0B7A4B] flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>
              {dep.name} → {dst.name}
            </span>
          </div>
          <div className="text-xs text-[#4B5751] mt-0.5 font-medium">
            {tarifDisponible ? (
              <>
                Distance officielle : <b>~{formatDistance(distance)}</b> · Tarif officiel
              </>
            ) : (
              <>Liaison non desservie · tarif à confirmer par la régulation</>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#4B5751] block font-medium">
            {tarifDisponible ? 'Total officiel' : 'Tarif'}
          </span>
          <span className="font-sora font-extrabold text-2xl text-[#07401F]">{tarifAffiche}</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleProceed}
          className="cta btn-ripple w-full h-14 rounded-2xl bg-[#0B7A4B] text-white font-sora font-bold text-base hover:bg-[#07401F] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{tarifDisponible ? `Continuer · ${tarifAffiche}` : 'Continuer'}</span>
        </button>
      </div>
    </div>
  );
};

