import { useEffect, useRef, useState } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
}

// Helper functions for transparent light blue bubble colors
const getTransparentBubbleColor = () => {
  // Light blue transparent gradient
  return 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(29, 78, 216, 0.4))';
};

const getTransparentBorderColor = () => {
  // Light blue border
  return 'rgba(59, 130, 246, 0.6)';
};

const getPerformancePercentage = (accessCount: number) => {
  // Convert access count to a percentage-like display
  const performance = accessCount - 5;
  const percentage = Math.max(-99, Math.min(99, performance * 10 + Math.random() * 20 - 10));
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
};

const getSiteName = (title: string, url: string) => {
  // Extract short site name from title or URL
  if (title && title.length > 0) {
    // Take first word or abbreviation
    const words = title.split(' ');
    if (words[0].length <= 6) return words[0].toUpperCase();
    return words[0].substring(0, 4).toUpperCase();
  }
  
  // Fallback to domain
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const parts = domain.split('.');
    return parts[0].substring(0, 4).toUpperCase();
  } catch {
    return 'SITE';
  }
};

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const workerRef = useRef<Worker | null>(null);
  const [bubblePositions, setBubblePositions] = useState<Map<string, { x: number; y: number; size: number }>>(new Map());

  // Initialize web worker
  useEffect(() => {
    // Create worker from the worker file
    workerRef.current = new Worker(new URL('../workers/bubblePhysics.worker.ts', import.meta.url), { type: 'module' });
    
    // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'physics-update') {
        const newPositions = new Map();
        data.forEach((bubble: {id: string, x: number, y: number, size: number}) => {
          newPositions.set(bubble.id, { x: bubble.x, y: bubble.y, size: bubble.size });
        });
        setBubblePositions(newPositions);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Initialize bubbles in worker when bookmarks change
  useEffect(() => {
    if (!workerRef.current || bookmarks.length === 0) return;

    const getHeaderHeight = () => {
      return window.innerWidth < 640 ? 120 : 100;
    };

    const bubbleData = bookmarks.map(bookmark => ({
      id: bookmark.id,
      x: bookmark.x || Math.random() * (window.innerWidth - 100),
      y: bookmark.y || Math.random() * (window.innerHeight - 100),
      size: bookmark.size || 60,
      accessCount: bookmark.accessCount || 0
    }));

    workerRef.current.postMessage({
      type: 'init',
      data: { bubbles: bubbleData, headerHeight: getHeaderHeight() }
    });
  }, [bookmarks]);

  // Animation loop - send updates to worker
  useEffect(() => {
    if (!workerRef.current) return;

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const getHeaderHeight = () => {
        return window.innerWidth < 640 ? 120 : 100;
      };

      workerRef.current!.postMessage({
        type: 'update',
        data: {
          config: {
            canvasWidth: canvas.clientWidth,
            canvasHeight: canvas.clientHeight,
            headerHeight: getHeaderHeight(),
            hoveredBubble,
            draggedBubble,
            clickedBubble
          }
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hoveredBubble, draggedBubble, clickedBubble]);

  // Apply DOM updates when positions change
  useEffect(() => {
    requestAnimationFrame(() => {
      bubblePositions.forEach((position, bubbleId) => {
        const element = document.querySelector(`[data-bubble-id="${bubbleId}"]`) as HTMLElement;
        if (element && draggedBubble !== bubbleId) {
          const bookmark = bookmarks.find(b => b.id === bubbleId);
          const baseSize = bookmark?.size || 60;
          element.style.transform = `translate3d(${position.x - position.size / 2}px, ${position.y - position.size / 2}px, 0) scale(${position.size / baseSize})`;
          element.style.width = `${baseSize}px`;
          element.style.height = `${baseSize}px`;
        }
      });
    });
  }, [bubblePositions, draggedBubble, bookmarks]);

  const handleBubbleClick = (bookmark: Bookmark, e: React.MouseEvent) => {
    console.log('Bubble clicked!', { 
      id: bookmark.id, 
      url: bookmark.url, 
      title: bookmark.title,
      draggedBubble: draggedBubble 
    });
    
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedBubble) {
      console.log('Click blocked - bubble is being dragged');
      return;
    }
    
    setClickedBubble(bookmark.id);
    onBubbleClick(bookmark.id); // Track access
    
    console.log('Opening URL:', bookmark.url);
    const opened = window.open(bookmark.url, '_blank');
    console.log('Window.open result:', opened);
    
    setTimeout(() => setClickedBubble(null), 200);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, bookmarkId: string) => {
    console.log('Drag start attempted for:', bookmarkId);
    e.preventDefault();
    
    const bubble = e.currentTarget as HTMLElement;
    const rect = bubble.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    // Only start drag after a short delay to allow clicks
    const dragTimeout = setTimeout(() => {
      console.log('Setting dragged bubble:', bookmarkId);
      setDraggedBubble(bookmarkId);
    }, 150);
    
    // Store timeout so we can clear it if needed
    (e.currentTarget as HTMLElement).dataset.dragTimeout = dragTimeout.toString();
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!draggedBubble) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const bubble = document.querySelector(`[data-bubble-id="${draggedBubble}"]`) as HTMLElement;
    if (bubble) {
      const headerHeight = window.innerWidth < 640 ? 120 : 100;
      const newX = clientX - dragOffsetRef.current.x;
      const newY = Math.max(clientY - dragOffsetRef.current.y, headerHeight + 20);
      
      bubble.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      
      // Update worker with new position
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'updateBubble',
          data: { id: draggedBubble, x: newX, y: newY }
        });
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedBubble(null);
  };

  useEffect(() => {
    if (draggedBubble) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleDragMove(e);
      };
      
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

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          data-bubble-id={bookmark.id}
          className="bubble absolute cursor-pointer transition-all duration-150 group select-none"
          style={{
            transform: `translate3d(${bookmark.x}px, ${bookmark.y}px, 0)`,
            width: bookmark.size,
            height: bookmark.size,
            zIndex: hoveredBubble === bookmark.id ? 20 : draggedBubble === bookmark.id ? 30 : 10,
          }}
          onMouseEnter={() => setHoveredBubble(bookmark.id)}
          onMouseLeave={() => setHoveredBubble(null)}
          onMouseDown={(e) => handleDragStart(e, bookmark.id)}
          onTouchStart={(e) => handleDragStart(e, bookmark.id)}
        >
          {/* Natural CryptoBubbles style bubble */}
          <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center relative transition-all duration-300 ease-out"
            style={{
              background: getTransparentBubbleColor(),
              border: `3px solid ${getTransparentBorderColor()}`,
              boxShadow: (() => {
                const accessCount = bookmark.accessCount || 0;
                const glowIntensity = Math.min(1 + (accessCount * 0.1), 2);
                const baseGlow = `0 0 ${15 * glowIntensity}px rgba(59, 130, 246, ${0.4 * glowIntensity})`;
                const hoverGlow = `0 0 ${25 * glowIntensity}px rgba(59, 130, 246, ${0.6 * glowIntensity}), 0 0 ${50 * glowIntensity}px rgba(59, 130, 246, ${0.3 * glowIntensity})`;
                const innerGlow = `inset 0 ${hoveredBubble === bookmark.id ? 2 : 1}px ${hoveredBubble === bookmark.id ? 10 : 5}px rgba(255,255,255,0.1)`;
                
                return hoveredBubble === bookmark.id 
                  ? `${hoverGlow}, ${innerGlow}`
                  : `${baseGlow}, ${innerGlow}`;
              })(),
              transform: hoveredBubble === bookmark.id ? 'scale(1.05)' : 'scale(1)',
              filter: hoveredBubble === bookmark.id ? 'brightness(1.1)' : 'brightness(1)',
            }}
            onClick={(e) => handleBubbleClick(bookmark, e)}
          >
            {/* Favicon - centered */}
            <img
              src={bookmark.favicon}
              alt={bookmark.title}
              className="w-6 h-6 rounded pointer-events-none opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
              }}
            />

            {/* External link icon on hover */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <ExternalLink className="w-3 h-3 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Enhanced tooltip */}
          {hoveredBubble === bookmark.id && !draggedBubble && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50 border border-white/20 pointer-events-none animate-fade-in">
              {bookmark.title}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
            </div>
          )}

          {/* Enhanced remove button */}
          {hoveredBubble === bookmark.id && !draggedBubble && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveBookmark(bookmark.id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
