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
  const saturation = 50 + (heat * 20);
  const lightness = 55 - (heat * 5);
  const minSize = 35;
  const maxSize = 65;
  const size = Math.round(minSize + (heat * (maxSize - minSize)));
  
  // Soft, translucent bubble style like cryptobubbles
  const baseColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.25)`;
  const borderColor = `hsla(${hue}, ${saturation}%, ${lightness + 10}%, 0.5)`;
  const glowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.35)`;
  const innerGlow = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.15)`;
  
  return {
    background: baseColor,
    border: borderColor,
    glow: glowColor,
    innerGlow,
    hue,
    saturation,
    lightness,
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
        // Create unique random seed for each bubble
        const seed = Math.random() * 1000;
        bubbleDataRef.current.set(bookmark.id, {
          x: bookmark.x,
          y: Math.max(bookmark.y, headerHeight + 50),
          vx: 0,
          vy: 0,
          baseSize: heatStyles.size,
          // Unique seed for noise-like movement
          seed,
          // Time offset so bubbles don't sync
          timeOffset: Math.random() * 10000,
          // Unique movement characteristics
          wanderStrength: 0.015 + Math.random() * 0.01,
          wanderSpeed: 0.0003 + Math.random() * 0.0002,
          // Target position for smooth wandering
          targetX: bookmark.x,
          targetY: Math.max(bookmark.y, headerHeight + 50),
          // Time until next target change
          nextTargetTime: 0,
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
    const targetFPS = 60;
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

          const time = timestamp + data.timeOffset;
          const radius = data.baseSize / 2;
          
          // Check if it's time to pick a new wander target
          if (time > data.nextTargetTime) {
            // Pick a new random target within bounds
            const padding = radius + 40;
            data.targetX = padding + Math.random() * (canvasWidth - padding * 2);
            data.targetY = headerHeight + padding + Math.random() * (canvasHeight - headerHeight - padding * 2);
            // Next target change in 3-8 seconds
            data.nextTargetTime = time + 3000 + Math.random() * 5000;
          }
          
          // Calculate direction to target
          const dx = data.targetX - data.x;
          const dy = data.targetY - data.y;
          const distToTarget = Math.sqrt(dx * dx + dy * dy);
          
          // Normalize and apply gentle force toward target
          if (distToTarget > 1) {
            const forceStrength = data.wanderStrength;
            data.vx += (dx / distToTarget) * forceStrength;
            data.vy += (dy / distToTarget) * forceStrength;
          }
          
          // Add subtle organic wobble using smooth noise-like motion
          const wobbleTime = time * data.wanderSpeed;
          const wobbleX = Math.sin(wobbleTime * 1.1 + data.seed) * 0.008 + 
                         Math.sin(wobbleTime * 0.7 + data.seed * 2) * 0.005;
          const wobbleY = Math.cos(wobbleTime * 0.9 + data.seed) * 0.008 + 
                         Math.cos(wobbleTime * 1.3 + data.seed * 3) * 0.005;
          
          data.vx += wobbleX;
          data.vy += wobbleY;

          // Apply velocity
          data.x += data.vx;
          data.y += data.vy;

          // Soft boundary - gently steer away from edges
          const margin = 30;
          
          if (data.x < radius + margin) {
            data.vx += 0.02;
          } else if (data.x > canvasWidth - radius - margin) {
            data.vx -= 0.02;
          }
          
          if (data.y < headerHeight + radius + margin) {
            data.vy += 0.02;
          } else if (data.y > canvasHeight - radius - margin) {
            data.vy -= 0.02;
          }

          // Keep within bounds
          data.x = Math.max(radius, Math.min(canvasWidth - radius, data.x));
          data.y = Math.max(headerHeight + radius, Math.min(canvasHeight - radius, data.y));

          // Smooth damping for natural deceleration
          data.vx *= 0.985;
          data.vy *= 0.985;

          // Gentle velocity cap
          const maxV = 0.8;
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
              // Gently separate bubbles (no sudden jumps)
              const overlap = minDistance - distance;
              const nx = dx / distance;
              const ny = dy / distance;
              
              // Very gradual separation to avoid jerky movement
              const separationForce = overlap * 0.02;

              data1.vx -= nx * separationForce;
              data1.vy -= ny * separationForce;
              data2.vx += nx * separationForce;
              data2.vy += ny * separationForce;
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
            {/* Soft bubble with multiple layers for depth */}
            <div
              className="w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${heatStyles.innerGlow}, transparent 50%), ${heatStyles.background}`,
                border: `2px solid ${heatStyles.border}`,
                boxShadow: `
                  0 0 20px ${heatStyles.glow},
                  0 0 40px ${heatStyles.glow},
                  inset 0 0 20px ${heatStyles.innerGlow}
                `,
                backdropFilter: 'blur(2px)',
              }}
              onClick={() => handleBubbleClick(bookmark)}
            >
              {/* Inner highlight for 3D effect */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 60% 40% at 35% 25%, hsla(${heatStyles.hue}, ${heatStyles.saturation}%, 90%, 0.2), transparent 50%)`,
                }}
              />
              <img
                src={bookmark.favicon}
                alt={bookmark.title}
                className="w-6 h-6 rounded pointer-events-none opacity-90 relative z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                }}
              />
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <ExternalLink className="w-3 h-3 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
