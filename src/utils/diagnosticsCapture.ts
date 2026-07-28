export type DiagEntry = {
  t: number;
  kind: 'console.error' | 'console.warn' | 'window.error' | 'unhandledrejection' | 'fetch.error' | 'fetch.status';
  message: string;
  detail?: string;
};

export const DIAGNOSTICS_STORAGE_KEY = 'bm_diagnostics_log_v1';
export const DIAGNOSTICS_REOPEN_KEY = 'bm_diag_reopen';

const MAX_ENTRIES = 100;

export const safeDiagnosticString = (value: unknown): string => {
  if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const readDiagnosticsLog = (): DiagEntry[] => {
  try {
    const raw = window.sessionStorage.getItem(DIAGNOSTICS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DiagEntry[]) : [];
  } catch {
    return [];
  }
};

export const writeDiagnosticsLog = (entries: DiagEntry[]) => {
  try {
    window.sessionStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Diagnostics must never interfere with app startup.
  }
};

export const pushDiagnosticsEntry = (entry: Omit<DiagEntry, 't'>) => {
  try {
    writeDiagnosticsLog([...readDiagnosticsLog(), { ...entry, t: Date.now() }]);
    window.dispatchEvent(new CustomEvent('bm-diag-updated'));
  } catch {
    // Diagnostics must never interfere with app startup.
  }
};

let installed = false;

export const installDiagnosticsCapture = () => {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    pushDiagnosticsEntry({ kind: 'console.error', message: args.map(safeDiagnosticString).join(' ') });
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    pushDiagnosticsEntry({ kind: 'console.warn', message: args.map(safeDiagnosticString).join(' ') });
    originalWarn(...args);
  };

  window.addEventListener('error', (event) => {
    pushDiagnosticsEntry({
      kind: 'window.error',
      message: event.message || 'Uncaught error',
      detail: `${event.filename || ''}:${event.lineno || 0}:${event.colno || 0}${event.error?.stack ? `\n${event.error.stack}` : ''}`,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    pushDiagnosticsEntry({ kind: 'unhandledrejection', message: safeDiagnosticString(event.reason) });
  });

  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      try {
        const response = await originalFetch(input, init);
        if (!response.ok) {
          pushDiagnosticsEntry({ kind: 'fetch.status', message: `${response.status} ${response.statusText} — ${url}` });
        }
        return response;
      } catch (error) {
        pushDiagnosticsEntry({ kind: 'fetch.error', message: `${url} — ${safeDiagnosticString(error)}` });
        throw error;
      }
    };
  }
};