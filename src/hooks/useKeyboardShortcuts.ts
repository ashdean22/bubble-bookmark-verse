import { useEffect } from 'react';

interface KeyboardShortcuts {
  onCreateBubble: () => void;
  onBuyBubbles: () => void;
  onShowAnalytics: () => void;
  onShowHelp: () => void;
}

export const useKeyboardShortcuts = ({
  onCreateBubble,
  onBuyBubbles,
  onShowAnalytics,
  onShowHelp,
}: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle modifier + key combinations
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
      
      // Handle standalone keys
      if (e.key === '?') {
        e.preventDefault();
        onShowHelp();
      }
      
      // ESC to close any open modals
      if (e.key === 'Escape') {
        // This could be enhanced to close specific modals
        console.log('ESC pressed - could close modals');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCreateBubble, onBuyBubbles, onShowAnalytics, onShowHelp]);
};