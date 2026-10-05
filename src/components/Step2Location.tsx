import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Quartier, CommuneKey } from '../types/order';
import {
  ALL_QUARTIERS,
  COMMUNE_NAMES,
  COMMUNES_SERVIES,
  NOMBRE_LIAISONS,
  calculateRouteDetails,
  estLiaisonOfficielle,
  formatFCFA,
  formatDistance,
  liaisonsDepuis,
  normalizePlaceName,
  quartierParNom,
} from '../data/communes';
import { useLiveRoutesVersion } from '../hooks/useLiveRoutesVersion';
import { triggerRipple } from '../utils/ripple';
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Route,
  Search,
  X,
} from 'lucide-react';

interface Step2LocationProps {
  dep: Quartier | null;
  dst: Quartier | null;
  gps: string | null;
  onSetDep: (q: Quartier | null) => void;
  onSetDst: (q: Quartier | null) => void;
  onSetGps: (coords: string | null) => void;
  onContinue: () => void;
}

type Panneau = 'dep' | 'dst' | null;

interface TrajetRecent {
  dep: Quartier;
  dst: Quartier;
}

const CLE_HISTORIQUE = 'tgv_orders_history';

export const Step2Location: React.FC<Step2LocationProps> = ({
  dep,
  dst,
  gps,
  onSetDep,
  onSetDst,
  onSetGps,
  onContinue,
}) => {
  // La grille live (Sheet) peut arriver après le premier rendu : on la suit pour rafraîchir
  // instantanément la liste des destinations desservies.
  const versionGrille = useLiveRoutesVersion();

  const [panneau, setPanneau] = useState<Panneau>(dep ? (dst ? null : 'dst') : 'dep');
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<CommuneKey | 'toutes'>('toutes');
  const [recents, setRecents] = useState<TrajetRecent[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMsg, setGpsMsg] = useState<{ text: string; error?: boolean } | null>(
    gps ? { text: 'Position GPS actuelle prête à être envoyée au motard' } : null
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const carteRef = useRef<HTMLDivElement>(null);

  // Destinations réellement desservies depuis le départ choisi (issues du CSV uniquement).
  const destinations = useMemo(
    () => (dep ? liaisonsDepuis(dep.name) : []),
    [dep, versionGrille]
  );

  const infoDestination = useMemo(() => {
    const map = new Map<string, { distance: number; tarif: number }>();
    destinations.forEach((l) => map.set(l.quartier.name, { distance: l.distance, tarif: l.tarif }));
    return map;
  }, [destinations]);

  const routeDetails = dep && dst ? calculateRouteDetails(dep.name, dst.name) : null;
  const tarifDisponible = Boolean(routeDetails && routeDetails.isExactSheetRoute && routeDetails.tarif > 0);
  const isComplete = Boolean(dep && dst && tarifDisponible);

  // Historique local : trajets récents réutilisables en un tap (uniquement s'ils sont desservis).
  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE_HISTORIQUE);
      if (!brut) return;
      const commandes = JSON.parse(brut) as { dep?: { q?: string }; dst?: { q?: string } }[];
      const vus = new Set<string>();
      const trouves: TrajetRecent[] = [];
      commandes.forEach((c) => {
        const d = c.dep?.q ? quartierParNom(c.dep.q) : undefined;
        const a = c.dst?.q ? quartierParNom(c.dst.q) : undefined;
        if (!d || !a) return;
        const cle = `${d.name}|${a.name}`;
        if (vus.has(cle) || !estLiaisonOfficielle(d.name, a.name)) return;
        vus.add(cle);
        trouves.push({ dep: d, dst: a });
      });
      setRecents(trouves.slice(0, 3));
    } catch {
      /* historique illisible : on n'affiche simplement aucun raccourci */
    }
  }, []);

  // Focus automatique dans la recherche à l'ouverture d'un panneau.
  useEffect(() => {
    if (panneau) {
      setRecherche('');
      setFiltre('toutes');
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [panneau]);

  const correspond = (q: Quartier, requete: string) => {
    if (!requete) return true;
    const besoin = normalizePlaceName(requete);
    return (
      normalizePlaceName(q.name).includes(besoin) ||
      normalizePlaceName(COMMUNE_NAMES[q.commune]).includes(besoin)
    );
  };

  // Liste affichée, groupée par commune (départ : les 52 quartiers du CSV / arrivée : seulement
  // les quartiers reliés au départ choisi).
  const groupes = useMemo(() => {
    const source: Quartier[] = panneau === 'dst' ? destinations.map((l) => l.quartier) : ALL_QUARTIERS;
    const filtres = source.filter(
      (q) => (filtre === 'toutes' || q.commune === filtre) && correspond(q, recherche)
    );
    const parCommune = new Map<CommuneKey, Quartier[]>();
    filtres.forEach((q) => {
      const liste = parCommune.get(q.commune) || [];
      liste.push(q);
      parCommune.set(q.commune, liste);
    });
    const ordre = COMMUNES_SERVIES.map((c) => c.key);
    return Array.from(parCommune.entries()).sort(
      (a, b) => ordre.indexOf(a[0]) - ordre.indexOf(b[0])
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panneau, destinations, recherche, filtre, versionGrille]);

  const nombreResultats = groupes.reduce((n, [, liste]) => n + liste.length, 0);

  const choisirDep = (q: Quartier) => {
    onSetDep(q);
    if (dst && !estLiaisonOfficielle(q.name, dst.name)) onSetDst(null);
    setPanneau('dst');
    if (carteRef.current) carteRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const choisirDst = (q: Quartier) => {
    onSetDst(q);
    setPanneau(null);
  };

  const choisirTrajetRecent = (trajet: TrajetRecent) => {
    onSetDep(trajet.dep);
    onSetDst(trajet.dst);
    setPanneau(null);
  };

  const handleSwap = () => {
    const precedentDep = dep;
    const precedentDst = dst;
    // La grille est symétrique : si le trajet est desservi dans un sens, il l'est dans l'autre.
    onSetDep(precedentDst);
    onSetDst(precedentDep);
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setGpsMsg({
        text: 'La géolocalisation n’est pas supportée par cet appareil. Précisez le repère à l’étape suivante.',
        error: true,
      });
      return;
    }

    setGpsLoading(true);
    setGpsMsg({ text: 'Recherche de vos coordonnées satellite en cours…' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        onSetGps(coords);
        setGpsLoading(false);
        setGpsMsg({
          text: `Position GPS fixée (${coords}) avec succès. Le motard recevra le lien Google Maps !`,
        });
      },
      (err) => {
        setGpsLoading(false);
        let errorText = 'Impossible d’accéder à la position.';
        if (err.code === err.PERMISSION_DENIED) {
          errorText = 'Accès GPS refusé. Veuillez autoriser la localisation ou choisir votre quartier ci-dessus.';
        } else if (err.code === err.TIMEOUT) {
          errorText = 'Délai GPS dépassé. Veuillez réessayer ou indiquer un repère textuel.';
        }
        setGpsMsg({ text: errorText, error: true });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // ---------------------------------------------------------------- rendu

  const champSelectionne = (q: Quartier | null) => (
    <span className="flex items-center gap-2 min-w-0">
      <span className="font-bold text-[15px] text-ink truncate">{q ? q.name : '—'}</span>
      {q && (
        <span className="text-[10px] uppercase font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded-md flex-shrink-0">
          {COMMUNE_NAMES[q.commune]}
        </span>
      )}
    </span>
  );

  const renduListe = (type: 'dep' | 'dst') => {
    if (type === 'dst' && !dep) {
      return (
        <div className="p-4 text-center space-y-1">
          <p className="text-xs font-bold text-ink">Choisissez d’abord le point de départ</p>
          <p className="text-[11px] text-muted">
            Les destinations proposées dépendent du quartier de prise en charge.
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Recherche + filtres communes */}
        <div className="p-3 border-b border-line/60 space-y-2 bg-card">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={type === 'dep' ? 'Rechercher un quartier de départ…' : 'Rechercher une destination…'}
              className="w-full h-11 pl-9 pr-9 rounded-xl border-2 border-line bg-surface text-sm font-semibold text-ink placeholder:text-muted/50 focus:border-brand focus:bg-card focus:outline-none transition-all"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted hover:bg-brand-soft"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
            <button
              type="button"
              onClick={() => setFiltre('toutes')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                filtre === 'toutes'
                  ? 'bg-brand-solid text-white'
                  : 'bg-surface text-muted border border-line hover:border-brand/40'
              }`}
            >
              Toutes ({type === 'dep' ? ALL_QUARTIERS.length : destinations.length})
            </button>
            {COMMUNES_SERVIES.map((c) => {
              const total =
                type === 'dep'
                  ? c.quartiers
                  : destinations.filter((l) => l.quartier.commune === c.key).length;
              if (total === 0) return null;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFiltre(c.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                    filtre === c.key
                      ? 'bg-brand-solid text-white'
                      : 'bg-surface text-muted border border-line hover:border-brand/40'
                  }`}
                >
                  {c.label} ({total})
                </button>
              );
            })}
          </div>
        </div>

        {/* Résultats */}
        <div className="max-h-72 overflow-y-auto divide-y divide-line/40">
          {nombreResultats === 0 ? (
            <div className="p-4 text-center space-y-1">
              <p className="text-xs font-bold text-ink">Aucun résultat pour « {recherche} »</p>
              <p className="text-[11px] text-muted">
                Seuls les quartiers desservis par TGV Livraison sont proposés. Choisissez le quartier
                le plus proche, puis précisez le repère exact à l’étape suivante.
              </p>
            </div>
          ) : (
            groupes.map(([commune, liste], indexGroupe) => (
              <div key={commune}>
                <div className="px-4 py-1.5 bg-surface text-[10px] font-bold uppercase tracking-wider text-muted sticky top-0 z-10">
                  {COMMUNE_NAMES[commune]} · {liste.length}
                </div>
                {liste.map((q, indexItem) => {
                  const info = type === 'dst' ? infoDestination.get(q.name) : undefined;
                  const selectionne = type === 'dep' ? dep?.name === q.name : dst?.name === q.name;
                  const plusProche = type === 'dst' && indexGroupe === 0 && indexItem === 0 && !recherche && filtre === 'toutes';
                  return (
                    <button
                      key={`${commune}-${q.name}`}
                      type="button"
                      onClick={() => (type === 'dep' ? choisirDep(q) : choisirDst(q))}
                      aria-selected={selectionne}
                      role="option"
                      className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left transition ${
                        selectionne ? 'bg-brand-soft' : 'hover:bg-surface'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-semibold text-ink truncate">{q.name}</span>
                        {plusProche && (
                          <span className="text-[9px] font-bold uppercase text-heading bg-accent px-1.5 py-0.5 rounded-md flex-shrink-0">
                            Le plus proche
                          </span>
                        )}
                      </span>

                      <span className="flex items-center gap-2 flex-shrink-0">
                        {info && (
                          <span className="text-right leading-tight">
                            <span className="block text-[10px] text-muted">
                              ~{formatDistance(info.distance)}
                            </span>
                            <span className="block text-[11px] font-extrabold text-heading">
                              {formatFCFA(info.tarif)}
                            </span>
                          </span>
                        )}
                        {selectionne ? (
                          <CheckCircle className="w-4 h-4 text-brand" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted/50" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </>
    );
  };

  return (
    <div ref={carteRef} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sora text-ink tracking-tight">
          Où livrer ?
        </h1>
        <p className="text-sm text-muted mt-1">
          Choisissez le quartier de prise en charge, puis la destination parmi celles réellement
          desservies par TGV Livraison.
        </p>
      </div>

      {/* Trajets récents : un seul tap pour tout remplir */}
      {recents.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-muted mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand" />
            Vos derniers trajets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recents.map((trajet, index) => (
              <button
                key={index}
                type="button"
                onClick={() => choisirTrajetRecent(trajet)}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-card border border-line text-ink hover:border-brand hover:bg-brand-soft transition"
              >
                <span className="truncate max-w-[100px]">{trajet.dep.name}</span>
                <ChevronRight className="w-3 h-3 text-brand flex-shrink-0" />
                <span className="truncate max-w-[100px]">{trajet.dst.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sélection Départ / Destination */}
      <div className="bg-card border-2 border-line rounded-3xl shadow-xs overflow-hidden">
        {/* Départ */}
        <button
          type="button"
          onClick={() => setPanneau(panneau === 'dep' ? null : 'dep')}
          className="w-full px-4 py-3.5 flex items-center gap-3 text-left border-b border-line/60 hover:bg-surface transition"
          aria-expanded={panneau === 'dep'}
        >
          <span className="w-8 h-8 rounded-full bg-brand-solid text-white flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              1 · Départ (prise en charge)
            </span>
            {dep ? (
              champSelectionne(dep)
            ) : (
              <span className="block text-sm font-semibold text-muted/70">
                Choisir le quartier de départ
              </span>
            )}
          </span>
          <ChevronRight
            className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${
              panneau === 'dep' ? 'rotate-90' : ''
            }`}
          />
        </button>

        {panneau === 'dep' && renduListe('dep')}

        {/* Destination */}
        <button
          type="button"
          onClick={() => setPanneau(panneau === 'dst' ? null : 'dst')}
          className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-surface transition disabled:cursor-not-allowed disabled:hover:bg-card"
          aria-expanded={panneau === 'dst'}
          disabled={!dep}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              dep ? 'bg-accent text-heading' : 'bg-line text-muted'
            }`}
          >
            <Route className="w-4 h-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              2 · Destination (livraison)
            </span>
            {dst ? (
              champSelectionne(dst)
            ) : (
              <span className="block text-sm font-semibold text-muted/70">
                {dep ? 'Choisir la destination' : 'En attente du départ'}
              </span>
            )}
          </span>
          {dep ? (
            <span className="text-[10px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full flex-shrink-0">
              {destinations.length} desservies
            </span>
          ) : (
            <ChevronRight className="w-4 h-4 text-muted/40 flex-shrink-0" />
          )}
        </button>

        {panneau === 'dst' && renduListe('dst')}

        {/* Inverser */}
        {(dep || dst) && (
          <div className="px-4 py-2.5 bg-surface border-t border-line/60 flex items-center justify-between">
            <span className="text-[11px] text-muted">
              {dep && dst
                ? 'Trajet symétrique : le retour suit le même tarif.'
                : 'Les deux sens d’une liaison partagent le même tarif.'}
            </span>
            <button
              type="button"
              onClick={handleSwap}
              disabled={!dep || !dst}
              className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-line bg-card text-brand hover:border-brand transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Inverser
            </button>
          </div>
        )}
      </div>

      {/* Récapitulatif du tarif officiel */}
      {dep && dst && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            tarifDisponible ? 'bg-brand-soft border-brand/20' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="min-w-0">
            <div className="text-xs font-bold text-brand uppercase tracking-wider truncate">
              {dep.name} → {dst.name}
            </div>
            {tarifDisponible && routeDetails ? (
              <div className="text-xs text-muted mt-0.5">
                Distance officielle :{' '}
                <b className="text-ink">{formatDistance(routeDetails.distance)}</b>
                {routeDetails.source === 'live' && (
                  <span className="ml-1.5 text-[10px] font-bold text-heading bg-accent/30 px-1.5 py-0.5 rounded-md">
                    à jour
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-amber-800 mt-0.5">
                Cette liaison n’est pas dans la grille officielle : choisissez une destination
                proposée ci-dessus.
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs text-muted block">Tarif officiel</span>
            <span className="font-sora font-extrabold text-xl text-heading">
              {tarifDisponible && routeDetails ? formatFCFA(routeDetails.tarif) : 'À confirmer'}
            </span>
          </div>
        </div>
      )}

      {/* GPS */}
      <div className="p-4 rounded-2xl bg-card border border-line space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGetGPS}
            disabled={gpsLoading}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              gps ? 'bg-brand-soft text-brand border border-brand/30' : 'bg-brand-solid text-white hover:bg-brand-deep'
            }`}
          >
            <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gps ? 'Coordonnées GPS jointes' : 'Joindre ma position GPS en direct'}</span>
          </button>

          {gps && (
            <button
              type="button"
              onClick={() => onSetGps(null)}
              className="text-[11px] text-red-600 hover:underline"
            >
              Retirer le GPS
            </button>
          )}
        </div>

        {gpsMsg && (
          <p
            className={`text-xs flex items-center gap-1.5 ${
              gpsMsg.error ? 'text-amber-700' : 'text-brand'
            }`}
          >
            {gpsMsg.error ? (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span>{gpsMsg.text}</span>
          </p>
        )}
      </div>

      <p className="text-[11px] text-muted text-center">
        {ALL_QUARTIERS.length} quartiers desservis · {NOMBRE_LIAISONS} liaisons officielles (grille TGV)
      </p>

      {/* CTA */}
      <div className="pt-1">
        <button
          type="button"
          disabled={!isComplete}
          onClick={(e) => {
            if (isComplete) {
              triggerRipple(e);
              onContinue();
            }
          }}
          className={`cta btn-ripple w-full h-14 rounded-2xl font-sora font-bold text-base transition-all flex items-center justify-center gap-2 ${
            isComplete
              ? 'bg-brand-solid text-white shadow-md hover:bg-brand-deep hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer'
              : 'bg-line text-muted cursor-not-allowed opacity-80'
          }`}
        >
          <span>
            {isComplete && routeDetails
              ? `Continuer · ${formatFCFA(routeDetails.tarif)} (~${formatDistance(routeDetails.distance)})`
              : dep && dst
                ? 'Liaison non desservie'
                : 'Sélectionnez départ et destination'}
          </span>
        </button>
      </div>
    </div>
  );
};
