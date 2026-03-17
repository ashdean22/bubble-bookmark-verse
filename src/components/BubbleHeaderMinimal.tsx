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
      className="relative z-20 p-2 md:p-3"
      role="banner"
      aria-label="BubbleLink navigation"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          {/* Logo with decorative bubbles */}
          <div className="flex items-center relative -mt-6 -ml-6 md:-mt-8 md:-ml-8">
            <div className="h-56 md:h-80 w-56 md:w-80 shrink-0">
              <img 
                src={bubbleLinkLogo} 
                alt="BubbleMark - Your Bookmarks. In a Bubble." 
                className="w-full h-full object-contain"
              />
            </div>
            {/* Decorative bubble 1 — larger, top-right */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 28,
                height: 28,
                top: '2%',
                right: '-10px',
                borderRadius: '50%',
                background: `radial-gradient(ellipse 60% 40% at 30% 25%, hsla(200, 80%, 90%, 0.85), transparent 50%),
                             radial-gradient(ellipse 80% 80% at 50% 50%, hsla(210, 70%, 65%, 0.55), transparent 90%)`,
                border: '1.5px solid hsla(210, 80%, 80%, 0.45)',
                boxShadow: `0 4px 16px hsla(210, 60%, 40%, 0.2), 0 0 10px hsla(210, 80%, 70%, 0.3), inset 0 -4px 10px hsla(210, 60%, 30%, 0.2), inset 0 3px 6px hsla(0, 0%, 100%, 0.2)`,
                backdropFilter: 'blur(2px)',
                animation: 'float-bubble-1 4s ease-in-out infinite',
              }}
            />
            {/* Decorative bubble 2 — smaller, slightly below and to the right */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 16,
                height: 16,
                top: '20%',
                right: '-22px',
                borderRadius: '50%',
                background: `radial-gradient(ellipse 60% 40% at 30% 25%, hsla(190, 80%, 90%, 0.9), transparent 50%),
                             radial-gradient(ellipse 80% 80% at 50% 50%, hsla(200, 65%, 60%, 0.5), transparent 90%)`,
                border: '1px solid hsla(200, 80%, 80%, 0.4)',
                boxShadow: `0 2px 8px hsla(200, 60%, 40%, 0.2), 0 0 6px hsla(200, 80%, 70%, 0.3), inset 0 -2px 6px hsla(200, 60%, 30%, 0.15), inset 0 2px 4px hsla(0, 0%, 100%, 0.2)`,
                backdropFilter: 'blur(2px)',
                animation: 'float-bubble-2 3.2s ease-in-out infinite',
              }}
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
