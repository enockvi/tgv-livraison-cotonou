// Fonction Vercel : renvoie la grille tarifaire LIVE, lue dans l'onglet de tarifs du Google Sheet
// via Apps Script (action 'routes'). Résultat mis en cache par le CDN Vercel (s-maxage 30 min).
//
// L'application n'est jamais bloquée par cette route : en cas d'échec (hors-ligne, token absent,
// onglet introuvable), elle bascule sur la matrice embarquée `src/data/routesMatrix.json`,
// elle-même rafraîchie à chaque build par `npm run prebuild`.

const CACHE_SUCCES = 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400';
const TIMEOUT_MS = 15000;

/**
 * Interroge Apps Script et normalise la réponse.
 * Utilisé à la fois par la fonction serverless et par le middleware de développement de Vite
 * (voir vite.config.ts) pour éviter toute duplication de logique.
 */
export async function fetchRoutesLive() {
  const url = process.env.SHEET_WEBHOOK_URL;
  const token = process.env.SHEET_TOKEN;
  if (!url || !token) return { ok: false, error: 'not_configured' };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ token: token, action: 'routes' }),
      signal: ctl.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!data || !data.ok) return { ok: false, error: (data && data.error) || 'sheet_error' };

    // Validation stricte : on ne transmet au navigateur que des lignes exploitables.
    const routes = (Array.isArray(data.routes) ? data.routes : [])
      .filter(
        (t) =>
          Array.isArray(t) &&
          t.length >= 4 &&
          typeof t[0] === 'string' &&
          typeof t[1] === 'string' &&
          Number(t[2]) > 0 &&
          Number(t[3]) > 0
      )
      .map((t) => [t[0], t[1], Number(t[2]), Number(t[3])]);

    if (routes.length === 0) return { ok: false, error: 'grille_vide' };

    return {
      ok: true,
      source: 'sheet',
      generatedAt: data.generatedAt || null,
      onglet: data.onglet || null,
      count: routes.length,
      routes: routes
    };
  } catch (e) {
    return { ok: false, error: 'upstream_error' };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const data = await fetchRoutesLive();

  if (!data.ok) {
    // Erreurs jamais mises en cache pour ne pas figer une panne transitoire.
    res.setHeader('Cache-Control', 'no-store');
    // Non configuré = état normal en développement : réponse 200 pour que le client bascule
    // silencieusement sur la grille embarquée. Vraie panne amont = 502 (visible dans les logs).
    const code = data.error === 'not_configured' ? 200 : 502;
    return res.status(code).json(data);
  }

  res.setHeader('Cache-Control', CACHE_SUCCES);
  return res.status(200).json(data);
}
