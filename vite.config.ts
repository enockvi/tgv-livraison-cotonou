import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fetchRoutesLive, fetchRoutesVersion } from './api/routes.js';
import { buildOrderRow, verifierTarifOfficiel } from './api/_order-normalize.js';

// Local dev middleware for /api/order matching Vercel Serverless Function behavior
function orderApiPlugin(): Plugin {
  return {
    name: 'tgv-order-api-dev',
    configureServer(server) {
      if (!server.ws) {
        (server as any).ws = {
          send: () => {},
          on: () => {},
          off: () => {},
          close: () => {},
          clients: new Set(),
        };
      }
      server.middlewares.use('/api/order', (req, res, next) => {
        // Mêmes variables d'environnement que le plugin /api/routes : sans cette hydratation,
        // le contrôle serveur du tarif ne pourrait pas joindre la grille officielle en dev.
        const envOrder = loadEnv(server.config.mode, process.cwd(), '');
        if (!process.env.SHEET_WEBHOOK_URL && envOrder.SHEET_WEBHOOK_URL) process.env.SHEET_WEBHOOK_URL = envOrder.SHEET_WEBHOOK_URL;
        if (!process.env.SHEET_TOKEN && envOrder.SHEET_TOKEN) process.env.SHEET_TOKEN = envOrder.SHEET_TOKEN;

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const d = JSON.parse(body || '{}');

            // Validation + normalisation PARTAGÉES avec la fonction Vercel (api/_order-normalize.js) :
            // une seule source de vérité, comportement identique en local et en production.
            const built = buildOrderRow(d, process.env.SHEET_TOKEN || '');
            if (!built.ok) {
              res.statusCode = built.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: built.error }));
              return;
            }

            const { row } = built;

            // Contrôle serveur du tarif, PARTAGÉ avec la production (api/order.js) : le prix
            // officiel de la grille live remplace toujours un prix client potentiellement périmé.
            if (!built.isDevis) {
              const controle = await verifierTarifOfficiel(row);
              if (controle.officiel) {
                if (controle.corrige) {
                  console.warn(
                    '[TGV] Tarif client divergent corrigé (dev) : réf.',
                    row.id,
                    row.tarif,
                    '->',
                    controle.tarif,
                    'FCFA'
                  );
                }
                row.tarif = controle.tarif;
                row.distance = controle.distance;
              }
            }

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

            // If webhook URL is set in env, dispatch to Google Sheets Apps Script
            if (process.env.SHEET_WEBHOOK_URL) {
              const ctl = new AbortController();
              const timer = setTimeout(() => ctl.abort(), 8000);
              try {
                const sheetRes = await fetch(process.env.SHEET_WEBHOOK_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain' },
                  body: JSON.stringify(row),
                  signal: ctl.signal,
                });
                clearTimeout(timer);
                const j = await sheetRes.json().catch(() => ({}));
                if (!j.ok) {
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: false, error: 'sheet_rejected' }));
                  return;
                }
              } catch (sheetErr) {
                clearTimeout(timer);
                console.warn('[Sheet Webhook Error]', sheetErr);
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            // Réponse alignée sur la production : auparavant `row` exposait SHEET_TOKEN au client en dev.
            res.end(JSON.stringify({ ok: true, total: row.tarif, statut: row.statut }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'server_error' }));
          }
        });
      });

      server.middlewares.use('/api/status', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const d = JSON.parse(body || '{}');
            const validIds = Array.isArray(d.ids) ? d.ids : [];
            const statuts: Record<string, string> = {};
            validIds.forEach((id: string) => { statuts[id] = 'Nouvelle'; });

            if (process.env.SHEET_WEBHOOK_URL) {
              const ctl = new AbortController();
              const t = setTimeout(() => ctl.abort(), 8000);
              try {
                const sheetRes = await fetch(process.env.SHEET_WEBHOOK_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain' },
                  body: JSON.stringify({ token: process.env.SHEET_TOKEN, action: 'status', ids: validIds }),
                  signal: ctl.signal,
                });
                clearTimeout(t);
                const j = await sheetRes.json().catch(() => ({}));
                if (j.ok && j.statuts) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, statuts: j.statuts }));
                  return;
                }
              } catch (err) {
                clearTimeout(t);
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, statuts }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'server_error' }));
          }
        });
      });
    },
  };
}

// En développement, Vite ne sert pas /api/* : ce middleware rejoue la fonction serverless
// `api/routes.js` (mêmes variables SHEET_WEBHOOK_URL / SHEET_TOKEN que sur Vercel) pour pouvoir
// tester les prix live localement. Sans variables, la route répond ok:false et l'app utilise
// la grille embarquée : comportement identique à la production sans Sheet configuré.
function routesApiPlugin(): Plugin {
  return {
    name: 'tgv-routes-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/routes', async (req, res) => {
        const env = loadEnv(server.config.mode, process.cwd(), '');
        if (!process.env.SHEET_WEBHOOK_URL && env.SHEET_WEBHOOK_URL) process.env.SHEET_WEBHOOK_URL = env.SHEET_WEBHOOK_URL;
        if (!process.env.SHEET_TOKEN && env.SHEET_TOKEN) process.env.SHEET_TOKEN = env.SHEET_TOKEN;

        const data = await fetchRoutesLive();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = data.ok ? 200 : 200; // jamais d'erreur bloquante en dev
        res.end(JSON.stringify(data));
      });

      // Parité avec api/routes-version.js : empreinte seule, jamais d'erreur bloquante en dev.
      server.middlewares.use('/api/routes-version', async (req, res) => {
        const env = loadEnv(server.config.mode, process.cwd(), '');
        if (!process.env.SHEET_WEBHOOK_URL && env.SHEET_WEBHOOK_URL) process.env.SHEET_WEBHOOK_URL = env.SHEET_WEBHOOK_URL;
        if (!process.env.SHEET_TOKEN && env.SHEET_TOKEN) process.env.SHEET_TOKEN = env.SHEET_TOKEN;

        const data = await fetchRoutesVersion();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = 200;
        res.end(JSON.stringify(data));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      orderApiPlugin(),
      routesApiPlugin(),
      VitePWA({
        // 'prompt' : le bandeau de mise à jour est affiché à l'utilisateur.
        // (Avec 'autoUpdate', le client PWA n'appelle jamais onNeedRefresh : le bandeau ne pourrait
        //  jamais s'afficher et la page serait rechargée silencieusement.)
        registerType: 'prompt',
        injectRegister: 'auto',
        // On garde public/manifest.json déjà lié dans index.html : évite deux manifests concurrents.
        manifest: false,
        workbox: {
          // Précache l'app shell + les assets hashés : plus de risque qu'un ancien SW serve un
          // index.html pointant vers des fichiers supprimés lors d'un nouveau déploiement Vercel.
          globPatterns: ['**/*.{js,css,html,png,svg,json}'],
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
