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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bubbles = canvas.querySelectorAll('.bubble');

    // Calculate header height to prevent bubbles from floating above buttons
    const getHeaderHeight = () => {
      // Mobile: approximately 120px for header with buttons
      // Desktop: approximately 100px for header with buttons
      return window.innerWidth < 640 ? 120 : 100;
    };

    // Initialize bubble positions and velocities with independent physics
    const bubbleData = new Map();
    bubbles.forEach((bubble) => {
      const element = bubble as HTMLElement;
      const bookmarkId = element.getAttribute('data-bubble-id');
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      const headerHeight = getHeaderHeight();
      
      bubbleData.set(element, {
        x: parseFloat(element.style.left) || Math.random() * (window.innerWidth - 100),
        y: Math.max(
          parseFloat(element.style.top) || Math.random() * (window.innerHeight - 100),
          headerHeight + 50 // Ensure bubbles start below header
        ),
        vx: (Math.random() - 0.5) * 0.5, // Reduced initial velocity
        vy: (Math.random() - 0.5) * 0.5,
        baseSize: bookmark?.size || 60,
        currentSize: bookmark?.size || 60,
        targetSize: bookmark?.size || 60,
      });
    });

    const animate = () => {
      const headerHeight = getHeaderHeight();
      
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        const bookmarkId = element.getAttribute('data-bubble-id');
        
        // Skip animation for dragged bubble
        if (draggedBubble === bookmarkId) {
          return;
        }
        
        const isHovered = hoveredBubble === bookmarkId;
        const isClicked = clickedBubble === bookmarkId;

        // Individual bubble floating movement - completely independent
        if (isHovered) {
          // Enhanced floating for hovered bubble only
          const time = Date.now() * 0.003;
          const uniqueOffset = parseFloat(bookmarkId?.slice(-4) || '1') || 1;
          
          // Gentle pulsing and floating when hovered
          const pulseEffect = Math.sin(time * 2) * 0.05 + 1;
          data.targetSize = data.baseSize * 1.3 * pulseEffect;
          
          // Individual floating motion
          data.vx += Math.sin(time + uniqueOffset) * 0.02;
          data.vy += Math.cos(time * 1.2 + uniqueOffset) * 0.02;
        } else {
          // Minimal natural floating for non-hovered bubbles
          const time = Date.now() * 0.001;
          const uniqueOffset = parseFloat(bookmarkId?.slice(-4) || '1') || 1;
          
          // Very subtle floating
          const floatX = Math.sin(time * 0.2 + uniqueOffset) * 0.02;
          const floatY = Math.cos(time * 0.15 + uniqueOffset * 1.5) * 0.015;
          
          data.vx += floatX;
          data.vy += floatY;
          
          data.targetSize = data.baseSize;
        }

        if (isClicked) {
          data.targetSize = data.baseSize * 0.85;
        }

        // Smooth size interpolation
        data.currentSize += (data.targetSize - data.currentSize) * 0.12;

        // Apply velocity
        data.x += data.vx;
        data.y += data.vy;

        // Boundary collision with realistic bouncing - respect header area
        const radius = data.currentSize / 2;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        const topBoundary = headerHeight + radius; // Prevent bubbles from going above header
        const restitution = 0.7; // Bounciness factor
        
        // Left and right boundaries
        if (data.x < radius) {
          data.x = radius;
          data.vx = Math.abs(data.vx) * restitution; // Ensure positive velocity (bouncing right)
        } else if (data.x > canvasWidth - radius) {
          data.x = canvasWidth - radius;
          data.vx = -Math.abs(data.vx) * restitution; // Ensure negative velocity (bouncing left)
        }
        
        // Top and bottom boundaries
        if (data.y < topBoundary) {
          data.y = topBoundary;
          data.vy = Math.abs(data.vy) * restitution; // Ensure positive velocity (bouncing down)
        } else if (data.y > canvasHeight - radius) {
          data.y = canvasHeight - radius;
          data.vy = -Math.abs(data.vy) * restitution; // Ensure negative velocity (bouncing up)
        }

        // Velocity damping
        data.vx *= 0.98;
        data.vy *= 0.98;

        // Velocity limits for gentle floating movement
        const maxVelocity = 1.0;
        const velocityMagnitude = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
        if (velocityMagnitude > maxVelocity) {
          data.vx = (data.vx / velocityMagnitude) * maxVelocity;
          data.vy = (data.vy / velocityMagnitude) * maxVelocity;
        }

        // Apply final position and size
        element.style.left = `${data.x - data.currentSize / 2}px`;
        element.style.top = `${data.y - data.currentSize / 2}px`;
        element.style.width = `${data.currentSize}px`;
        element.style.height = `${data.currentSize}px`;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
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
      const headerHeight = window.innerWidth < 640 ? 120 : 100;
      const newX = clientX - dragOffsetRef.current.x;
      const newY = Math.max(clientY - dragOffsetRef.current.y, headerHeight + 20); // Prevent dragging above header
      
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
          className="bubble absolute cursor-pointer transition-all duration-150 group select-none"
          style={{
            left: bookmark.x,
            top: bookmark.y,
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
            onClick={() => handleBubbleClick(bookmark)}
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
