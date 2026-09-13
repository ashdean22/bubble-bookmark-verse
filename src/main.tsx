import './polyfills.ts'
import { installDiagnosticsCapture } from './utils/diagnosticsCapture.ts'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

installDiagnosticsCapture();

const clearBootScreen = () => {
  const w = (window as unknown as { __bootWatchdog?: number }).__bootWatchdog;
  if (w) clearTimeout(w);
  document.documentElement.classList.add('app-ready');
  const boot = document.getElementById('boot');
  if (boot) boot.remove();
};

const renderStartupError = (container: HTMLElement, error: unknown) => {
  console.error('[BubbleMark] startup failed', error);
  container.innerHTML =
    '<div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:system-ui,sans-serif;color:#e6ecff;text-align:center;padding:24px;background:#080b1a">' +
    '<div style="font-size:18px;font-weight:700">BubbleMark could not start</div>' +
    '<div style="opacity:.72;font-size:13px;max-width:320px">The app hit a startup error before it could load. Reloading starts a clean session.</div>' +
    '<button onclick="location.reload()" style="padding:10px 18px;border-radius:999px;border:0;background:#0ea5e9;color:#06111f;font-weight:700;cursor:pointer">Reload</button>' +
    '</div>';
  clearBootScreen();
};

const mount = async () => {
  const container = document.getElementById('root');
  if (!container) {
    clearBootScreen();
    return;
  }

  // The entry point must always dismiss the static watchdog, even when the
  // larger application graph is slow or a cached module fails to download.
  clearBootScreen();
  container.innerHTML =
    '<div aria-label="Loading BubbleMark" style="min-height:100dvh;background:#080b1a"></div>';

  try {
    const { default: App } = await import('./App.tsx');
    const root = createRoot(container);
    root.render(createElement(App));
  } catch (err) {
    renderStartupError(container, err);
  }
};

window.addEventListener('error', (e) => {
  if (!document.documentElement.classList.contains('app-ready')) {
    console.error('[BubbleMark] early error', e.message);
  }
});
window.addEventListener('unhandledrejection', () => {
  // A rejected optional import must not leave the app stuck on the loader.
  clearBootScreen();
});

void mount();
