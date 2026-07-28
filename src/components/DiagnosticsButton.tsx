import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bug, RefreshCw, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DIAGNOSTICS_REOPEN_KEY, readDiagnosticsLog, writeDiagnosticsLog, type DiagEntry } from '@/utils/diagnosticsCapture';

export const DiagnosticsButton = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DiagEntry[]>([]);

  useEffect(() => {
    const sync = () => setEntries(readDiagnosticsLog());
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
    writeDiagnosticsLog([]);
    setEntries([]);
    toast('Diagnostics cleared');
  };

  const reloadAndShare = async () => {
    try { await navigator.clipboard.writeText(formatted()); } catch { /* ignore */ }
    // Mark so we re-open the dialog after reload.
    try { sessionStorage.setItem(DIAGNOSTICS_REOPEN_KEY, '1'); } catch { /* ignore */ }
    location.reload();
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DIAGNOSTICS_REOPEN_KEY) === '1') {
        sessionStorage.removeItem(DIAGNOSTICS_REOPEN_KEY);
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