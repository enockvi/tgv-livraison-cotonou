import React, { useState, useEffect, useCallback } from 'react';
import { Quartier, OrderPayload } from './types/order';
import { SERVICES, generateOrderId, calculateTarif, formatFCFA, PHONE_DISPLAY_1 } from './data/communes';
import { Navbar } from './components/Navbar';
import { AppFooter } from './components/AppFooter';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { SplashIntro } from './components/SplashIntro';
import { Step1Service } from './components/Step1Service';
import { Step2Location } from './components/Step2Location';
import { Step3Notes } from './components/Step3Notes';
import { Step4Confirmation } from './components/Step4Confirmation';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { WorkflowDocsModal } from './components/WorkflowDocsModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  WifiOff,
  CheckCircle,
  Clock,
  ShieldCheck,
  MapPin,
  PhoneCall,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

const STORAGE_ORDERS_KEY = 'tgv_orders_history';
const SPLASH_SESSION_KEY = 'tgv_splash_shown';

export default function App() {
  // Le splash n'est joué automatiquement qu'une fois par session
  // (il reste rejouable via le logo ou le bouton de la barre supérieure).
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(0);
  const [dep, setDep] = useState<Quartier | null>(null);
  const [dst, setDst] = useState<Quartier | null>(null);
  const [gps, setGps] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [urgent, setUrgent] = useState(0);
  const [orderId, setOrderId] = useState(() => generateOrderId());

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('tgv_theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tgv_theme', theme);
    } catch (e) {
      console.error(e);
    }
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0E1512');
    } else {
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#F6F4EF');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Callback stable : évite de relancer l'animation du splash à chaque rendu de App.
  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      /* navigation privée : on ignore */
    }
    setShowSplash(false);
  }, []);

  const [pastOrders, setPastOrders] = useState<OrderPayload[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);

  const { isOnline, pendingCount } = useOnlineStatus();

  // Save order to history
  const handleOrderSaved = (order: OrderPayload) => {
    setPastOrders((prev) => {
      const updated = [order, ...prev.filter((o) => o.id !== order.id)].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save order to localStorage:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_ORDERS_KEY);
      setPastOrders([]);
    } catch (e) {
      console.error(e);
    }
  };

  // Reset to create a new order
  const handleResetOrder = () => {
    setOrderId(generateOrderId());
    setStep(1);
    setDep(null);
    setDst(null);
    setGps(null);
    setNote('');
    setRecipientName('');
    setRecipientPhone('');
    setUrgent(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Re-order a past delivery
  const handleReorder = (order: OrderPayload) => {
    setSelectedService(order.svc);
    setDep({ name: order.dep.q, commune: order.dep.v });
    setDst({ name: order.dst.q, commune: order.dst.v });
    setNote(order.note || '');
    setRecipientName(order.recipientName || '');
    setRecipientPhone(order.recipientPhone || '');
    setUrgent(order.urgent);
    setGps(order.gps || null);
    setOrderId(generateOrderId());
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentService = SERVICES.find((s) => s.id === selectedService) || SERVICES[0];

  return (
    <div className="min-h-screen bg-page flex flex-col font-sans text-ink">
      {/* Animated Splash Screen */}
      {showSplash && (
        <SplashIntro onComplete={handleSplashComplete} />
      )}

      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 sticky top-0 z-40 shadow-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>
            Mode hors-ligne : vous pouvez continuer votre commande, elle sera transmise dès retour de la connexion.
          </span>
          {pendingCount > 0 && (
            <span className="bg-amber-800 px-2 py-0.5 rounded-full text-[10px]">
              {pendingCount} en attente
            </span>
          )}
        </div>
      )}

      {/* Main Two-Column Layout for Desktop, Single Column for Mobile */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-0 sm:px-4 md:px-8 py-0 sm:py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Brand Narrative - Hidden on Small Screens) */}
        <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between py-6 px-4 space-y-8 sticky top-10">
          <div className="space-y-6">
            {/* Brand Logo & Title */}
            <div className="space-y-3">
              <button
                onClick={() => setShowSplash(true)}
                className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
                title="Cliquer pour rejouer l'animation de démarrage"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-deep flex items-center justify-center text-accent font-black text-lg tracking-tighter shadow-md group-hover:scale-105 transition-transform">
                  <span>TGV</span>
                </div>
                <div>
                  <h2 className="font-sora font-extrabold text-2xl tracking-tight text-ink leading-none">
                    TGV <span className="text-brand">Livraison</span>
                  </h2>
                  <span className="text-xs text-brand font-bold tracking-wider uppercase">
                    Cotonou & Grand Nokoué
                  </span>
                </div>
              </button>

              <h1 className="font-sora font-black text-4xl leading-[1.1] text-heading tracking-tight">
                Livré à temps, reçu avec le sourire.
              </h1>

              <p className="text-base text-muted font-medium leading-relaxed">
                Le service de livraison express le plus fiable de Cotonou. Commandez une course en 4 étapes simples sans inscription compliquée. Nos motards confirment directement avec vous sur WhatsApp.
              </p>
            </div>

            {/* Value Propositions */}
            <ul className="space-y-3 font-semibold text-sm text-ink">
              <li className="flex items-center gap-3 p-3 bg-card/70 rounded-2xl border border-line">
                <div className="w-6 h-6 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>Cotonou, Abomey-Calavi, Sémè-Podji, Porto-Novo</span>
              </li>

              <li className="flex items-center gap-3 p-3 bg-card/70 rounded-2xl border border-line">
                <div className="w-6 h-6 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span>Tarif transparent calculé avant validation (dès 1 000 FCFA)</span>
              </li>

              <li className="flex items-center gap-3 p-3 bg-card/70 rounded-2xl border border-line">
                <div className="w-6 h-6 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Paiement en mains propres à la livraison ou Mobile Money</span>
              </li>
            </ul>
          </div>

          {/* Hotline & Workflow action in left sidebar */}
          <div className="p-5 rounded-3xl bg-brand-deep text-white space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Régulation & Assistance
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-emerald-200">
                7j/7 06h - 22h
              </span>
            </div>

            <div className="text-sm">
              Une urgence ? Notre équipe au standard téléphonique est à votre écoute :
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <a
                href={`tel:${PHONE_DISPLAY_1.replace(/\s+/g, '')}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition font-mono font-bold text-xs"
              >
                <span>WhatsApp / Appel : {PHONE_DISPLAY_1}</span>
                <PhoneCall className="w-3.5 h-3.5 text-accent" />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setIsWorkflowOpen(true)}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-accent text-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-accent-bright transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Voir le workflow & déploiement Vercel</span>
            </button>
          </div>
        </aside>

        {/* Right Column (Mobile-Style Interactive PWA App Container) */}
        <main className="w-full lg:col-span-7 flex flex-col justify-center">
          <div className="w-full max-w-[520px] mx-auto bg-surface sm:rounded-[36px] sm:shadow-[0_24px_60px_rgba(14,21,18,0.14)] sm:border sm:border-line overflow-hidden min-h-[92vh] sm:min-h-[780px] flex flex-col justify-between">
            {/* Top PWA Install Notice */}
            <PWAInstallBanner />

            {/* App Header & Step Tracker */}
            <Navbar
              step={step}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onBack={() => setStep((s) => Math.max(1, s - 1))}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenWorkflow={() => setIsWorkflowOpen(true)}
              pastOrdersCount={pastOrders.length}
              onReplaySplash={() => setShowSplash(true)}
            />

            {/* Core Step Content */}
            <div className="flex-1 p-5 sm:p-7">
              {step === 1 && (
                <Step1Service
                  selectedService={selectedService}
                  onSelectService={(id) => {
                    setSelectedService(id);
                    setStep(2);
                  }}
                />
              )}

              {step === 2 && (
                <Step2Location
                  dep={dep}
                  dst={dst}
                  gps={gps}
                  onSetDep={setDep}
                  onSetDst={setDst}
                  onSetGps={setGps}
                  onContinue={() => setStep(3)}
                />
              )}

              {step === 3 && dep && dst && (
                <Step3Notes
                  note={note}
                  urgent={urgent}
                  dep={dep}
                  dst={dst}
                  recipientName={recipientName}
                  recipientPhone={recipientPhone}
                  onSetNote={setNote}
                  onSetUrgent={setUrgent}
                  onSetRecipientName={setRecipientName}
                  onSetRecipientPhone={setRecipientPhone}
                  onContinue={() => setStep(4)}
                />
              )}

              {step === 4 && dep && dst && (
                <Step4Confirmation
                  orderId={orderId}
                  service={currentService}
                  dep={dep}
                  dst={dst}
                  urgent={urgent}
                  note={note}
                  recipientName={recipientName}
                  recipientPhone={recipientPhone}
                  gps={gps}
                  onOrderSaved={handleOrderSaved}
                  onResetOrder={handleResetOrder}
                />
              )}
            </div>

            {/* Safe Bottom padding & subtle copyright */}
            <footer className="px-6 py-3 border-t border-line/40 text-center text-[10px] text-muted flex flex-col sm:flex-row items-center justify-between gap-1">
              <span>
                TGV Livraison · Siège : <strong className="font-bold">Akpakpa Kpondéhou</strong>
              </span>
              <button
                onClick={() => setIsWorkflowOpen(true)}
                className="underline hover:text-brand"
              >
                Guide Workflow
              </button>
            </footer>
          </div>
        </main>
      </div>

      {/* Pied de page global — siège de l'app, rendu sous toutes les interfaces */}
      <AppFooter />

      {/* Modals */}
      <OrderHistoryModal
        isOpen={isHistoryOpen}
        orders={pastOrders}
        onClose={() => setIsHistoryOpen(false)}
        onClearHistory={handleClearHistory}
        onReorder={handleReorder}
      />

      <WorkflowDocsModal
        isOpen={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
      />

      {/* Bandeau de mise à jour PWA / disponibilité hors-ligne */}
      <PWAUpdatePrompt />
    </div>
  );
}
