import { Progress } from '@/components/ui/progress';
import bubbleLinkLogo from '@/assets/bubblelink-logo.png';

interface BubbleHeaderMinimalProps {
  usedBubbles: number;
  maxBubbles: number;
}

export const BubbleHeaderMinimal = ({ 
  usedBubbles,
  maxBubbles,
}: BubbleHeaderMinimalProps) => {
  const usagePercent = maxBubbles === 999 ? 0 : (usedBubbles / maxBubbles) * 100;

  return (
    <header 
      className="relative z-20 p-4 md:p-6"
      role="banner"
      aria-label="BubbleLink navigation"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={bubbleLinkLogo} 
              alt="BubbleLink - Your Bookmarks. In a Bubble." 
              className="h-44 md:h-64 w-44 md:w-64 rounded-full object-cover drop-shadow-lg animate-logo-glow"
            />
          </div>
          
          {/* Compact Capacity Indicator */}
          <div 
            className="glass-card px-3 py-2 rounded-xl min-w-[140px]"
            role="status"
            aria-label={`Bubbles used: ${usedBubbles} of ${maxBubbles === 999 ? 'unlimited' : maxBubbles}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-foreground/80 text-xs font-body">Bubbles</span>
              <span className="text-foreground font-semibold text-sm font-body">
                {usedBubbles}/{maxBubbles === 999 ? '∞' : maxBubbles}
              </span>
            </div>
            <Progress 
              value={usagePercent} 
              className="h-1.5 bg-white/20"
            />
            {maxBubbles !== 999 && usedBubbles >= maxBubbles * 0.8 && (
              <p className="text-amber-400 text-xs mt-1 font-body text-right">
                {usedBubbles >= maxBubbles ? 'Full!' : 'Almost full'}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
