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

const fabItems = [
  { key: 'import',    label: 'Import',        Icon: Upload,       action: 'onImportBookmarks' },
  { key: 'analytics', label: 'Analytics',     Icon: BarChart3,    action: 'onShowAnalytics'   },
  { key: 'buy',       label: 'Buy Bubbles',   Icon: ShoppingCart, action: 'onBuyBubbles'      },
  { key: 'create',    label: 'Create Bubble', Icon: Plus,         action: 'onCreateBubble'    },
] as const;

export const FloatingActionButton = ({
  onCreateBubble,
  onBuyBubbles,
  onShowAnalytics,
  onImportBookmarks,
  showAnalytics,
}: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  const actionMap = { onCreateBubble, onBuyBubbles, onShowAnalytics, onImportBookmarks };

  return (
    <div className="fixed top-0 right-4 sm:right-6 z-50 flex flex-col items-end gap-2 sm:gap-3">

      {/* ── Secondary actions ── */}
      <div
        className={cn(
          'flex flex-col items-end gap-3 transition-all duration-400',
          isExpanded
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-3 pointer-events-none'
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {fabItems.map(({ key, label, Icon, action }, idx) => {
          const isActive = key === 'analytics' && showAnalytics;
          return (
            <div
              key={key}
              className="flex items-center gap-2"
              style={{
                transitionDelay: isExpanded ? `${idx * 45}ms` : '0ms',
              }}
            >
              {/* Label chip */}
              <span
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium font-body whitespace-nowrap',
                  'backdrop-blur-md border transition-colors duration-200',
                  isActive
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-background/40 border-border/50 text-foreground/80'
                )}
              >
                {label}
              </span>

              {/* Action button */}
              <button
                onClick={() => handleAction(actionMap[action])}
                aria-label={label}
                className={cn(
                  'relative h-11 w-11 rounded-full flex items-center justify-center',
                  'transition-all duration-200 hover:scale-110 active:scale-95',
                  'border shadow-lg focus-visible:outline-none',
                  isActive
                    ? [
                        'border-primary/60',
                        'bg-primary text-primary-foreground',
                        'shadow-[0_0_18px_hsl(var(--primary)/0.5)]',
                      ]
                    : [
                        'border-primary/25',
                        'bg-background/50 text-foreground backdrop-blur-md',
                        'hover:bg-primary/15 hover:border-primary/50',
                        'hover:shadow-[0_0_14px_hsl(var(--primary)/0.35)]',
                      ]
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Primary FAB ── */}
      <div className="relative">
        {/* Animated glow ring when expanded */}
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-opacity duration-500',
            isExpanded ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)/0.35) 0%, transparent 70%)',
            transform: 'scale(2)',
            animation: isExpanded ? 'pulse-ring 2s ease-in-out infinite' : 'none',
          }}
        />

        <button
          onClick={() => setIsExpanded(v => !v)}
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          aria-expanded={isExpanded}
          className={cn(
            'relative h-14 w-14 rounded-full flex items-center justify-center',
            'transition-all duration-300 hover:scale-110 active:scale-95',
            'shadow-xl focus-visible:outline-none',
            'border border-primary/40',
          )}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
            boxShadow: isExpanded
              ? '0 0 30px hsl(var(--primary)/0.6), 0 8px 24px hsl(var(--primary)/0.4)'
              : '0 0 16px hsl(var(--primary)/0.35), 0 4px 16px hsl(0 0% 0% / 0.4)',
          }}
        >
          <div
            className="transition-transform duration-300"
            style={{ transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            {isExpanded ? (
              <X className="h-6 w-6 text-primary-foreground" />
            ) : (
              <Plus className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
        </button>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.6; transform: scale(2); }
          50%       { opacity: 0.3; transform: scale(2.3); }
        }
      `}</style>
    </div>
  );
};
