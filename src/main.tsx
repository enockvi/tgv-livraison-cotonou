import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalRipple } from './utils/ripple';
import { initLiveRoutes } from './data/routesLive';

setupGlobalRipple();

// Grille tarifaire live (non bloquant) : en cas d'échec, la matrice embarquée est utilisée.
initLiveRoutes();

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
