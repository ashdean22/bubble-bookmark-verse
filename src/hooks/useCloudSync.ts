import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Bookmark } from '@/pages/Index';
import { validateStoredBookmarks } from '@/utils/security';

type Status = 'off' | 'syncing' | 'synced' | 'error';
const SYNC_KEY = 'bubbleSyncAt';

const host = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};
const merge = (local: Bookmark[], remote: Bookmark[]) => {
  const seen = new Set(local.map(b => host(b.url)));
  return [...local, ...remote.filter(b => !seen.has(host(b.url)))];
};
const readSyncAt = () => { try { return Number(localStorage.getItem(SYNC_KEY)) || 0; } catch { return 0; } };
const writeSyncAt = (t: number) => { try { localStorage.setItem(SYNC_KEY, String(t)); } catch { /* ignore */ } };

/** Pro-only: keeps bubbles and theme backed up online and in step across devices. */
export const useCloudSync = (
  user: User | null,
  isPaid: boolean,
  bookmarks: Bookmark[],
  setBookmarks: (b: Bookmark[]) => void,
  theme: string,
  setTheme: (t: string) => void,
) => {
  const enabled = !!user && isPaid;
  const [status, setStatus] = useState<Status>('off');
  const [lastBackup, setLastBackup] = useState<number>(readSyncAt);
  const dirty = useRef(false);
  const ready = useRef(false);
  const latest = useRef({ bookmarks, theme });
  latest.current = { bookmarks, theme };

  const push = useCallback(async () => {
    if (!user) return;
    setStatus('syncing');
    const now = new Date();
    const { error } = await supabase.from('bubble_backups').upsert({
      user_id: user.id,
      bookmarks: latest.current.bookmarks as unknown as never,
      theme: latest.current.theme,
      updated_at: now.toISOString(),
    });
    if (error) { setStatus('error'); return; }
    dirty.current = false;
    writeSyncAt(now.getTime());
    setLastBackup(now.getTime());
    setStatus('synced');
  }, [user]);

  const pull = useCallback(async (mode: 'auto' | 'restore') => {
    if (!user) return;
    setStatus('syncing');
    const { data, error } = await supabase.from('bubble_backups').select('*').eq('user_id', user.id).maybeSingle();
    if (error) { setStatus('error'); return; }
    if (!data) { ready.current = true; await push(); return; }
    const remote = validateStoredBookmarks(data.bookmarks as unknown[]) as Bookmark[];
    const remoteAt = new Date(data.updated_at).getTime();
    const syncAt = readSyncAt();
    if (mode === 'restore' || (remoteAt > syncAt && !dirty.current && syncAt > 0)) {
      setBookmarks(remote);
      setTheme(data.theme);
      writeSyncAt(remoteAt);
      setLastBackup(remoteAt);
      ready.current = true;
      setStatus('synced');
      return;
    }
    if (syncAt === 0 || dirty.current) {
      setBookmarks(merge(latest.current.bookmarks, remote));
      ready.current = true;
      dirty.current = true;
      setTimeout(push, 0);
      return;
    }
    ready.current = true;
    setStatus('synced');
  }, [user, push, setBookmarks, setTheme]);

  // Initial pull + refresh when returning to the app.
  useEffect(() => {
    if (!enabled) { setStatus('off'); ready.current = false; return; }
    pull('auto');
    const onFocus = () => { if (document.visibilityState === 'visible') pull('auto'); };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [enabled, pull]);

  // Debounced backup after local changes.
  useEffect(() => {
    if (!enabled || !ready.current) return;
    dirty.current = true;
    const id = window.setTimeout(push, 1500);
    return () => window.clearTimeout(id);
  }, [bookmarks, theme, enabled, push]);

  return { status, lastBackup, backupNow: push, restore: () => pull('restore') };
};
