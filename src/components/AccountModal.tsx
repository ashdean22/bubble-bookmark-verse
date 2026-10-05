import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Lock, Check, CloudUpload, CloudDownload, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { BOARD_THEMES } from '@/config/themes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isPaid: boolean;
  theme: string;
  onThemeChange: (id: string) => void;
  syncStatus: string;
  lastBackup: number;
  onBackup: () => void;
  onRestore: () => void;
  onUpgrade: () => void;
}

export const AccountModal = ({
  isOpen, onClose, user, isPaid, theme, onThemeChange, syncStatus, lastBackup, onBackup, onRestore, onUpgrade,
}: Props) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) { toast({ title: 'Could not sign in', description: error.message, variant: 'destructive' }); return; }
    if (mode === 'signup' && !data.session) {
      toast({ title: 'Check your email', description: 'Tap the link we sent to confirm your account.' });
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (res.error) toast({ title: 'Google sign-in failed', description: String(res.error.message ?? res.error), variant: 'destructive' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account & themes</DialogTitle>
          <DialogDescription>
            {user ? `Signed in as ${user.email}` : 'Sign in to sync and back up your bubbles with Pro.'}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <form onSubmit={submit} className="space-y-3">
            <Button type="button" variant="outline" className="w-full min-h-[44px]" onClick={google}>Continue with Google</Button>
            <Input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="min-h-[44px]" />
            <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="min-h-[44px]" />
            <Button type="submit" disabled={busy} className="w-full min-h-[44px]">{mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
            <button type="button" className="text-sm text-primary w-full" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">Plan: {isPaid ? 'Pro' : 'Free'}</p>
              {isPaid ? (
                <p className="text-muted-foreground">
                  Sync: {syncStatus}{lastBackup ? ` · last backup ${new Date(lastBackup).toLocaleString()}` : ''}
                </p>
              ) : (
                <p className="text-muted-foreground">Sync across devices and cloud backup are included with Pro.</p>
              )}
            </div>
            {isPaid ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="min-h-[44px]" onClick={onBackup}><CloudUpload className="w-4 h-4 mr-2" />Back up now</Button>
                <Button variant="outline" className="min-h-[44px]" onClick={onRestore}><CloudDownload className="w-4 h-4 mr-2" />Restore</Button>
              </div>
            ) : (
              <Button className="w-full min-h-[44px]" onClick={onUpgrade}>See Pro plans</Button>
            )}
            <Button variant="ghost" className="w-full min-h-[44px]" onClick={() => supabase.auth.signOut()}>
              <LogOut className="w-4 h-4 mr-2" />Sign out
            </Button>
          </div>
        )}

        <div className="pt-2">
          <p className="text-sm font-semibold mb-2">Themes</p>
          <div className="grid grid-cols-3 gap-2">
            {BOARD_THEMES.map(t => {
              const locked = t.premium && !isPaid;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => (locked ? onUpgrade() : onThemeChange(t.id))}
                  className={cn('rounded-lg border p-1 text-xs min-h-[64px] flex flex-col', active ? 'border-primary' : 'border-border')}
                  aria-label={`${t.name}${locked ? ' (Pro)' : ''}`}
                >
                  <span className="relative flex-1 rounded-md min-h-[36px]" style={{ background: t.swatch }}>
                    {locked && <Lock className="absolute top-1 right-1 w-3 h-3 text-foreground" />}
                    {active && <Check className="absolute top-1 right-1 w-3 h-3 text-foreground" />}
                  </span>
                  <span className="mt-1">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
