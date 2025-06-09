import { useEffect, useRef, useState } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
}

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bubbles = canvas.querySelectorAll('.bubble');
    let mouseX = 0;
    let mouseY = 0;

    // Initialize bubble positions and velocities
    const bubbleData = new Map();
    bubbles.forEach((bubble) => {
      const element = bubble as HTMLElement;
      const bookmarkId = element.getAttribute('data-bubble-id');
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      bubbleData.set(element, {
        x: parseFloat(element.style.left) || Math.random() * (window.innerWidth - 100),
        y: parseFloat(element.style.top) || Math.random() * (window.innerHeight - 100),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        baseSize: bookmark?.size || 60,
        currentSize: bookmark?.size || 60,
        targetSize: bookmark?.size || 60,
        pulse: Math.random() * Math.PI * 2,
        mouseInfluence: 0
      });
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    const animate = () => {
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        const bookmarkId = element.getAttribute('data-bubble-id');
        
        // Skip animation for dragged bubble
        if (draggedBubble === bookmarkId) {
          return;
        }

        const rect = element.getBoundingClientRect();
        const bubbleX = rect.left + rect.width / 2;
        const bubbleY = rect.top + rect.height / 2;
        
        // Mouse interaction with enhanced reactivity
        const deltaX = mouseX - bubbleX;
        const deltaY = mouseY - bubbleY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let mouseForceX = 0;
        let mouseForceY = 0;
        let sizeMultiplier = 1;
        
        // Enhanced mouse interaction zone
        if (distance < 250 && distance > 0) {
          const force = (250 - distance) / 250;
          mouseForceX = -deltaX * force * 0.8;
          mouseForceY = -deltaY * force * 0.8;
          
          // Size reaction based on proximity
          if (distance < 150) {
            sizeMultiplier = 1 + (150 - distance) / 150 * 0.3;
          }
        }

        // Reactive sizing
        const isHovered = hoveredBubble === bookmarkId;
        const isClicked = clickedBubble === bookmarkId;
        
        if (isClicked) {
          data.targetSize = data.baseSize * 0.9;
        } else if (isHovered) {
          data.targetSize = data.baseSize * 1.4;
        } else {
          data.targetSize = data.baseSize * sizeMultiplier;
        }

        // Smooth size interpolation
        data.currentSize += (data.targetSize - data.currentSize) * 0.15;

        // Continuous floating animation with pulse effect
        data.pulse += 0.02;
        const pulseEffect = Math.sin(data.pulse) * 0.3;
        
        data.x += data.vx + pulseEffect;
        data.y += data.vy + Math.cos(data.pulse * 0.7) * 0.2;

        // Boundary collision with enhanced physics
        const padding = 50;
        if (data.x < padding || data.x > window.innerWidth - padding) {
          data.vx *= -0.8;
          data.x = Math.max(padding, Math.min(window.innerWidth - padding, data.x));
        }
        if (data.y < padding || data.y > window.innerHeight - padding) {
          data.vy *= -0.8;
          data.y = Math.max(padding, Math.min(window.innerHeight - padding, data.y));
        }

        // Apply random variations for organic movement
        data.vx += (Math.random() - 0.5) * 0.15;
        data.vy += (Math.random() - 0.5) * 0.15;

        // Velocity limits with dynamic ranges
        const maxVelocity = isHovered ? 2.5 : 1.8;
        data.vx = Math.max(-maxVelocity, Math.min(maxVelocity, data.vx));
        data.vy = Math.max(-maxVelocity, Math.min(maxVelocity, data.vy));

        // Enhanced damping
        const dampingFactor = isHovered ? 0.98 : 0.995;
        data.vx *= dampingFactor;
        data.vy *= dampingFactor;

        // Combine all movements
        const finalX = data.x + mouseForceX;
        const finalY = data.y + mouseForceY;

        element.style.left = `${finalX}px`;
        element.style.top = `${finalY}px`;
        element.style.width = `${data.currentSize}px`;
        element.style.height = `${data.currentSize}px`;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bookmarks, draggedBubble, hoveredBubble, clickedBubble]);

  const handleBubbleClick = (bookmark: Bookmark) => {
    if (!draggedBubble) {
      setClickedBubble(bookmark.id);
      onBubbleClick(bookmark.id); // Track access
      setTimeout(() => setClickedBubble(null), 200);
      setTimeout(() => {
        window.open(bookmark.url, '_blank');
      }, 100);
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, bookmarkId: string) => {
    e.preventDefault();
    setDraggedBubble(bookmarkId);
    
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
      const newX = clientX - dragOffsetRef.current.x;
      const newY = clientY - dragOffsetRef.current.y;
      
      bubble.style.left = `${newX}px`;
      bubble.style.top = `${newY}px`;
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
          className="bubble absolute cursor-pointer transition-all duration-200 group select-none"
          style={{
            left: bookmark.x,
            top: bookmark.y,
            width: bookmark.size,
            height: bookmark.size,
            transform: hoveredBubble === bookmark.id ? 'scale(1.1)' : clickedBubble === bookmark.id ? 'scale(0.95)' : 'scale(1)',
            zIndex: hoveredBubble === bookmark.id ? 20 : draggedBubble === bookmark.id ? 30 : 10,
          }}
          onMouseEnter={() => setHoveredBubble(bookmark.id)}
          onMouseLeave={() => setHoveredBubble(null)}
          onMouseDown={(e) => handleDragStart(e, bookmark.id)}
          onTouchStart={(e) => handleDragStart(e, bookmark.id)}
        >
          {/* Main bubble with enhanced effects */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border-2 border-white/30 relative overflow-hidden transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${bookmark.color}88, ${bookmark.color}CC)`,
              boxShadow: hoveredBubble === bookmark.id 
                ? `0 0 50px ${bookmark.color}66, 0 0 100px ${bookmark.color}33`
                : `0 0 30px ${bookmark.color}44`,
              filter: hoveredBubble === bookmark.id ? 'brightness(1.2)' : 'brightness(1)',
            }}
            onClick={() => handleBubbleClick(bookmark)}
          >
            {/* Enhanced favicon */}
            <img
              src={bookmark.favicon}
              alt={bookmark.title}
              className="w-8 h-8 rounded pointer-events-none transition-all duration-300"
              style={{
                transform: hoveredBubble === bookmark.id ? 'scale(1.2)' : 'scale(1)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
              }}
            />
            
            {/* Access count indicator for frequently used bubbles */}
            {bookmark.accessCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold pointer-events-none">
                {bookmark.accessCount > 99 ? '99+' : bookmark.accessCount}
              </div>
            )}

            {/* Enhanced glow effect */}
            <div 
              className="absolute inset-0 rounded-full opacity-30 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at 30% 30%, white, transparent 70%)`,
                opacity: hoveredBubble === bookmark.id ? 0.5 : 0.3,
              }}
            />

            {/* Pulsing ring effect on hover */}
            {hoveredBubble === bookmark.id && (
              <div 
                className="absolute inset-0 rounded-full border-2 animate-ping pointer-events-none"
                style={{
                  borderColor: `${bookmark.color}88`,
                }}
              />
            )}
            
            {/* External link icon on hover */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <ExternalLink className="w-3 h-3 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Enhanced tooltip showing access count */}
          {hoveredBubble === bookmark.id && !draggedBubble && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50 border border-white/20 pointer-events-none animate-fade-in">
              {bookmark.title}
              {bookmark.accessCount > 0 && (
                <span className="block text-xs text-yellow-300">
                  Accessed {bookmark.accessCount} time{bookmark.accessCount !== 1 ? 's' : ''}
                </span>
              )}
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
