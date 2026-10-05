import React from 'react';
import { SERVICES } from '../data/communes';
import { Package, Utensils, FileText, ShoppingBag, Check, MapPin, ShieldCheck, Zap } from 'lucide-react';

interface Step1ServiceProps {
  selectedService: number;
  onSelectService: (id: number) => void;
  onContinue: () => void;
}

export const Step1Service: React.FC<Step1ServiceProps> = ({
  selectedService,
  onSelectService,
  onContinue,
}) => {
  const getIcon = (id: number) => {
    switch (id) {
      case 0:
        return <Package className="w-6 h-6 text-[#0B7A4B]" />;
      case 1:
        return <Utensils className="w-6 h-6 text-[#0B7A4B]" />;
      case 2:
        return <FileText className="w-6 h-6 text-[#0B7A4B]" />;
      case 3:
        return <ShoppingBag className="w-6 h-6 text-[#0B7A4B]" />;
      default:
        return <Package className="w-6 h-6 text-[#0B7A4B]" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-[#0E1512] tracking-tight">
          Que souhaitez-vous faire livrer ?
        </h1>
        <p className="text-sm text-[#4B5751] mt-1">
          Sélectionnez un service adapté, nos motards s’occupent du reste en toute sécurité.
        </p>
      </div>

      {/* Grid of 4 Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {SERVICES.map((svc) => {
          const isSelected = selectedService === svc.id;

          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => {
                onSelectService(svc.id);
              }}
              className={`btn-ripple relative text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[148px] bg-white group cursor-pointer ${
                isSelected
                  ? 'border-[#0B7A4B] shadow-md ring-2 ring-[#0B7A4B]/20 bg-[#F6F4EF]/30'
                  : 'border-[#DAD6CC] hover:border-[#0B7A4B]/50 hover:bg-[#F6F4EF]/20'
              }`}
            >
              {/* Selected Checkmark Badge */}
              {isSelected && (
                <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-[#0B7A4B] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Service Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#E3F1E9]' : 'bg-[#E3F1E9]/70 group-hover:bg-[#E3F1E9]'
                  }`}
                >
                  {getIcon(svc.id)}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A4B] bg-[#E3F1E9] px-2 py-0.5 rounded-md">
                    {svc.badge}
                  </span>
                  <h3 className="font-sora font-bold text-base text-[#0E1512] mt-1 leading-snug">
                    {svc.name}
                  </h3>
                </div>
              </div>

              {/* Service Subtitle & Description */}
              <div className="mt-3">
                <div className="text-xs font-semibold text-[#0B7A4B]">
                  {svc.subtitle}
                </div>
                <p className="text-xs text-[#4B5751] mt-0.5 line-clamp-2">
                  {svc.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Coverage Pill */}
      <div className="p-3 rounded-2xl bg-white border border-[#DAD6CC] flex items-center gap-2.5 text-xs text-[#4B5751] font-medium shadow-xs">
        <div className="w-7 h-7 rounded-lg bg-[#E3F1E9] text-[#0B7A4B] flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-[#0E1512]">Zone couverte (52 quartiers) : </span>
          Cotonou · Abomey-Calavi · Porto-Novo · Ouidah & Pahou
        </div>
      </div>

      {/* Features preview */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4B5751] font-medium">
        <div className="flex items-center gap-1.5 p-2 bg-[#E3F1E9]/40 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0B7A4B]" />
          <span>Colis protégé & suivi</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-[#E3F1E9]/40 rounded-xl">
          <Zap className="w-3.5 h-3.5 text-[#0B7A4B]" />
          <span>Prise en charge express</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="cta btn-ripple w-full h-14 rounded-2xl bg-[#0B7A4B] text-white font-sora font-bold text-base hover:bg-[#07401F] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continuer vers les adresses</span>
        </button>
      </div>
    </div>
  );
};
