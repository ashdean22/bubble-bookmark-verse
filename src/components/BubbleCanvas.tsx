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
        
        const isHovered = hoveredBubble === bookmarkId;
        const isClicked = clickedBubble === bookmarkId;
        
        // Get bookmark for access count-based floating behavior
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        const accessCount = bookmark?.accessCount || 0;
        
        // Only apply natural floating to non-hovered bubbles for subtle background movement
        if (!hoveredBubble || hoveredBubble === bookmarkId) {
          // Add natural floating movement with gentle random drift (reduced for non-hovered)
          const time = Date.now() * 0.001;
          const uniqueOffset = parseFloat(bookmarkId.slice(-4)) || 1;
          
          // Reduced floating forces for background bubbles, enhanced for hovered bubble
          const intensity = isHovered ? 0.3 : 0.05;
          const floatX = Math.sin(time * 0.3 + uniqueOffset) * intensity;
          const floatY = Math.cos(time * 0.2 + uniqueOffset * 1.5) * (intensity * 0.8);
          
          // Reduced drift changes for non-hovered bubbles
          const driftChance = isHovered ? 0.01 : 0.001;
          if (Math.random() < driftChance) {
            const driftIntensity = isHovered ? 0.3 : 0.1;
            data.vx += (Math.random() - 0.5) * driftIntensity;
            data.vy += (Math.random() - 0.5) * driftIntensity;
          }
          
          // Apply floating forces
          data.vx += floatX;
          data.vy += floatY;
        }
        
        data.attracted = false;

        // Natural bubble-to-bubble collision with momentum exchange
        // Reduce collision sensitivity when bubbles are hovered to prevent chain reactions
        bubbles.forEach((otherBubble) => {
          if (otherBubble === bubble) return;
          
          const otherData = bubbleData.get(otherBubble);
          if (!otherData) return;
          
          const otherBookmarkId = (otherBubble as HTMLElement).getAttribute('data-bubble-id');
          const otherIsHovered = hoveredBubble === otherBookmarkId;
          
          // Skip collision if either bubble is hovered to prevent chain reactions
          if (isHovered || otherIsHovered) return;
          
          const otherX = otherData.x + otherData.currentSize / 2;
          const otherY = otherData.y + otherData.currentSize / 2;
          
          const dx = bubbleX - otherX;
          const dy = bubbleY - otherY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (data.currentSize + otherData.currentSize) / 2 + 5;
          
          if (distance < minDistance && distance > 0) {
            // Calculate collision normal
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            // Separate overlapping bubbles
            const overlap = minDistance - distance;
            const separation = overlap * 0.5;
            
            data.x += normalX * separation * (otherData.mass / (data.mass + otherData.mass));
            data.y += normalY * separation * (otherData.mass / (data.mass + otherData.mass));
            otherData.x -= normalX * separation * (data.mass / (data.mass + otherData.mass));
            otherData.y -= normalY * separation * (data.mass / (data.mass + otherData.mass));
            
            // Calculate relative velocity in collision normal direction
            const relativeVelX = data.vx - otherData.vx;
            const relativeVelY = data.vy - otherData.vy;
            const speed = relativeVelX * normalX + relativeVelY * normalY;
            
            // Do not resolve if velocities are separating
            if (speed < 0) return;
            
            // More natural restitution with slight randomness
            const baseRestitution = 0.4 + Math.random() * 0.2; // 0.4-0.6 range for softer bounces
            const impulse = 2 * speed * baseRestitution / (data.mass + otherData.mass);
            
            // Add slight randomness to collision angle for organic feel
            const randomAngle = (Math.random() - 0.5) * 0.1;
            const adjustedNormalX = normalX * Math.cos(randomAngle) - normalY * Math.sin(randomAngle);
            const adjustedNormalY = normalX * Math.sin(randomAngle) + normalY * Math.cos(randomAngle);
            
            // Apply softer impulse with adjusted normals
            data.vx -= impulse * otherData.mass * adjustedNormalX * 0.8;
            data.vy -= impulse * otherData.mass * adjustedNormalY * 0.8;
            otherData.vx += impulse * data.mass * adjustedNormalX * 0.8;
            otherData.vy += impulse * data.mass * adjustedNormalY * 0.8;
          }
        });

        // Individual bubble reactions - isolated from other bubbles
        if (isHovered && !draggedBubble) {
          // Individual hover reaction with gentle pulsing
          const time = Date.now() * 0.003;
          const pulseEffect = Math.sin(time * 2) * 0.05 + 1;
          data.targetSize = data.baseSize * 1.3 * pulseEffect;
          
          // Gentle individual float when hovered
          data.vx += Math.sin(time) * 0.02;
          data.vy += Math.cos(time * 1.2) * 0.02;
        } else if (isClicked) {
          data.targetSize = data.baseSize * 0.85;
        } else {
          data.targetSize = data.baseSize;
        }

        // Smooth size interpolation
        data.currentSize += (data.targetSize - data.currentSize) * 0.12;

        // Apply velocity with mass consideration
        data.x += data.vx / data.mass;
        data.y += data.vy / data.mass;

        // Enhanced boundary collision with realistic bouncing - respect header area
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

        // Velocity damping (less damping when attracted for more responsive movement)
        const dampingFactor = data.attracted ? 0.92 : 0.96;
        data.vx *= dampingFactor;
        data.vy *= dampingFactor;

        // Velocity limits for gentle floating movement
        const maxVelocity = 1.5;
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