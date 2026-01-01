import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Circle, BarChart3, ShoppingCart, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bubbleLinkLogo from '@/assets/bubblelink-logo.png';

interface BubbleHeaderProps {
  availableBubbles: number;
  onCreateBubble: () => void;
  onBuyBubbles: () => void;
  onShowAnalytics: () => void;
  showAnalytics: boolean;
}

export const BubbleHeader = ({ 
  availableBubbles, 
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
            <img 
              src={bubbleLinkLogo} 
              alt="BubbleLink - Your Bookmarks. In a Bubble." 
              className="h-20 md:h-24 w-20 md:w-24 rounded-full object-cover drop-shadow-lg"
            />
          </div>
          
          <div 
            className="glass-card px-3 py-1.5 md:px-4 md:py-2 rounded-full"
            role="status"
            aria-label={`Available bubbles: ${availableBubbles}`}
          >
            <span className="text-foreground font-semibold flex items-center text-sm md:text-base font-body">
              <Circle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-white fill-current" aria-hidden="true" />
              {availableBubbles <= 3 ? `${3 - availableBubbles}/3 free bubbles used` : `${availableBubbles} bubbles`}
            </span>
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