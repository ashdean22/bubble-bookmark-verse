import { useState } from 'react';
import { Plus, ShoppingCart, BarChart3, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onCreateBubble: () => void;
  onBuyBubbles: () => void;
  onShowAnalytics: () => void;
  onImportBookmarks: () => void;
  showAnalytics: boolean;
}

export const FloatingActionButton = ({
  onCreateBubble,
  onBuyBubbles,
  onShowAnalytics,
  onImportBookmarks,
  showAnalytics,
}: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  return (
    <div className="fixed top-2 right-4 sm:top-2 sm:right-6 z-50 flex flex-col items-end gap-2 sm:gap-3">
      {/* Secondary actions - shown when expanded */}
      <div
        className={cn(
          'flex flex-col items-end gap-3 transition-all duration-300',
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        )}
      >
        {/* Import Bookmarks */}
        <div className="flex items-center gap-2">
          <span className="glass-card px-3 py-1.5 rounded-lg text-sm text-foreground font-body whitespace-nowrap">
            Import
          </span>
          <Button
            onClick={() => handleAction(onImportBookmarks)}
            size="icon"
            className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/80 transition-all hover:scale-110"
            aria-label="Import bookmarks"
          >
            <Upload className="h-5 w-5" />
          </Button>
        </div>

        {/* Analytics */}
        <div className="flex items-center gap-2">
          <span className="glass-card px-3 py-1.5 rounded-lg text-sm text-foreground font-body whitespace-nowrap">
            Analytics
          </span>
          <Button
            onClick={() => handleAction(onShowAnalytics)}
            size="icon"
            className={cn(
              'h-12 w-12 rounded-full shadow-lg transition-all hover:scale-110',
              showAnalytics
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
            aria-label="Toggle analytics"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
        </div>

        {/* Buy Bubbles */}
        <div className="flex items-center gap-2">
          <span className="glass-card px-3 py-1.5 rounded-lg text-sm text-foreground font-body whitespace-nowrap">
            Buy Bubbles
          </span>
          <Button
            onClick={() => handleAction(onBuyBubbles)}
            size="icon"
            className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/80 transition-all hover:scale-110"
            aria-label="Buy more bubbles"
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>

        {/* Create Bubble */}
        <div className="flex items-center gap-2">
          <span className="glass-card px-3 py-1.5 rounded-lg text-sm text-foreground font-body whitespace-nowrap">
            Create Bubble
          </span>
          <Button
            onClick={() => handleAction(onCreateBubble)}
            size="icon"
            className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/80 transition-all hover:scale-110"
            aria-label="Create new bubble"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Primary FAB button */}
      <Button
        onClick={handleToggle}
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-110',
          'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
          isExpanded && 'rotate-45'
        )}
        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
};
