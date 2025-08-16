import { useEffect, useRef, useState } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
}

// Helper functions for CryptoBubbles-style styling
const getPerformanceColor = (accessCount: number) => {
  // Simulate performance based on access count
  // Higher access = better performance (green), lower = worse (red)
  const performance = accessCount - 5; // Normalize around 5 clicks
  
  if (performance > 3) return 'linear-gradient(135deg, #10b981, #059669)'; // Strong green
  if (performance > 1) return 'linear-gradient(135deg, #22c55e, #16a34a)'; // Medium green  
  if (performance > -1) return 'linear-gradient(135deg, #6b7280, #4b5563)'; // Neutral gray
  if (performance > -3) return 'linear-gradient(135deg, #f59e0b, #d97706)'; // Orange
  return 'linear-gradient(135deg, #ef4444, #dc2626)'; // Red
};

const getPerformanceBorderColor = (accessCount: number) => {
  const performance = accessCount - 5;
  
  if (performance > 3) return '#059669';
  if (performance > 1) return '#16a34a';
  if (performance > -1) return '#6b7280';
  if (performance > -3) return '#d97706';
  return '#dc2626';
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
    let mouseX = 0;
    let mouseY = 0;
    let isMouseInCanvas = false;

    // Calculate header height to prevent bubbles from floating above buttons
    const getHeaderHeight = () => {
      // Mobile: approximately 120px for header with buttons
      // Desktop: approximately 100px for header with buttons
      return window.innerWidth < 640 ? 120 : 100;
    };

    // Initialize bubble positions and velocities with CryptoBubbles-style physics
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
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        baseSize: bookmark?.size || 60,
        currentSize: bookmark?.size || 60,
        targetSize: bookmark?.size || 60,
        originalX: 0,
        originalY: 0,
        mass: (bookmark?.size || 60) / 60, // Larger bubbles have more mass
        attracted: false
      });
      
      // Store original position for spring-back effect (ensure it's below header)
      const data = bubbleData.get(element);
      data.originalX = data.x;
      data.originalY = Math.max(data.y, headerHeight + 50);
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseInCanvas = true;
    };

    const handleMouseLeave = () => {
      isMouseInCanvas = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
        isMouseInCanvas = true;
      }
    };

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

        const bubbleX = data.x + data.currentSize / 2;
        const bubbleY = data.y + data.currentSize / 2;
        
        // CryptoBubbles-style mouse interaction
        const deltaX = mouseX - bubbleX;
        const deltaY = mouseY - bubbleY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        const isHovered = hoveredBubble === bookmarkId;
        const isClicked = clickedBubble === bookmarkId;
        
        // Strong attraction zone (like CryptoBubbles)
        const attractionRadius = 200;
        const repulsionRadius = 80;
        
        if (isMouseInCanvas && distance < attractionRadius && distance > 0) {
          const normalizedX = deltaX / distance;
          const normalizedY = deltaY / distance;
          
          if (distance < repulsionRadius) {
            // Strong repulsion when too close
            const repulsionForce = (repulsionRadius - distance) / repulsionRadius * 8;
            data.vx -= normalizedX * repulsionForce;
            data.vy -= normalizedY * repulsionForce;
            data.attracted = false;
          } else {
            // Attraction force (stronger than before)
            const attractionForce = Math.pow((attractionRadius - distance) / attractionRadius, 2) * 3;
            data.vx += normalizedX * attractionForce;
            data.vy += normalizedY * attractionForce;
            data.attracted = true;
          }
        } else {
          data.attracted = false;
          
          // Spring back to original position when mouse is far
          if (!isMouseInCanvas || distance > attractionRadius) {
            const springX = (data.originalX - data.x) * 0.01;
            const springY = (data.originalY - data.y) * 0.01;
            data.vx += springX;
            data.vy += springY;
          }
        }

        // Bubble-to-bubble collision detection and avoidance
        bubbles.forEach((otherBubble) => {
          if (otherBubble === bubble) return;
          
          const otherData = bubbleData.get(otherBubble);
          if (!otherData) return;
          
          const otherX = otherData.x + otherData.currentSize / 2;
          const otherY = otherData.y + otherData.currentSize / 2;
          
          const dx = bubbleX - otherX;
          const dy = bubbleY - otherY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (data.currentSize + otherData.currentSize) / 2 + 10;
          
          if (distance < minDistance && distance > 0) {
            const force = (minDistance - distance) / minDistance * 0.5;
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            data.vx += normalizedX * force;
            data.vy += normalizedY * force;
          }
        });

        // Dynamic sizing based on interaction
        if (isClicked) {
          data.targetSize = data.baseSize * 0.85;
        } else if (isHovered) {
          data.targetSize = data.baseSize * 1.5;
        } else if (data.attracted) {
          data.targetSize = data.baseSize * 1.2;
        } else {
          data.targetSize = data.baseSize;
        }

        // Smooth size interpolation
        data.currentSize += (data.targetSize - data.currentSize) * 0.12;

        // Apply velocity with mass consideration
        data.x += data.vx / data.mass;
        data.y += data.vy / data.mass;

        // Enhanced boundary collision with bouncing - respect header area
        const padding = data.currentSize / 2 + 20;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        const topBoundary = headerHeight + padding; // Prevent bubbles from going above header
        
        if (data.x < padding) {
          data.x = padding;
          data.vx *= -0.7;
        } else if (data.x > canvasWidth - padding) {
          data.x = canvasWidth - padding;
          data.vx *= -0.7;
        }
        
        // Updated top boundary to respect header
        if (data.y < topBoundary) {
          data.y = topBoundary;
          data.vy *= -0.7;
        } else if (data.y > canvasHeight - padding) {
          data.y = canvasHeight - padding;
          data.vy *= -0.7;
        }

        // Velocity damping (less damping when attracted for more responsive movement)
        const dampingFactor = data.attracted ? 0.92 : 0.96;
        data.vx *= dampingFactor;
        data.vy *= dampingFactor;

        // Velocity limits
        const maxVelocity = data.attracted ? 8 : 4;
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

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    animate();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
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
          {/* CryptoBubbles-style main bubble */}
          <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center shadow-lg relative overflow-hidden transition-all duration-200"
            style={{
              background: getPerformanceColor(bookmark.accessCount),
              border: `2px solid ${getPerformanceBorderColor(bookmark.accessCount)}`,
              boxShadow: hoveredBubble === bookmark.id 
                ? `0 0 30px ${getPerformanceColor(bookmark.accessCount)}88, 0 4px 20px rgba(0,0,0,0.3)`
                : `0 4px 15px rgba(0,0,0,0.2)`,
            }}
            onClick={() => handleBubbleClick(bookmark)}
          >
            {/* Favicon - smaller and positioned at top */}
            <img
              src={bookmark.favicon}
              alt={bookmark.title}
              className="w-4 h-4 rounded pointer-events-none transition-all duration-200 mb-1"
              style={{
                transform: hoveredBubble === bookmark.id ? 'scale(1.1)' : 'scale(1)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
              }}
            />

            {/* Site name - CryptoBubbles style */}
            <div className="text-white font-bold text-xs text-center leading-none mb-1 pointer-events-none">
              {getSiteName(bookmark.title, bookmark.url)}
            </div>

            {/* Performance percentage */}
            <div className="text-white text-xs font-medium pointer-events-none">
              {getPerformancePercentage(bookmark.accessCount)}
            </div>

            {/* Subtle inner glow */}
            <div 
              className="absolute inset-0 rounded-full opacity-20 pointer-events-none transition-opacity duration-200"
              style={{
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)`,
                opacity: hoveredBubble === bookmark.id ? 0.3 : 0.15,
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