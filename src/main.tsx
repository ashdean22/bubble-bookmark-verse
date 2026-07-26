import './polyfills.ts'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initFaviconCache } from './utils/faviconCache'

// Warm favicons from previous visits before React mounts so bubble icons
// are already cached/decoded on first paint.
initFaviconCache();

const clearBootScreen = () => {
  const w = (window as unknown as { __bootWatchdog?: number }).__bootWatchdog;
  if (w) clearTimeout(w);
  document.documentElement.classList.add('app-ready');
  document.getElementById('boot')?.remove();
};

const mount = () => {
  const container = document.getElementById('root');
  if (!container) return;
  try {
    createRoot(container).render(<App />);
  } catch (err) {
    console.error('[BubbleMark] mount failed', err);
    container.innerHTML =
      '<div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:system-ui,sans-serif;color:#e6ecff;text-align:center;padding:24px">' +
      '<div style="font-size:18px;font-weight:700">BubbleMark could not start</div>' +
      '<div style="opacity:.7;font-size:13px">Reloading usually fixes this.</div>' +
      '<button onclick="location.reload()" style="padding:10px 18px;border-radius:999px;border:0;background:#8b5cf6;color:#fff;font-weight:600;cursor:pointer">Reload</button>' +
      '</div>';
  } finally {
    clearBootScreen();
  }
};

mount();
