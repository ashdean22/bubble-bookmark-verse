import { useEffect, useRef, useState } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink } from 'lucide-react';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
  currentSubscription?: string | null;
}

// Helper functions for heat-based bubble colors and sizing
const getHeatStylesAndSize = (accessCount: number, maxAccess: number) => {
  const heat = maxAccess > 0 ? Math.min(accessCount / maxAccess, 1) : 0;
  const hue = 210 - (heat * 210);
  const saturation = 60 + (heat * 25);
  const lightness = 60 - (heat * 5);
  const minSize = 35;
  const maxSize = 65;
  const size = Math.round(minSize + (heat * (maxSize - minSize)));
  
  return {
    gradient: `linear-gradient(135deg, hsla(${hue}, ${saturation}%, ${lightness}%, 0.4), hsla(${hue}, ${saturation - 10}%, ${lightness - 10}%, 0.5))`,
    border: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.75)`,
    glow: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`,
    size
  };
};

// Detect if user prefers reduced motion or is on mobile
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick, currentSubscription }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleBubbleClick = (bookmark: Bookmark) => {
    if (!isDraggingRef.current) {
      setClickedBubble(bookmark.id);
      onBubbleClick(bookmark.id);
      setTimeout(() => setClickedBubble(null), 150);
      window.open(bookmark.url, '_blank');
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, bookmarkId: string) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    
    const bubble = e.currentTarget as HTMLElement;
    const rect = bubble.getBoundingClientRect();
    dragOffsetRef.current = { x: clientX - rect.left, y: clientY - rect.top };
    isDraggingRef.current = false;
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!dragStartRef.current) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (!isDraggingRef.current && distance > 10) {
      isDraggingRef.current = true;
      const draggedElement = document.elementFromPoint(dragStartRef.current.x, dragStartRef.current.y)?.closest('[data-bubble-id]') as HTMLElement;
      if (draggedElement) {
        const bubbleId = draggedElement.getAttribute('data-bubble-id');
        if (bubbleId) setDraggedBubble(bubbleId);
      }
    }
    
    if (isDraggingRef.current && draggedBubble) {
      e.preventDefault();
      const bubble = document.querySelector(`[data-bubble-id="${draggedBubble}"]`) as HTMLElement;
      if (bubble) {
        const headerHeight = window.innerWidth < 640 ? 120 : 100;
        const newX = clientX - dragOffsetRef.current.x;
        const newY = Math.max(clientY - dragOffsetRef.current.y, headerHeight + 20);
        bubble.style.left = `${newX}px`;
        bubble.style.top = `${newY}px`;
      }
    }
  };

  const handleDragEnd = () => {
    dragStartRef.current = null;
    setDraggedBubble(null);
    setTimeout(() => { isDraggingRef.current = false; }, 50);
  };

  useEffect(() => {
    if (draggedBubble) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleTouchMove = (e: TouchEvent) => { e.preventDefault(); handleDragMove(e); };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggedBubble]);

  const maxAccessCount = Math.max(...bookmarks.map(b => b.accessCount), 1);

  return (
    <>
      <style>{`
        @keyframes bubble-float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(8px, -12px); }
          50% { transform: translate(-6px, -8px); }
          75% { transform: translate(10px, 6px); }
        }
        .bubble-animate {
          animation: bubble-float var(--float-duration, 8s) ease-in-out infinite;
          animation-delay: var(--float-delay, 0s);
        }
        .bubble-animate.dragging {
          animation: none;
        }
      `}</style>
      <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
        {bookmarks.map((bookmark, index) => {
          const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount);
          const isDragging = draggedBubble === bookmark.id;
          
          // Create unique animation timing per bubble
          const floatDuration = 6 + (index % 5) * 1.5;
          const floatDelay = (index * 0.7) % 4;
          
          return (
            <div
              key={bookmark.id}
              data-bubble-id={bookmark.id}
              className={`bubble absolute cursor-pointer group select-none bubble-animate ${isDragging ? 'dragging' : ''}`}
              style={{
                left: `${Math.round(bookmark.x)}px`,
                top: `${Math.round(bookmark.y)}px`,
                width: `${heatStyles.size}px`,
                height: `${heatStyles.size}px`,
                zIndex: isDragging ? 30 : 10,
                '--float-duration': `${floatDuration}s`,
                '--float-delay': `${floatDelay}s`,
              } as React.CSSProperties}
              onMouseDown={(e) => handleDragStart(e, bookmark.id)}
              onTouchStart={(e) => handleDragStart(e, bookmark.id)}
            >
              <div
                className="w-full h-full rounded-full flex flex-col items-center justify-center relative"
                style={{
                  background: heatStyles.gradient,
                  border: `3px solid ${heatStyles.border}`,
                  boxShadow: `0 0 15px ${heatStyles.glow}, inset 0 1px 5px rgba(255,255,255,0.1)`,
                }}
                onClick={() => handleBubbleClick(bookmark)}
              >
                <img
                  src={bookmark.favicon}
                  alt={bookmark.title}
                  className="w-6 h-6 rounded pointer-events-none opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                  }}
                />
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ExternalLink className="w-3 h-3 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};