const fs = require('fs');
const sheetData = require('../src/data/sheetQuartiers.json');
const matrix = require('../src/data/routesMatrix.json');

const content = `import { CommuneKey, DeliveryService, Quartier, RouteCalculation } from '../types/order';
import routesMatrixJson from './routesMatrix.json';

export const COMMUNE_NAMES: Record<CommuneKey, string> = {
  cotonou: 'Cotonou',
  calavi: 'Abomey-Calavi',
  portonovo: 'Porto-Novo',
  ouidah: 'Ouidah & Pahou',
  seme: 'Sémè-Podji',
};

export const PHONE_DISPATCH_1 = '2290142016986';
export const PHONE_DISPLAY_1 = '+229 01 42 01 69 86';

export const SERVICES: DeliveryService[] = [
  {
    id: 0,
    name: 'Colis & e-commerce',
    subtitle: 'Remise en main propre',
    badge: 'Standard / Express',
    description: 'Vêtements, chaussures, accessoires, électronique et commandes boutiques en ligne.',
    icon: 'package',
  },
  {
    id: 1,
    name: 'Repas & Nourriture',
    subtitle: 'Sac isotherme chaud/froid',
    badge: 'Maintien au chaud',
    description: 'Plats cuisinés de restaurants, traiteurs, gâteaux, fast-food livrés intacts et chauds.',
    icon: 'utensils',
  },
  {
    id: 2,
    name: 'Documents & plis',
    subtitle: 'Pochette scellée sécurisée',
    badge: 'Confidentiel',
    description: 'Contrats, passeports, diplômes, factures, dossiers d’appels d’offres et courriers urgents.',
    icon: 'file-text',
  },
  {
    id: 3,
    name: 'Courses marché & vivres',
    subtitle: 'Dantokpa & supermarché',
    badge: 'Achat & livraison',
    description: 'Achats au grand marché Dantokpa, vivres frais, épiceries, pièces détachées et pharmacies.',
    icon: 'shopping-bag',
  },
];

export const QUARTIERS_BY_COMMUNE: Record<CommuneKey, string[]> = ${JSON.stringify(sheetData.quartiersByCommune, null, 2)};

export const ALL_QUARTIERS: Quartier[] = (
  Object.entries(QUARTIERS_BY_COMMUNE) as [CommuneKey, string[]][]
).flatMap(([commune, list]) =>
  list.map((name) => ({
    name,
    commune,
  }))
);

const ROUTES_LOOKUP: Record<string, [number, number]> = routesMatrixJson;

export function normalizePlaceName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/\\s*\\(.*\\)/g, '') // remove parentheses if any
    .replace(/[,;]/g, '')
    .trim();
}

export function getRouteKey(a: string, b: string): string {
  const normA = normalizePlaceName(a);
  const normB = normalizePlaceName(b);
  return [normA, normB].sort().join('|');
}

export function calculateRouteDetails(depName: string, dstName: string): RouteCalculation {
  if (!depName || !dstName) {
    return { distance: 0, tarif: 1000, isExactSheetRoute: false };
  }
  const normA = normalizePlaceName(depName);
  const normB = normalizePlaceName(dstName);
  if (normA === normB) {
    return { distance: 1.0, tarif: 700, isExactSheetRoute: true };
  }

  const key = [normA, normB].sort().join('|');
  const match = ROUTES_LOOKUP[key];
  if (match) {
    return {
      distance: match[0],
      tarif: match[1],
      isExactSheetRoute: true,
    };
  }

  // Fallback: search partial match
  for (const [k, val] of Object.entries(ROUTES_LOOKUP)) {
    const [p1, p2] = k.split('|');
    if ((p1.includes(normA) || normA.includes(p1)) && (p2.includes(normB) || normB.includes(p2))) {
      return { distance: val[0], tarif: val[1], isExactSheetRoute: true };
    }
  }

  return { distance: 10.0, tarif: 1200, isExactSheetRoute: false };
}

export function calculateTarif(depZoneOrName: string, dstZoneOrName: string): number {
  return calculateRouteDetails(depZoneOrName, dstZoneOrName).tarif;
}

export function formatFCFA(amount: number): string {
  return \`\${amount.toLocaleString('fr-FR')} FCFA\`;
}

export function formatDistance(km: number): string {
  return \`\${km.toFixed(1).replace('.0', '')} km\`;
}

export function generateOrderId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yearShort = String(d.getFullYear()).slice(2);
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return \`TGV-\${yearShort}\${month}\${day}-\${rand}\`;
}
`;

fs.writeFileSync('src/data/communes.ts', content);
console.log('src/data/communes.ts generated.');
