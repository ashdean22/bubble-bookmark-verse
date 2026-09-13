const clearBootScreen = () => {
  const w = (window as unknown as { __bootWatchdog?: number }).__bootWatchdog;
  if (w) clearTimeout(w);
  try {
    window.sessionStorage.removeItem('bm_entry_retry_v1');
  } catch {
    // Startup recovery must also work when browser storage is unavailable.
  }
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

  try {
    // 1. Ensure polyfills are applied before any other module is even evaluated.
    // This prevents race conditions where Safari hits requestIdleCallback before it's polyfilled.
    await import('./polyfills.ts');

    // 2. Install diagnostics before loading the main application graph.
    const diagnostics = await import('./utils/diagnosticsCapture.ts');
    diagnostics.installDiagnosticsCapture();

    // 3. Load the core application dependencies in parallel.
    // We keep the boot screen visible until the React tree is ready to mount.
    const [react, reactDom, appModule] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('./App.tsx'),
      import('./index.css'),
    ]);

    const { createElement } = react;
    const { createRoot } = reactDom;
    const { default: App } = appModule;
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
