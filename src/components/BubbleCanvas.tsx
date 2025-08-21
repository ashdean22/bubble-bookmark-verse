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

  // Removed spatial grid - bubbles now move independently

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);

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

    // Initialize bubble positions and velocities with completely independent physics
    const bubbleData = new Map();
    bubbles.forEach((bubble) => {
      const element = bubble as HTMLElement;
      const bookmarkId = element.getAttribute('data-bubble-id');
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      const headerHeight = getHeaderHeight();
      const uniqueSeed = bookmarkId ? parseInt(bookmarkId.slice(-8), 16) || 1 : Math.random() * 1000;
      
      bubbleData.set(element, {
        x: bookmark?.x || Math.random() * (window.innerWidth - 100),
        y: Math.max(
          bookmark?.y || Math.random() * (window.innerHeight - 100),
          headerHeight + 50
        ),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseSize: bookmark?.size || 60,
        currentSize: bookmark?.size || 60,
        targetSize: bookmark?.size || 60,
        startTime: Date.now() + (uniqueSeed % 10000), // Unique start time
        phase: uniqueSeed * 0.001, // Unique phase offset
      });
    });

    const animate = () => {
      const headerHeight = getHeaderHeight();
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;
      
      // Independent bubble animation - no collision detection
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
          // Enhanced floating for hovered bubble only using individual timing
          const currentTime = (Date.now() - data.startTime) * 0.003;
          
          // Gentle pulsing and floating when hovered
          const pulseEffect = Math.sin(currentTime * 2 + data.phase) * 0.05 + 1;
          data.targetSize = data.baseSize * 1.3 * pulseEffect;
          
          // Individual floating motion with unique phase
          data.vx += Math.sin(currentTime + data.phase) * 0.02;
          data.vy += Math.cos(currentTime * 1.2 + data.phase * 2) * 0.02;
        } else {
          // Natural floating for all bubbles using individual timing
          const currentTime = (Date.now() - data.startTime) * 0.002;
          
          // Gentle natural floating movement with unique phase
          const floatX = Math.sin(currentTime * 0.5 + data.phase) * 0.08;
          const floatY = Math.cos(currentTime * 0.3 + data.phase * 1.5) * 0.06;
          
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

        // Enhanced boundary collision with more noticeable bouncing
        const radius = data.currentSize / 2;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        const topBoundary = headerHeight + radius; // Prevent bubbles from going above header
        const restitution = 0.85; // Increased bounciness factor
        
        // Left and right boundaries with enhanced bouncing
        if (data.x < radius) {
          data.x = radius;
          data.vx = Math.abs(data.vx) * restitution + 0.5; // Add minimum bounce velocity
        } else if (data.x > canvasWidth - radius) {
          data.x = canvasWidth - radius;
          data.vx = -Math.abs(data.vx) * restitution - 0.5; // Add minimum bounce velocity
        }
        
        // Top and bottom boundaries with enhanced bouncing
        if (data.y < topBoundary) {
          data.y = topBoundary;
          data.vy = Math.abs(data.vy) * restitution + 0.5; // Add minimum bounce velocity
        } else if (data.y > canvasHeight - radius) {
          data.y = canvasHeight - radius;
          data.vy = -Math.abs(data.vy) * restitution - 0.5; // Add minimum bounce velocity
        }

        // Reduced velocity damping to preserve bouncing energy
        data.vx *= 0.995;
        data.vy *= 0.995;

        // Velocity limits for gentle floating movement
        const maxVelocity = 1.0;
        const velocityMagnitude = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
        if (velocityMagnitude > maxVelocity) {
          data.vx = (data.vx / velocityMagnitude) * maxVelocity;
          data.vy = (data.vy / velocityMagnitude) * maxVelocity;
        }
      });

      // Batch all DOM updates together for better performance
      const styleUpdates: Array<{ element: HTMLElement; transform: string; width: string; height: string }> = [];
      
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        // Collect all style changes without applying them yet
        styleUpdates.push({
          element,
          transform: `translate3d(${data.x - data.currentSize / 2}px, ${data.y - data.currentSize / 2}px, 0) scale(${data.currentSize / data.baseSize})`,
          width: `${data.baseSize}px`,
          height: `${data.baseSize}px`
        });
      });

      // Apply all DOM updates in a single batch to minimize style recalculations
      requestAnimationFrame(() => {
        styleUpdates.forEach(({ element, transform, width, height }) => {
          element.style.transform = transform;
          element.style.width = width;
          element.style.height = height;
        });
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
    console.log('Bubble clicked:', bookmark.title, 'isDragging:', isDraggingRef.current);
    if (!isDraggingRef.current) {
      console.log('Opening URL:', bookmark.url);
      setClickedBubble(bookmark.id);
      onBubbleClick(bookmark.id); // Track access
      setTimeout(() => setClickedBubble(null), 200);
      window.open(bookmark.url, '_blank');
    } else {
      console.log('Click blocked by drag state');
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, bookmarkId: string) => {
    console.log('Drag start for:', bookmarkId);
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Store initial touch/mouse position and time
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      time: Date.now()
    };
    
    const bubble = e.currentTarget as HTMLElement;
    const rect = bubble.getBoundingClientRect();
    
    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    isDraggingRef.current = false;
    
    // Set up potential drag target but don't start dragging yet
    setTimeout(() => {
      if (dragStartRef.current && !isDraggingRef.current) {
        console.log('Clearing drag start - no movement detected');
        dragStartRef.current = null; // Clear if no drag started
      }
    }, 200);
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

    // Check if we've moved enough to start dragging
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only start dragging if moved more than 10 pixels
    if (!isDraggingRef.current && distance > 10) {
      isDraggingRef.current = true;
      // Find which bubble we're dragging
      const draggedElement = document.elementFromPoint(dragStartRef.current.x, dragStartRef.current.y)?.closest('[data-bubble-id]') as HTMLElement;
      if (draggedElement) {
        const bubbleId = draggedElement.getAttribute('data-bubble-id');
        if (bubbleId) {
          setDraggedBubble(bubbleId);
        }
      }
    }
    
    if (isDraggingRef.current && draggedBubble) {
      e.preventDefault(); // Only prevent default when actually dragging
      const bubble = document.querySelector(`[data-bubble-id="${draggedBubble}"]`) as HTMLElement;
      if (bubble) {
        const headerHeight = window.innerWidth < 640 ? 120 : 100;
        const newX = clientX - dragOffsetRef.current.x;
        const newY = Math.max(clientY - dragOffsetRef.current.y, headerHeight + 20);
        
        bubble.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      }
    }
  };

  const handleDragEnd = () => {
    dragStartRef.current = null;
    setDraggedBubble(null);
    // Reset dragging state after a short delay to allow click events
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
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
