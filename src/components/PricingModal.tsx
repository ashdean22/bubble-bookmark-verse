import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Plan = 'lifetime' | 'annual';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
  isPro?: boolean;
}

const PRICING: Record<Plan, { amount: number; cadence: string; note: string }> = {
  lifetime: { amount: 29, cadence: 'once', note: 'Pay once. Yours forever.' },
  annual: { amount: 12, cadence: '/ year', note: 'Billed yearly. Cancel anytime.' },
};

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

export const PricingModal = ({ isOpen, onClose, onSelectPlan, isPro = false }: PricingModalProps) => {
  const [plan, setPlan] = useState<Plan>('lifetime');
  const price = PRICING[plan];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-background border-border">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center space-y-2 mb-6">
            <DialogTitle className="text-2xl font-heading">Float above the limits</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Keep your favorites free on this device, or go Pro to carry them everywhere.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg">Free</h3>
                <InfinityIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm"> forever</span>
              </div>
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
              <div aria-hidden className="pointer-events-none absolute top-8 right-6 w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/20 blur-md" />

              <div className="relative flex items-center justify-between">
                <h3 className="font-heading text-lg flex items-center gap-2">
                  Pro <Sparkles className="w-4 h-4 text-primary" />
                </h3>
                <Badge className="bg-primary/15 text-primary border-0">Best value</Badge>
              </div>

              <div className="relative mt-4 inline-flex rounded-full border border-border p-1 bg-background/60 w-full">
                {(['lifetime', 'annual'] as Plan[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={cn(
                      'flex-1 rounded-full px-3 py-1.5 text-sm capitalize transition-colors',
                      plan === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="relative mt-4 mb-1">
                <span className="text-3xl font-bold">${price.amount}</span>
                <span className="text-muted-foreground text-sm"> {price.cadence}</span>
              </div>
              <p className="relative text-xs text-muted-foreground mb-5">{price.note}</p>

              <ul className="relative space-y-3 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button className="relative mt-6 w-full" disabled={isPro} onClick={() => onSelectPlan(plan)}>
                {isPro ? 'You are Pro' : plan === 'lifetime' ? 'Get Pro, one time' : 'Get Pro, yearly'}
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Secure checkout by Paddle. No charge until you confirm.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
