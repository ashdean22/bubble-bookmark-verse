import { useEffect, useRef, useState, useCallback } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink } from 'lucide-react';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
  currentSubscription?: string | null;
}

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

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick, currentSubscription }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const bubbleDataRef = useRef<Map<string, any>>(new Map());

  // Initialize bubble data
  useEffect(() => {
    const maxAccessCount = Math.max(...bookmarks.map(b => b.accessCount), 1);
    const headerHeight = window.innerWidth < 640 ? 120 : 100;

    bookmarks.forEach((bookmark, index) => {
      if (!bubbleDataRef.current.has(bookmark.id)) {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount);
        bubbleDataRef.current.set(bookmark.id, {
          x: bookmark.x,
          y: Math.max(bookmark.y, headerHeight + 50),
          vx: 0,
          vy: 0,
          baseSize: heatStyles.size,
          // Multiple phases for organic movement
          phase1: Math.random() * Math.PI * 2,
          phase2: Math.random() * Math.PI * 2,
          phase3: Math.random() * Math.PI * 2,
          // Faster frequencies for lively movement
          freq1: 0.02 + Math.random() * 0.015,
          freq2: 0.03 + Math.random() * 0.02,
          freq3: 0.01 + Math.random() * 0.008,
          // Larger amplitudes for more motion
          amp1: 0.4 + Math.random() * 0.3,
          amp2: 0.25 + Math.random() * 0.15,
          amp3: 0.5 + Math.random() * 0.3,
        });
      }
    });

    // Clean up removed bookmarks
    const currentIds = new Set(bookmarks.map(b => b.id));
    bubbleDataRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        bubbleDataRef.current.delete(id);
      }
    });
  }, [bookmarks]);

  // Simple animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bookmarks.length === 0) return;

    const headerHeight = window.innerWidth < 640 ? 120 : 100;
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - lastTime;
      
      if (elapsed >= frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval);
        
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;

        // Update movement for each bubble
        const bubbleIds = Array.from(bubbleDataRef.current.keys());
        
        bubbleIds.forEach((id) => {
          const data = bubbleDataRef.current.get(id);
          if (!data || draggedBubble === id) return;

          // Update multiple phases at different speeds for organic movement
          data.phase1 += data.freq1;
          data.phase2 += data.freq2;
          data.phase3 += data.freq3;

          // Combine multiple sine waves for natural floating (like seaweed in water)
          const floatX = 
            Math.sin(data.phase1) * data.amp1 +
            Math.sin(data.phase2 * 1.3) * data.amp2 * 0.5 +
            Math.cos(data.phase3 * 0.7) * data.amp3 * 0.3;
          
          const floatY = 
            Math.cos(data.phase1 * 0.8) * data.amp1 * 0.8 +
            Math.sin(data.phase2 * 0.9) * data.amp2 * 0.6 +
            Math.sin(data.phase3 * 1.1) * data.amp3 * 0.4;

          // Gentle acceleration toward float direction (responsive easing)
          const targetVx = floatX * 1.2;
          const targetVy = floatY * 1.2;
          
          // Faster interpolation for snappier response
          data.vx += (targetVx - data.vx) * 0.06;
          data.vy += (targetVy - data.vy) * 0.06;

          // Apply velocity
          data.x += data.vx;
          data.y += data.vy;

          // Soft boundary collision (gentle push back)
          const radius = data.baseSize / 2;
          const margin = 10;
          
          if (data.x < radius + margin) {
            data.vx += (radius + margin - data.x) * 0.05;
          }
          if (data.x > canvasWidth - radius - margin) {
            data.vx -= (data.x - (canvasWidth - radius - margin)) * 0.05;
          }
          if (data.y < headerHeight + radius + margin) {
            data.vy += (headerHeight + radius + margin - data.y) * 0.05;
          }
          if (data.y > canvasHeight - radius - margin) {
            data.vy -= (data.y - (canvasHeight - radius - margin)) * 0.05;
          }

          // Keep within bounds
          data.x = Math.max(radius, Math.min(canvasWidth - radius, data.x));
          data.y = Math.max(headerHeight + radius, Math.min(canvasHeight - radius, data.y));

          // Light damping for continuous motion
          data.vx *= 0.99;
          data.vy *= 0.99;

          // Higher velocity cap for livelier movement
          const maxV = 2.0;
          const speed = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
          if (speed > maxV) {
            data.vx = (data.vx / speed) * maxV;
            data.vy = (data.vy / speed) * maxV;
          }
        });

        // Collision detection between bubbles
        for (let i = 0; i < bubbleIds.length; i++) {
          const id1 = bubbleIds[i];
          const data1 = bubbleDataRef.current.get(id1);
          if (!data1 || draggedBubble === id1) continue;

          for (let j = i + 1; j < bubbleIds.length; j++) {
            const id2 = bubbleIds[j];
            const data2 = bubbleDataRef.current.get(id2);
            if (!data2 || draggedBubble === id2) continue;

            const dx = data2.x - data1.x;
            const dy = data2.y - data1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (data1.baseSize + data2.baseSize) / 2;

            if (distance < minDistance && distance > 0) {
              // Separate bubbles
              const overlap = minDistance - distance;
              const nx = dx / distance;
              const ny = dy / distance;
              const separation = overlap / 2;

              data1.x -= nx * separation;
              data1.y -= ny * separation;
              data2.x += nx * separation;
              data2.y += ny * separation;

              // Bounce velocities
              const dvx = data2.vx - data1.vx;
              const dvy = data2.vy - data1.vy;
              const relVel = dvx * nx + dvy * ny;

              if (relVel < 0) {
                const restitution = 0.6;
                const impulse = (1 + restitution) * relVel / 2;
                data1.vx += impulse * nx;
                data1.vy += impulse * ny;
                data2.vx -= impulse * nx;
                data2.vy -= impulse * ny;
              }
            }
          }
        }

        // Update DOM for all bubbles
        bubbleIds.forEach((id) => {
          const data = bubbleDataRef.current.get(id);
          if (!data) return;
          
          const el = canvas.querySelector(`[data-bubble-id="${id}"]`) as HTMLElement;
          if (el) {
            const x = Math.round(data.x - data.baseSize / 2);
            const y = Math.round(data.y - data.baseSize / 2);
            el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bookmarks, draggedBubble]);

  const handleBubbleClick = (bookmark: Bookmark) => {
    if (!isDraggingRef.current) {
      setClickedBubble(bookmark.id);
      onBubbleClick(bookmark.id);
      setTimeout(() => setClickedBubble(null), 150);
      window.open(bookmark.url, '_blank');
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, bookmarkId: string) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    
    const bubble = e.currentTarget as HTMLElement;
    const rect = bubble.getBoundingClientRect();
    dragOffsetRef.current = { x: clientX - rect.left, y: clientY - rect.top };
    isDraggingRef.current = false;
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragStartRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

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
      const data = bubbleDataRef.current.get(draggedBubble);
      if (data) {
        const headerHeight = window.innerWidth < 640 ? 120 : 100;
        data.x = clientX - dragOffsetRef.current.x + data.baseSize / 2;
        data.y = Math.max(clientY - dragOffsetRef.current.y + data.baseSize / 2, headerHeight + data.baseSize / 2);
        data.vx = 0;
        data.vy = 0;

        const bubble = document.querySelector(`[data-bubble-id="${draggedBubble}"]`) as HTMLElement;
        if (bubble) {
          const x = Math.round(data.x - data.baseSize / 2);
          const y = Math.round(data.y - data.baseSize / 2);
          bubble.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }
    }
  }, [draggedBubble]);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
    setDraggedBubble(null);
    setTimeout(() => { isDraggingRef.current = false; }, 50);
  }, []);

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
  }, [draggedBubble, handleDragMove, handleDragEnd]);

  const maxAccessCount = Math.max(...bookmarks.map(b => b.accessCount), 1);

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount);
        const isDragging = draggedBubble === bookmark.id;
        
        return (
          <div
            key={bookmark.id}
            data-bubble-id={bookmark.id}
            className="bubble absolute cursor-pointer group select-none"
            style={{
              left: 0,
              top: 0,
              transform: `translate3d(${Math.round(bookmark.x)}px, ${Math.round(bookmark.y)}px, 0)`,
              width: `${heatStyles.size}px`,
              height: `${heatStyles.size}px`,
              zIndex: isDragging ? 30 : 10,
              willChange: 'transform',
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
  );
};
