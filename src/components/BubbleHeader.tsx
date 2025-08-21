import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Circle, BarChart3, ShoppingCart, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
            {/* Enhanced bubble logo with multiple circles */}
            <div className="relative" role="img" aria-label="BubbleLink logo">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Circle className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-80" aria-hidden="true"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 opacity-60" aria-hidden="true"></div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-brand font-bold text-white tracking-tight">
                Bubble<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Link</span>
              </h1>
              <p className="text-purple-300 text-xs md:text-sm font-body">Your bookmarks floating in bubble space 🫧</p>
            </div>
          </div>
          
          <div 
            className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-white/20 shadow-lg"
            role="status"
            aria-label={`Available bubbles: ${availableBubbles}`}
          >
            <span className="text-white font-semibold flex items-center text-sm md:text-base font-body">
              <Circle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-purple-400 fill-current" aria-hidden="true" />
              {availableBubbles <= 5 ? `${availableBubbles} free bubbles` : `${availableBubbles} bubbles`}
            </span>
          </div>
        </div>
        
        {/* Action buttons row with bubble-themed text */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={onCreateBubble}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 flex-1 sm:flex-none font-body font-medium shadow-lg hover:shadow-xl transition-all"
            aria-label="Create new bubble (Ctrl+N)"
            title="Create new bubble (Ctrl+N)"
          >
            <Plus className="w-3 h-3 mr-1.5" aria-hidden="true" />
            Create Bubble
          </Button>
          
          <Button
            onClick={onBuyBubbles}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 flex-1 sm:flex-none font-brand font-semibold shadow-lg hover:shadow-xl transition-all"
            aria-label="Buy more bubbles (Ctrl+B)"
            title="Buy more bubbles (Ctrl+B)"
          >
            <ShoppingCart className="w-3 h-3 mr-1.5" aria-hidden="true" />
            Buy More Bubbles
          </Button>
          
          <Button
            onClick={onShowAnalytics}
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 flex-1 sm:flex-none font-body font-medium shadow-lg hover:shadow-xl transition-all"
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
            className="border-white/20 text-white hover:bg-white/10 hidden sm:flex"
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