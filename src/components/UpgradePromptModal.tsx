import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentTier: string;
  usedBubbles: number;
  maxBubbles: number;
}

const tierBenefits: Record<string, { nextTier: string; benefits: string[]; price: string }> = {
  free: {
    nextTier: 'Bubble Basic',
    benefits: ['50 floating bubbles', 'Enhanced animations', 'Cloud sync', 'Priority loading', 'Email support'],
    price: '$1.99/mo'
  },
  basic: {
    nextTier: 'Bubble Pro',
    benefits: ['75 floating bubbles', 'Heat visualization (hot/cold)', '6 Premium theme packs', 'Custom color schemes', 'Priority support'],
    price: '$4.99/mo'
  },
  popular: {
    nextTier: 'Bubble Premium',
    benefits: ['Unlimited bubbles', 'Heat visualization (hot/cold)', 'Unlimited custom themes', 'Advanced theme designer', 'API access'],
    price: '$7.99/mo'
  }
};

export const UpgradePromptModal = ({
  isOpen,
  onClose,
  onUpgrade,
  currentTier,
  usedBubbles,
  maxBubbles
}: UpgradePromptModalProps) => {
  const tierInfo = tierBenefits[currentTier] || tierBenefits.free;
  const usagePercent = (usedBubbles / maxBubbles) * 100;
  const isAtLimit = usedBubbles >= maxBubbles;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md bg-slate-900 border-purple-500/30 font-body p-4 sm:p-6">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-white text-xl font-brand font-bold">
            {isAtLimit ? "You've reached your limit! 🫧" : "Almost at capacity! 🫧"}
          </DialogTitle>
          <DialogDescription className="text-purple-300">
            {isAtLimit 
              ? "Upgrade now to keep creating bubbles" 
              : "You're running low on bubble space"}
          </DialogDescription>
        </DialogHeader>

        {/* Usage indicator */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-purple-300">Current usage</span>
            <span className="text-white font-semibold">{usedBubbles}/{maxBubbles} bubbles</span>
          </div>
          <Progress 
            value={usagePercent} 
            className={`h-3 ${usagePercent >= 100 ? 'bg-red-500/30' : 'bg-white/20'}`}
          />
          <p className="text-amber-400 text-xs mt-2 text-center">
            {isAtLimit ? "No bubbles remaining" : `Only ${maxBubbles - usedBubbles} bubbles left`}
          </p>
        </div>

        {/* Next tier benefits */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold flex items-center gap-2 font-brand">
            <ArrowRight className="w-4 h-4 text-purple-400" />
            Upgrade to {tierInfo.nextTier}
          </h3>
          <ul className="space-y-2">
            {tierInfo.benefits.map((benefit, index) => (
              <li key={index} className="text-purple-300 text-sm flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg min-h-[48px]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade for {tierInfo.price}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-purple-300 hover:text-white hover:bg-white/10 min-h-[44px]"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};