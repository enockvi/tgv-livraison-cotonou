// Fonction Vercel : renvoie uniquement l'EMPREINTE de la grille tarifaire (quelques octets).
//
// Le client l'interroge toutes les 5 minutes et à chaque reprise de focus ; il ne retélécharge
// /api/routes que si l'empreinte a changé. Réponse minuscule, mise en cache 60 s par le CDN :
// Apps Script n'est donc sollicité qu'une fois par minute et par POP, quel que soit le trafic,
// ce qui préserve son plafond d'exécutions simultanées.
import { fetchRoutesVersion } from './routes.js';

const CACHE_SUCCES = 'public, max-age=60, s-maxage=60, stale-while-revalidate=60';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const data = await fetchRoutesVersion();

  if (!data.ok) {
    // Jamais mis en cache : on ne fige pas une panne transitoire.
    res.setHeader('Cache-Control', 'no-store');
    // Non configuré = état normal en développement : réponse 200 pour que le client reste
    // silencieux et conserve simplement la grille déjà en mémoire.
    const code = data.error === 'not_configured' ? 200 : 502;
    return res.status(code).json(data);
  }

  res.setHeader('Cache-Control', CACHE_SUCCES);
  return res.status(200).json(data);
}
