import React from 'react';
import { SERVICES } from '../data/communes';
import { Package, Utensils, FileText, ShoppingBag, Check, MapPin, ShieldCheck, Zap } from 'lucide-react';

interface Step1ServiceProps {
  selectedService: number;
  onSelectService: (id: number) => void;
}

export const Step1Service: React.FC<Step1ServiceProps> = ({
  selectedService,
  onSelectService,
}) => {
  const getIcon = (id: number) => {
    switch (id) {
      case 0:
        return <Package className="w-6 h-6 text-brand" />;
      case 1:
        return <Utensils className="w-6 h-6 text-brand" />;
      case 2:
        return <FileText className="w-6 h-6 text-brand" />;
      case 3:
        return <ShoppingBag className="w-6 h-6 text-brand" />;
      default:
        return <Package className="w-6 h-6 text-brand" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-ink tracking-tight">
          Que souhaitez-vous faire livrer ?
        </h1>
        <p className="text-sm text-muted mt-1">
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
              className={`btn-ripple relative text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[148px] bg-card group cursor-pointer ${
                isSelected
                  ? 'border-brand shadow-md ring-2 ring-brand/20 bg-surface/30'
                  : 'border-line hover:border-brand/50 hover:bg-surface/20'
              }`}
            >
              {/* Selected Checkmark Badge */}
              {isSelected && (
                <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-brand-solid text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Service Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-brand-soft' : 'bg-brand-soft/70 group-hover:bg-brand-soft'
                  }`}
                >
                  {getIcon(svc.id)}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand bg-brand-soft px-2 py-0.5 rounded-md">
                    {svc.badge}
                  </span>
                  <h3 className="font-sora font-bold text-base text-ink mt-1 leading-snug">
                    {svc.name}
                  </h3>
                </div>
              </div>

              {/* Service Subtitle & Description */}
              <div className="mt-3">
                <div className="text-xs font-semibold text-brand">
                  {svc.subtitle}
                </div>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">
                  {svc.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Coverage Pill */}
      <div className="p-3 rounded-2xl bg-card border border-line flex items-center gap-2.5 text-xs text-muted font-medium shadow-xs">
        <div className="w-7 h-7 rounded-lg bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-ink">Zone couverte (52 quartiers) : </span>
          Cotonou · Abomey-Calavi · Porto-Novo · Ouidah & Pahou
        </div>
      </div>

      {/* Features preview */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted font-medium">
        <div className="flex items-center gap-1.5 p-2 bg-brand-soft/40 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
          <span>Colis protégé & suivi</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-brand-soft/40 rounded-xl">
          <Zap className="w-3.5 h-3.5 text-brand" />
          <span>Prise en charge express</span>
        </div>
      </div>
    </div>
  );
};
