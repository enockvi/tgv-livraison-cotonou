// Fonction Vercel : valide la commande, enregistre le tarif officiel/devis, puis l'envoie à Google Sheets.
//
// La validation et la normalisation vivent dans api/_order-normalize.js, PARTAGÉES avec le middleware
// de développement Vite (vite.config.ts) : une seule source de vérité, comportement identique en local
// et en production (P0 architecture).
import { buildOrderRow } from './_order-normalize.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ ok: false });

  try {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const built = buildOrderRow(d, process.env.SHEET_TOKEN);
    if (!built.ok) return res.status(built.status).json({ ok: false, error: built.error });

    const { row } = built;

    // Alerte opérateur dans les logs Vercel : plus de facturation silencieuse d'un trajet inconnu.
    if (d.tarifEstime) {
      console.warn(
        '[TGV] Tarif estimé (trajet hors grille tarifaire) :',
        row.dep,
        '->',
        row.dst,
        '| réf.',
        row.id,
        '|',
        row.tarif,
        'FCFA'
      );
    }

    if (process.env.SHEET_WEBHOOK_URL) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(process.env.SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(row),
        signal: ctl.signal,
      });
      clearTimeout(t);
      const j = await r.json().catch(() => ({}));
      if (!j.ok) return res.status(502).json({ ok: false });
    }

    return res.status(200).json({ ok: true, total: row.tarif, statut: row.statut });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
}
