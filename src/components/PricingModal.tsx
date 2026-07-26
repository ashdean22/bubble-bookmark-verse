import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Sparkles, Crown, Infinity as InfinityIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlanInterest = 'pro_monthly' | 'pro_yearly' | 'lifetime';

const freeFeatures = [
  'Unlimited bubbles on this device',
  'Floating bubble canvas',
  'Automatic favicons',
  'Stored locally, no account needed',
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
  const [billing, setBilling] = useState<'yearly' | 'monthly'>('yearly');
  const [selected, setSelected] = useState<PlanInterest | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState<PlanInterest | null>(null);

  const joinWaitlist = async () => {
    if (!selected) return;
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('waitlist').insert({ email: clean, plan_interest: selected });
    setSubmitting(false);
    if (error && error.code !== '23505') {
      toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' });
      return;
    }
    setJoined(selected);
    toast({ title: 'You are on the list', description: 'We will email you the moment it launches.' });
  };

  const WaitlistForm = ({ plan }: { plan: PlanInterest }) => {
    if (joined === plan) {
      return <p className="relative mt-6 text-sm text-center text-primary">You are on the list.</p>;
    }
    if (selected === plan) {
      return (
        <div className="relative mt-6 space-y-2">
          <Input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button className="w-full min-h-[44px]" disabled={submitting} onClick={joinWaitlist}>
            Join the waitlist
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-background border-border">
        <div className="p-5 sm:p-8">
          <DialogHeader className="text-center space-y-2 mb-6">
            <DialogTitle className="text-2xl font-heading">Simple pricing for BubbleMark</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Free forever on this device. Go Pro to sync your bubbles everywhere.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            {/* FREE */}
            <div className="rounded-2xl border border-border bg-card/40 p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg">Free</h3>
                <InfinityIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="mt-4 mb-1"><span className="text-3xl font-bold">$0</span></div>
              <p className="text-sm text-muted-foreground mb-5">Unlimited bubbles, one device.</p>
              <ul className="space-y-3 flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-6 w-full min-h-[44px]" disabled>
                Your current plan
              </Button>
            </div>

            {/* PRO — recommended */}
            <div className="relative rounded-2xl border-2 border-primary/60 bg-card p-6 flex flex-col overflow-hidden shadow-[0_0_40px_-12px_hsl(var(--primary))]">
              <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 blur-2xl motion-safe:animate-pulse" />

              <div className="relative flex items-center justify-between">
                <h3 className="font-heading text-lg flex items-center gap-2">
                  Pro <Sparkles className="w-4 h-4 text-primary" />
                </h3>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">Recommended</Badge>
              </div>

              <div className="relative mt-4 mb-1 flex items-end gap-1">
                <span className="text-3xl font-bold">{billing === 'yearly' ? '$14.99' : '$1.99'}</span>
                <span className="text-sm text-muted-foreground mb-1">/{billing === 'yearly' ? 'year' : 'month'}</span>
              </div>
              <p className="relative text-sm text-muted-foreground mb-4">Cancel anytime.</p>

              <div className="relative grid grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => { setBilling('yearly'); setSelected(null); }}
                  className={`rounded-xl border px-3 py-2 text-xs min-h-[44px] transition-colors ${billing === 'yearly' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}
                >
                  Yearly · $14.99
                  <span className="block text-[10px] text-primary font-semibold">Save 37%</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setBilling('monthly'); setSelected(null); }}
                  className={`rounded-xl border px-3 py-2 text-xs min-h-[44px] transition-colors ${billing === 'monthly' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}
                >
                  Monthly · $1.99
                  <span className="block text-[10px] text-muted-foreground">billed monthly</span>
                </button>
              </div>

              <ul className="relative space-y-3 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {(() => {
                const plan: PlanInterest = billing === 'yearly' ? 'pro_yearly' : 'pro_monthly';
                return joined === plan || selected === plan ? (
                  <WaitlistForm plan={plan} />
                ) : (
                  <Button
                    className="relative mt-6 w-full min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    onClick={() => setSelected(plan)}
                  >
                    Notify me when Pro launches
                  </Button>
                );
              })()}
            </div>

            {/* LIFETIME */}
            <div className="rounded-2xl border border-amber-500/40 bg-card/40 p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg flex items-center gap-2">
                  Lifetime <Crown className="w-4 h-4 text-amber-400" />
                </h3>
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">Founding Member</Badge>
              </div>
              <div className="mt-4 mb-1 flex items-end gap-1">
                <span className="text-3xl font-bold">$24.99</span>
                <span className="text-sm text-muted-foreground mb-1">once</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Launch price — increases after launch.
              </p>
              <ul className="space-y-3 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                  <span>One payment, yours forever</span>
                </li>
              </ul>

              {joined === 'lifetime' || selected === 'lifetime' ? (
                <WaitlistForm plan="lifetime" />
              ) : (
                <Button variant="outline" className="mt-6 w-full min-h-[44px] border-amber-500/40 hover:bg-amber-500/10" onClick={() => setSelected('lifetime')}>
                  Claim founding price
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
