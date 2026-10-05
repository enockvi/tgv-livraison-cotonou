// Fonction Vercel Serverless : interroge le statut des commandes dans Google Sheets via Apps Script.
const ID_REGEX = /^TGV-\d{6}-[A-Z0-9]{4,8}$/;
const STATUTS_VALIDES = ['Nouvelle', 'En cours', 'Livrée', 'Annulée'];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Même politique d'origine que /api/order : seules les requêtes émises par le site
  // lui-même sont acceptées (plus d'en-tête CORS générique « * » contradictoire).
  const origin = req.headers.origin;
  if (origin && req.headers.host) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = '';
    }
    if (originHost && originHost !== req.headers.host) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const rawIds = Array.isArray(body.ids) ? body.ids : [];

    // Dédoublonnage, limitation à 20 identifiants et validation regex
    const validIds = [...new Set(rawIds)]
      .filter(id => typeof id === 'string' && ID_REGEX.test(id))
      .slice(0, 20);

    if (validIds.length === 0) {
      return res.status(200).json({ ok: true, statuts: {} });
    }

    if (!process.env.SHEET_WEBHOOK_URL) {
      // Si la feuille n'est pas encore configurée, réponse par défaut sécurisée
      const fallback = {};
      validIds.forEach(id => { fallback[id] = 'Inconnue'; });
      return res.status(200).json({ ok: true, statuts: fallback });
    }

    const ctl = new AbortController();
    const timeout = setTimeout(() => ctl.abort(), 8000);

    const r = await fetch(process.env.SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        token: process.env.SHEET_TOKEN,
        action: 'status',
        ids: validIds
      }),
      signal: ctl.signal
    });
    clearTimeout(timeout);

    const data = await r.json().catch(() => ({}));
    if (!data.ok || !data.statuts) {
      return res.status(502).json({ ok: false, error: 'sheet_error' });
    }

    // Filtrer strictement sur la liste blanche autorisée
    const filtered = {};
    validIds.forEach(id => {
      const s = data.statuts[id];
      filtered[id] = STATUTS_VALIDES.includes(s) ? s : 'Inconnue';
    });

    return res.status(200).json({ ok: true, statuts: filtered });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
