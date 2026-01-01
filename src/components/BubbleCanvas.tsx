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
// Hot bubbles (high access) = red, normal size
// Cold bubbles (low access) = blue, smaller size
const getHeatStylesAndSize = (accessCount: number, maxAccess: number) => {
  // Normalize access count to 0-1 range
  const heat = maxAccess > 0 ? Math.min(accessCount / maxAccess, 1) : 0;
  
  // Interpolate from blue (cold) to red (hot)
  // Cold: HSL(210, 100%, 60%) - Light Blue
  // Hot: HSL(0, 85%, 55%) - Red
  const hue = 210 - (heat * 210); // 210 (blue) → 0 (red)
  const saturation = 60 + (heat * 25); // 60% → 85%
  const lightness = 60 - (heat * 5); // 60% → 55%
  
  // Cold bubbles are smaller, hot bubbles are normal/base size
  // Min size: 35px (coldest), Max size: 65px (hottest)
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

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick, currentSubscription }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
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
      return window.innerWidth < 640 ? 120 : 100;
    };

    // Calculate max access for sizing
    const maxAccessCount = Math.max(...bookmarks.map(b => b.accessCount), 1);

    // Create completely independent ecosystems for each bubble
    const bubbleData = new Map();
    bubbles.forEach((bubble) => {
      const element = bubble as HTMLElement;
      const bookmarkId = element.getAttribute('data-bubble-id');
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      const headerHeight = getHeaderHeight();
      const uniqueSeed = bookmarkId ? parseInt(bookmarkId.slice(-8), 16) || 1 : Math.random() * 1000;
      const ecosystemId = Math.random() * 1000000;
      
      // Calculate size based on heat (access count)
      const heatStyles = bookmark ? getHeatStylesAndSize(bookmark.accessCount, maxAccessCount) : { size: 50 };
      const bubbleSize = heatStyles.size;
      
      bubbleData.set(element, {
        // Position & Physics
        x: bookmark?.x || Math.random() * (window.innerWidth - 100),
        y: Math.max(
          bookmark?.y || Math.random() * (window.innerHeight - 100),
          headerHeight + 50
        ),
        vx: (Math.random() - 0.5) * (0.2 + Math.random() * 0.3),
        vy: (Math.random() - 0.5) * (0.2 + Math.random() * 0.3),
        
        // Size & Animation - now based on heat/access count
        baseSize: bubbleSize,
        currentSize: bubbleSize,
        targetSize: bubbleSize,
        
        // Independent Ecosystem Properties
        ecosystemId,
        birthTime: Date.now() + (uniqueSeed % 15000),
        lifePhase: Math.random() * Math.PI * 2,
        personality: {
          energy: 0.5 + Math.random() * 0.5,
          rhythm: 0.8 + Math.random() * 0.4,
          amplitude: 0.7 + Math.random() * 0.6,
          socialness: Math.random(),
          stability: 0.3 + Math.random() * 0.4,
        },
        
        // Individual Timing Systems
        floatCycle: Math.random() * Math.PI * 2,
        pulseCycle: Math.random() * Math.PI * 2,
        breatheCycle: Math.random() * Math.PI * 2,
        
        // Reaction States
        excitement: 0,
        lastInteraction: 0,
        autonomousAction: Math.random() * 10000,
      });
    });

    const animate = () => {
      const headerHeight = getHeaderHeight();
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;
      
      // Independent bubble animation with collision detection
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        const bookmarkId = element.getAttribute('data-bubble-id');
        
        // Skip animation for dragged bubble
        if (draggedBubble === bookmarkId) {
          return;
        }

        // Simplified smooth animation - reduce complexity for mobile
        const p = data.personality;
        
        // Simple, smooth cycle updates (fewer calculations)
        data.floatCycle += 0.01 * p.rhythm;
        data.breatheCycle += 0.008 * p.rhythm;
        
        // Simple organic movement - single sine wave per axis
        const organicX = Math.sin(data.floatCycle) * 0.02 * p.amplitude;
        const organicY = Math.cos(data.breatheCycle) * 0.015 * p.amplitude;
        
        data.vx += organicX;
        data.vy += organicY;
        
        // Apply velocity
        data.x += data.vx;
        data.y += data.vy;

        // Simple boundary handling
        const radius = data.baseSize / 2;
        const topBoundary = headerHeight + radius;
        
        if (data.x < radius) {
          data.x = radius;
          data.vx = Math.abs(data.vx) * 0.8;
        } else if (data.x > canvasWidth - radius) {
          data.x = canvasWidth - radius;
          data.vx = -Math.abs(data.vx) * 0.8;
        }
        
        if (data.y < topBoundary) {
          data.y = topBoundary;
          data.vy = Math.abs(data.vy) * 0.8;
        } else if (data.y > canvasHeight - radius) {
          data.y = canvasHeight - radius;
          data.vy = -Math.abs(data.vy) * 0.8;
        }

        // Simple damping
        data.vx *= 0.995;
        data.vy *= 0.995;

        // Simple velocity cap
        const maxVelocity = 0.8;
        const speed = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
        if (speed > maxVelocity) {
          data.vx = (data.vx / speed) * maxVelocity;
          data.vy = (data.vy / speed) * maxVelocity;
        }
      });

      // Bubble-to-bubble collision detection and response
      const bubbleArray = Array.from(bubbles);
      for (let i = 0; i < bubbleArray.length; i++) {
        const bubble1 = bubbleArray[i] as HTMLElement;
        const data1 = bubbleData.get(bubble1);
        if (!data1) continue;
        
        const bookmarkId1 = bubble1.getAttribute('data-bubble-id');
        if (draggedBubble === bookmarkId1) continue;
        
        for (let j = i + 1; j < bubbleArray.length; j++) {
          const bubble2 = bubbleArray[j] as HTMLElement;
          const data2 = bubbleData.get(bubble2);
          if (!data2) continue;
          
          const bookmarkId2 = bubble2.getAttribute('data-bubble-id');
          if (draggedBubble === bookmarkId2) continue;
          
          // Calculate distance between bubble centers
          const dx = data2.x - data1.x;
          const dy = data2.y - data1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Check if bubbles are colliding
          const radius1 = data1.currentSize / 2;
          const radius2 = data2.currentSize / 2;
          const minDistance = radius1 + radius2;
          
          if (distance < minDistance && distance > 0) {
            // Bubbles are colliding - calculate collision response
            const overlap = minDistance - distance;
            
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Separate bubbles based on overlap
            const separationFactor = overlap / 2;
            data1.x -= nx * separationFactor;
            data1.y -= ny * separationFactor;
            data2.x += nx * separationFactor;
            data2.y += ny * separationFactor;
            
            // Calculate relative velocity
            const dvx = data2.vx - data1.vx;
            const dvy = data2.vy - data1.vy;
            
            // Calculate relative velocity in collision normal direction
            const relativeVelocity = dvx * nx + dvy * ny;
            
            // Don't resolve if velocities are separating
            if (relativeVelocity < 0) {
              // Elastic collision with some damping for realistic bouncing
              const restitution = 0.8; // Bounciness factor
              const impulse = (1 + restitution) * relativeVelocity / 2;
              
              // Apply impulse to velocities
              data1.vx += impulse * nx;
              data1.vy += impulse * ny;
              data2.vx -= impulse * nx;
              data2.vy -= impulse * ny;
              
              // Add excitement to both bubbles
              data1.excitement = Math.min(1, data1.excitement + 0.1);
              data2.excitement = Math.min(1, data2.excitement + 0.1);
            }
          }
        }
      }

      // Apply DOM updates directly (already in animation frame)
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        // Use rounded pixel values to prevent subpixel blur
        const roundedX = Math.round(data.x - data.currentSize / 2);
        const roundedY = Math.round(data.y - data.currentSize / 2);
        const roundedSize = Math.round(data.currentSize);
        
        element.style.transform = `translate3d(${roundedX}px, ${roundedY}px, 0)`;
        element.style.width = `${roundedSize}px`;
        element.style.height = `${roundedSize}px`;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bookmarks, draggedBubble, clickedBubble]);

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
    
    setTimeout(() => {
      if (dragStartRef.current && !isDraggingRef.current) {
        dragStartRef.current = null;
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

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (!isDraggingRef.current && distance > 10) {
      isDraggingRef.current = true;
      const draggedElement = document.elementFromPoint(dragStartRef.current.x, dragStartRef.current.y)?.closest('[data-bubble-id]') as HTMLElement;
      if (draggedElement) {
        const bubbleId = draggedElement.getAttribute('data-bubble-id');
        if (bubbleId) {
          setDraggedBubble(bubbleId);
        }
      }
    }
    
    if (isDraggingRef.current && draggedBubble) {
      e.preventDefault();
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

  // Calculate max access count for heat coloring and sizing
  const maxAccessCount = Math.max(...bookmarks.map(b => b.accessCount), 1);

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount);
        return (
          <div
            key={bookmark.id}
            data-bubble-id={bookmark.id}
            className="bubble absolute cursor-pointer group select-none"
            style={{
              transform: `translate3d(${Math.round(bookmark.x)}px, ${Math.round(bookmark.y)}px, 0)`,
              width: `${heatStyles.size}px`,
              height: `${heatStyles.size}px`,
              zIndex: draggedBubble === bookmark.id ? 30 : 10,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              filter: 'blur(0)',
            }}
            onMouseDown={(e) => handleDragStart(e, bookmark.id)}
            onTouchStart={(e) => handleDragStart(e, bookmark.id)}
          >
            <div
              className="w-full h-full rounded-full flex flex-col items-center justify-center relative"
              style={{
                background: heatStyles.gradient,
                border: `3px solid ${heatStyles.border}`,
                boxShadow: `0 0 15px ${heatStyles.glow}, inset 0 1px 5px rgba(255,255,255,0.1)`,
                imageRendering: 'auto',
              }}
              onClick={() => handleBubbleClick(bookmark)}
            >
            <img
              src={bookmark.favicon}
              alt={bookmark.title}
              className="w-6 h-6 rounded pointer-events-none opacity-90"
              style={{ imageRendering: 'auto' }}
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
  );
};