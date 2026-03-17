import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Circle, BarChart3, ShoppingCart, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bubbleLinkLogo from '@/assets/bubblelink-logo.png';

interface BubbleHeaderProps {
  availableBubbles: number;
  usedBubbles: number;
  maxBubbles: number;
  onCreateBubble: () => void;
  onBuyBubbles: () => void;
  onShowAnalytics: () => void;
  showAnalytics: boolean;
}

export const BubbleHeader = ({ 
  availableBubbles, 
  usedBubbles,
  maxBubbles,
  onCreateBubble, 
  onBuyBubbles, 
  onShowAnalytics,
  showAnalytics 
}: BubbleHeaderProps) => {
  const { toast } = useToast();

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          onCreateBubble();
          break;
        case 'b':
          e.preventDefault();
          onBuyBubbles();
          break;
        case 'a':
          e.preventDefault();
          onShowAnalytics();
          break;
      }
    }
    
    if (e.key === '?') {
      e.preventDefault();
      toast({
        title: "Keyboard Shortcuts 🚀",
        description: "Ctrl/Cmd + N: Create bubble | Ctrl/Cmd + B: Buy bubbles | Ctrl/Cmd + A: Analytics",
      });
    }
  };

  // Add keyboard shortcut listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  return (
    <header 
      className="relative z-20 p-4 md:p-6"
      role="banner"
      aria-label="BubbleLink navigation"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top row with enhanced logo and bubble count */}
        <div className="flex items-center justify-between mb-4 md:mb-0">
          <div className="flex items-center space-x-3">
            <div className="h-36 md:h-44 w-36 md:w-44 shrink-0">
              <img 
                src={bubbleLinkLogo} 
                alt="BubbleMark - Your Bookmarks. In a Bubble." 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          </div>
          
          {/* Capacity Indicator */}
          <div 
            className="glass-card px-3 py-2 md:px-4 md:py-3 rounded-xl min-w-[160px] md:min-w-[200px]"
            role="status"
            aria-label={`Bubbles used: ${usedBubbles} of ${maxBubbles === 999 ? 'unlimited' : maxBubbles}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-foreground/80 text-xs font-body">Bubble Capacity</span>
              <span className="text-foreground font-semibold text-sm font-body">
                {usedBubbles}/{maxBubbles === 999 ? '∞' : maxBubbles}
              </span>
            </div>
            <Progress 
              value={maxBubbles === 999 ? 0 : (usedBubbles / maxBubbles) * 100} 
              className="h-2 bg-white/20"
            />
            {maxBubbles !== 999 && usedBubbles >= maxBubbles * 0.8 && (
              <p className="text-amber-400 text-xs mt-1 font-body">
                {usedBubbles >= maxBubbles ? 'Limit reached!' : 'Almost full!'}
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons row with bubble-themed text */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={onCreateBubble}
            size="sm"
            className="btn-bubble flex-1 sm:flex-none font-body font-medium shadow-lg hover:shadow-xl transition-all"
            aria-label="Create new bubble (Ctrl+N)"
            title="Create new bubble (Ctrl+N)"
          >
            <Plus className="w-3 h-3 mr-1.5" aria-hidden="true" />
            Create Bubble
          </Button>
          
          <Button
            onClick={onBuyBubbles}
            size="sm"
            className="btn-bubble flex-1 sm:flex-none font-brand font-semibold shadow-lg hover:shadow-xl transition-all"
            aria-label="Buy more bubbles (Ctrl+B)"
            title="Buy more bubbles (Ctrl+B)"
          >
            <ShoppingCart className="w-3 h-3 mr-1.5" aria-hidden="true" />
            Buy More Bubbles
          </Button>
          
          <Button
            onClick={onShowAnalytics}
            size="sm"
            className="btn-bubble flex-1 sm:flex-none font-body font-medium shadow-lg hover:shadow-xl transition-all"
            aria-label={`${showAnalytics ? 'Hide' : 'Show'} analytics (Ctrl+A)`}
            title={`${showAnalytics ? 'Hide' : 'Show'} analytics (Ctrl+A)`}
            aria-pressed={showAnalytics}
          >
            <BarChart3 className="w-3 h-3 mr-1.5" aria-hidden="true" />
            Analytics
          </Button>
          
          <Button
            onClick={() => toast({
              title: "Keyboard Shortcuts 🚀",
              description: "Ctrl/Cmd + N: Create bubble | Ctrl/Cmd + B: Buy bubbles | Ctrl/Cmd + A: Analytics | ?: Help",
            })}
            size="sm"
            variant="outline"
            className="border-white/30 text-foreground hover:bg-white/10 hidden sm:flex"
            aria-label="Show keyboard shortcuts"
            title="Show keyboard shortcuts (?)"
          >
            <HelpCircle className="w-3 h-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
};