import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bug, RefreshCw, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type DiagEntry = {
  t: number;
  kind: 'console.error' | 'console.warn' | 'window.error' | 'unhandledrejection' | 'fetch.error' | 'fetch.status';
  message: string;
  detail?: string;
};

const STORAGE_KEY = 'bm_diagnostics_log_v1';
const MAX_ENTRIES = 100;

const safeStringify = (v: unknown): string => {
  if (v instanceof Error) return `${v.name}: ${v.message}${v.stack ? `\n${v.stack}` : ''}`;
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
};

const readLog = (): DiagEntry[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiagEntry[]) : [];
  } catch { return []; }
};

const writeLog = (entries: DiagEntry[]) => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES))); } catch { /* ignore */ }
};

const push = (entry: Omit<DiagEntry, 't'>) => {
  const next = [...readLog(), { ...entry, t: Date.now() }];
  writeLog(next);
  window.dispatchEvent(new CustomEvent('bm-diag-updated'));
};

let installed = false;
const installCapture = () => {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...args: unknown[]) => {
    push({ kind: 'console.error', message: args.map(safeStringify).join(' ') });
    origError(...args);
  };
  console.warn = (...args: unknown[]) => {
    push({ kind: 'console.warn', message: args.map(safeStringify).join(' ') });
    origWarn(...args);
  };

  window.addEventListener('error', (e) => {
    push({
      kind: 'window.error',
      message: e.message || 'Uncaught error',
      detail: `${e.filename || ''}:${e.lineno || 0}:${e.colno || 0}${e.error?.stack ? `\n${e.error.stack}` : ''}`,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    push({ kind: 'unhandledrejection', message: safeStringify(e.reason) });
  });

  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    try {
      const res = await origFetch(input, init);
      if (!res.ok) push({ kind: 'fetch.status', message: `${res.status} ${res.statusText} — ${url}` });
      return res;
    } catch (err) {
      push({ kind: 'fetch.error', message: `${url} — ${safeStringify(err)}` });
      throw err;
    }
  };
};

export const DiagnosticsButton = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DiagEntry[]>([]);

  useEffect(() => {
    installCapture();
    const sync = () => setEntries(readLog());
    sync();
    window.addEventListener('bm-diag-updated', sync);
    return () => window.removeEventListener('bm-diag-updated', sync);
  }, []);

  const formatted = useCallback(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const url = typeof location !== 'undefined' ? location.href : 'unknown';
    const header = `BubbleMark diagnostics\nWhen: ${new Date().toISOString()}\nURL: ${url}\nUA: ${ua}\nEntries: ${entries.length}\n`;
    const body = entries.map((e) => {
      const ts = new Date(e.t).toISOString();
      return `[${ts}] [${e.kind}] ${e.message}${e.detail ? `\n  ${e.detail}` : ''}`;
    }).join('\n');
    return `${header}\n${body || '(no entries captured)'}`;
  }, [entries]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatted());
      toast.success('Diagnostics copied to clipboard');
    } catch {
      toast.error('Could not copy. Select and copy manually.');
    }
  };

  const clear = () => {
    writeLog([]);
    setEntries([]);
    toast('Diagnostics cleared');
  };

  const reloadAndShare = async () => {
    try { await navigator.clipboard.writeText(formatted()); } catch { /* ignore */ }
    // Mark so we re-open the dialog after reload.
    try { sessionStorage.setItem('bm_diag_reopen', '1'); } catch { /* ignore */ }
    location.reload();
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem('bm_diag_reopen') === '1') {
        sessionStorage.removeItem('bm_diag_reopen');
        setOpen(true);
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-[60] flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground hover:border-border transition"
        aria-label="Open diagnostics"
      >
        <Bug className="w-3.5 h-3.5" />
        Diagnostics
        {entries.length > 0 && (
          <span className="ml-1 rounded-full bg-destructive/20 text-destructive px-1.5 py-0.5 text-[10px] font-medium">
            {entries.length}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bug className="w-4 h-4" /> Diagnostics</DialogTitle>
            <DialogDescription>
              Captured console errors, unhandled rejections, and failed network requests from this session.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
            {entries.length === 0 ? (
              <span className="text-muted-foreground">No issues captured. 🎉</span>
            ) : (
              entries.map((e, i) => (
                <div key={i} className="mb-2">
                  <span className="text-muted-foreground">[{new Date(e.t).toLocaleTimeString()}] </span>
                  <span className="text-primary">{e.kind}</span>{' '}
                  <span>{e.message}</span>
                  {e.detail && <div className="text-muted-foreground pl-4">{e.detail}</div>}
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="w-4 h-4 mr-1" /> Copy
            </Button>
            <Button size="sm" onClick={reloadAndShare}>
              <RefreshCw className="w-4 h-4 mr-1" /> Reload &amp; share diagnostics
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DiagnosticsButton;