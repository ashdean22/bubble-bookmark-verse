import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const freeFeatures = [
  'Unlimited favorites',
  'Floating bubble canvas',
  'Automatic favicons',
  'Saved on this device',
];

const proFeatures = [
  'Everything in Free',
  'Sync across all your devices',
  'Automatic cloud backup',
  'Premium themes and colors',
  'Heat insights on your bubbles',
];

export const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
  const { toast } = useToast();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const joinWaitlist = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('waitlist').insert({ email: clean, plan_interest: 'lifetime' });
    setSubmitting(false);
    if (error && error.code !== '23505') {
      toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' });
      return;
    }
    setJoined(true);
    toast({ title: 'You are on the list', description: 'We will email you when Pro launches.' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-background border-border">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center space-y-2 mb-6">
            <DialogTitle className="text-2xl font-heading">Take your favorites everywhere</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              BubbleMark is free on this device. Pro will sync your bubbles across all of them.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg">Free</h3>
                <InfinityIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="mt-4 mb-1">
                <span className="text-3xl font-bold">$0</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Free for one device.</p>
              <ul className="space-y-3 flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-6 w-full" disabled>
                Your current plan
              </Button>
            </div>

            <div className="relative rounded-2xl border border-primary/40 bg-card p-6 flex flex-col overflow-hidden">
              <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/20 blur-2xl motion-safe:animate-pulse" />

              <div className="relative flex items-center justify-between">
                <h3 className="font-heading text-lg flex items-center gap-2">
                  Pro <Sparkles className="w-4 h-4 text-primary" />
                </h3>
                <Badge className="bg-primary/15 text-primary border-0">Coming soon</Badge>
              </div>

              <div className="relative mt-4 mb-1">
                <span className="text-3xl font-bold">$29</span>
              </div>
              <p className="relative text-sm text-muted-foreground mb-5">One payment. Yours for life.</p>

              <ul className="relative space-y-3 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {joined ? (
                <p className="relative mt-6 text-sm text-center text-primary">You are on the list.</p>
              ) : showEmail ? (
                <div className="relative mt-6 space-y-2">
                  <Input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button className="w-full" disabled={submitting} onClick={joinWaitlist}>
                    Join the waitlist
                  </Button>
                </div>
              ) : (
                <Button className="relative mt-6 w-full" onClick={() => setShowEmail(true)}>
                  Notify me when Pro launches
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
