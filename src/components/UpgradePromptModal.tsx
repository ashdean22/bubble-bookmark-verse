import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const proBenefits = [
  'Sync across all your devices',
  'Automatic cloud backup',
  'Premium themes and colors',
  'Heat insights on your bubbles',
];

export const UpgradePromptModal = ({ isOpen, onClose, onUpgrade }: UpgradePromptModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md bg-slate-900 border-purple-500/30 font-body p-4 sm:p-6">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-white text-xl font-brand font-bold">
            Take your bubbles everywhere 🫧
          </DialogTitle>
          <DialogDescription className="text-purple-300">
            Your bubbles live on this device only. Pro keeps them synced and backed up.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20 text-center">
          <p className="text-white font-semibold">
            $1.99<span className="text-purple-300 text-sm font-normal">/month</span>
            <span className="text-purple-400 mx-2">·</span>
            $14.99<span className="text-purple-300 text-sm font-normal">/year</span>
          </p>
          <p className="text-amber-400 text-xs mt-1">Save 37% with yearly billing</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-white font-semibold flex items-center gap-2 font-brand">
            <ArrowRight className="w-4 h-4 text-purple-400" />
            Upgrade to Pro
          </h3>
          <ul className="space-y-2">
            {proBenefits.map((benefit) => (
              <li key={benefit} className="text-purple-300 text-sm flex items-center">
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
            See Pro plans
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