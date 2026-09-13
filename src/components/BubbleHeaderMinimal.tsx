import { Progress } from '@/components/ui/progress';

interface BubbleHeaderMinimalProps {
  usedBubbles: number;
  maxBubbles: number;
}

export const BubbleHeaderMinimal = ({ 
  usedBubbles,
  maxBubbles,
}: BubbleHeaderMinimalProps) => {
  const isUnlimited = !Number.isFinite(maxBubbles) || maxBubbles === 999;
  const usagePercent = isUnlimited ? 0 : (usedBubbles / maxBubbles) * 100;

  return (
    <header 
      className="relative z-20 px-4 py-4 md:px-7 md:py-6"
      role="banner"
      aria-label="BubbleMark navigation"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-start justify-between">
          <div className="bm-brand-lockup">
            <span className="bm-brand-mark" aria-hidden="true">
              <span />
            </span>
            <div>
              <p className="bm-brand-name">Bubble<span>Mark</span></p>
              <p className="bm-brand-tagline">Your bookmarks, in a bubble.</p>
            </div>
          </div>
          
          {/* Compact Capacity Indicator */}
          <div 
            className="bm-capacity min-w-[140px] px-3 py-2"
            role="status"
            aria-label={`Bubbles used: ${usedBubbles} of ${isUnlimited ? 'unlimited' : maxBubbles}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-body">Bubbles</span>
              <span className="font-semibold text-sm font-body">
                {usedBubbles}/{isUnlimited ? '∞' : maxBubbles}
              </span>
            </div>
            <Progress 
              value={usagePercent} 
              className="h-1.5 bg-white/20"
            />
            {!isUnlimited && usedBubbles >= maxBubbles * 0.8 && (
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
