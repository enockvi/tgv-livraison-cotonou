export type CommuneKey = 'cotonou' | 'calavi' | 'portonovo' | 'ouidah' | 'seme';

export interface Quartier {
  name: string;
  commune: CommuneKey;
}

export interface DeliveryService {
  id: number;
  name: string;
  subtitle: string;
  badge: string;
  icon: string;
  description: string;
}

export type OrderPriority = 'Standard' | 'Urgent';

export type OrderStatus = 'Nouvelle' | 'En cours' | 'Livrée' | 'Annulée';

export interface RouteCalculation {
  distance: number;
  tarif: number;
  /** false = aucun tarif officiel trouvé : le tarif renvoyé est une estimation de secours. */
  isExactSheetRoute: boolean;
  /** Provenance du tarif : grille live du Sheet ou matrice embarquée au build. */
  source?: 'live' | 'bundled';
}

export interface OrderPayload {
  id: string;
  svc: number;
  dep: {
    q: string;
    v: CommuneKey;
  };
  dst: {
    q: string;
    v: CommuneKey;
  };
  urgent: number; // 0 or 1
  note: string;
  gps: string;
  recipientName?: string;
  recipientPhone?: string;
  createdAt?: string;
  distance?: number;
  tarif?: number;
  status?: OrderStatus;
}

/**
 * Charge utile réellement envoyée à l'API `/api/order` (superset de OrderPayload).
 * C'est également la forme stockée dans la file d'attente hors-ligne.
 */
export interface OrderRequest extends OrderPayload {
  destNom?: string;
  destPhone?: string;
  paiement?: string;
  tarifEstime?: boolean;
}
