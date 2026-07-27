import './polyfills.ts'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import './index.css'

const clearBootScreen = () => {
  const w = (window as unknown as { __bootWatchdog?: number }).__bootWatchdog;
  if (w) clearTimeout(w);
  document.documentElement.classList.add('app-ready');
  const boot = document.getElementById('boot');
  if (boot) boot.remove();
};

const startupShell = (message = 'Loading BubbleMark…') =>
  createElement(
    'div',
    {
      className:
        'min-h-screen bg-background text-foreground flex items-center justify-center px-6 font-body',
      role: 'status',
      'aria-live': 'polite',
    },
    createElement(
      'div',
      { className: 'flex flex-col items-center gap-3 text-center' },
      createElement('div', {
        className: 'h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin',
      }),
      createElement('div', { className: 'text-sm text-muted-foreground' }, message),
    ),
  );

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

const loadApp = async (root: Root, container: HTMLElement) => {
  const timeoutId = window.setTimeout(() => {
    root.render(startupShell('Still loading BubbleMark…'));
    clearBootScreen();
  }, 2500);

  try {
    const { default: App } = await import('./App.tsx');
    window.clearTimeout(timeoutId);
    root.render(createElement(App));
    window.requestAnimationFrame(clearBootScreen);
  } catch (error) {
    window.clearTimeout(timeoutId);
    renderStartupError(container, error);
  }
};

const mount = () => {
  const container = document.getElementById('root');
  if (!container) {
    clearBootScreen();
    return;
  }

  try {
    const root = createRoot(container);
    root.render(startupShell());
    window.requestAnimationFrame(clearBootScreen);
    void loadApp(root, container);
  } catch (err) {
    renderStartupError(container, err);
  }
};

mount();
