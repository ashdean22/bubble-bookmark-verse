import { useEffect, useRef, useState, useCallback } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink } from 'lucide-react';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
  currentSubscription?: string | null;
}

const getHeatStylesAndSize = (accessCount: number, maxAccess: number, isMobile: boolean, isTablet: boolean) => {
  const heat = maxAccess > 0 ? Math.min(accessCount / maxAccess, 1) : 0;
  const hue = 210 - (heat * 210);
  const saturation = 65 + (heat * 15);
  const lightness = 50 - (heat * 10);
  
  // Responsive bubble sizes
  let minSize = 50;
  let maxSize = 90;
  
  if (isMobile) {
    minSize = 38;
    maxSize = 65;
  } else if (isTablet) {
    minSize = 45;
    maxSize = 78;
  }
  
  const size = Math.round(minSize + (heat * (maxSize - minSize)));
  
  // Realistic bubble colors with transparency and depth
  const baseColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;
  const borderColor = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.5)`;
  const glowColor = `hsla(${hue}, ${saturation}%, ${lightness + 30}%, 0.4)`;
  const highlightColor = `hsla(${hue}, ${saturation - 20}%, ${lightness + 40}%, 0.9)`;
  const innerShadowColor = `hsla(${hue}, ${saturation}%, ${lightness - 20}%, 0.3)`;
  
  return {
    background: baseColor,
    border: borderColor,
    glow: glowColor,
    highlight: highlightColor,
    innerShadow: innerShadowColor,
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
  const [previewBubble, setPreviewBubble] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const bubbleDataRef = useRef<Map<string, any>>(new Map());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize bubble data
  useEffect(() => {
    const maxAccessCount = Math.max(...bookmarks.map(b => b.accessCount), 1);
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    const headerHeight = isMobile ? 120 : 100;

    bookmarks.forEach((bookmark, index) => {
      if (!bubbleDataRef.current.has(bookmark.id)) {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount, isMobile, isTablet);
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
        // Unique movement characteristics - faster movement
        wanderStrength: 0.008 + Math.random() * 0.004,
        wanderSpeed: 0.0003 + Math.random() * 0.0002,
        // Target position for smooth wandering
        targetX: bookmark.x,
        targetY: Math.max(bookmark.y, headerHeight + 50),
        // Time until next target change
        nextTargetTime: 0,
        // Smoothed display position (for lerp rendering)
        displayX: bookmark.x,
        displayY: Math.max(bookmark.y, headerHeight + 50),
        // Previous velocities for smoothing
        prevVx: 0,
        prevVy: 0,
        // Acceleration smoothing
        ax: 0,
        ay: 0,
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
          
          // Check if it's time to pick a new wander target (longer intervals for slower movement)
          if (time > data.nextTargetTime) {
            const padding = radius + 60;
            data.targetX = padding + Math.random() * (canvasWidth - padding * 2);
            data.targetY = headerHeight + padding + Math.random() * (canvasHeight - headerHeight - padding * 2);
            // Next target change in 3-6 seconds for faster wandering
            data.nextTargetTime = time + 3000 + Math.random() * 3000;
          }
          
          // Calculate direction to target
          const dx = data.targetX - data.x;
          const dy = data.targetY - data.y;
          const distToTarget = Math.sqrt(dx * dx + dy * dy);
          
          // Very gentle force toward target with acceleration smoothing
          let targetAx = 0;
          let targetAy = 0;
          
          if (distToTarget > 1) {
            const forceStrength = data.wanderStrength * 0.5;
            targetAx = (dx / distToTarget) * forceStrength;
            targetAy = (dy / distToTarget) * forceStrength;
          }
          
          // Smooth acceleration (lerp toward target acceleration)
          data.ax = data.ax * 0.95 + targetAx * 0.05;
          data.ay = data.ay * 0.95 + targetAy * 0.05;
          
          // Apply smoothed acceleration to velocity
          data.vx += data.ax;
          data.vy += data.ay;
          
          // Add very subtle organic wobble using multiple sine waves
          const wobbleTime = time * data.wanderSpeed;
          const wobbleX = Math.sin(wobbleTime * 0.7 + data.seed) * 0.002 + 
                         Math.sin(wobbleTime * 0.3 + data.seed * 2.1) * 0.001 +
                         Math.sin(wobbleTime * 0.13 + data.seed * 3.7) * 0.0005;
          const wobbleY = Math.cos(wobbleTime * 0.5 + data.seed) * 0.002 + 
                         Math.cos(wobbleTime * 0.23 + data.seed * 2.9) * 0.001 +
                         Math.cos(wobbleTime * 0.11 + data.seed * 4.1) * 0.0005;
          
          data.vx += wobbleX;
          data.vy += wobbleY;
          
          // Smooth velocity (average with previous)
          const smoothVx = data.vx * 0.7 + data.prevVx * 0.3;
          const smoothVy = data.vy * 0.7 + data.prevVy * 0.3;
          data.prevVx = data.vx;
          data.prevVy = data.vy;
          data.vx = smoothVx;
          data.vy = smoothVy;

          // Apply velocity
          data.x += data.vx;
          data.y += data.vy;

          // Very soft boundary steering
          const margin = 50;
          const boundaryForce = 0.005;
          
          if (data.x < radius + margin) {
            data.vx += boundaryForce;
          } else if (data.x > canvasWidth - radius - margin) {
            data.vx -= boundaryForce;
          }
          
          if (data.y < headerHeight + radius + margin) {
            data.vy += boundaryForce;
          } else if (data.y > canvasHeight - radius - margin) {
            data.vy -= boundaryForce;
          }

          // Keep within bounds
          data.x = Math.max(radius, Math.min(canvasWidth - radius, data.x));
          data.y = Math.max(headerHeight + radius, Math.min(canvasHeight - radius, data.y));

          // Smooth damping
          data.vx *= 0.985;
          data.vy *= 0.985;

          // Faster velocity cap
          const maxV = 1.0;
          const speed = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
          if (speed > maxV) {
            const scale = maxV / speed;
            data.vx *= scale;
            data.vy *= scale;
          }
          
          // Lerp display position toward actual position (smooths rendering)
          const lerpFactor = 0.15;
          data.displayX = data.displayX + (data.x - data.displayX) * lerpFactor;
          data.displayY = data.displayY + (data.y - data.displayY) * lerpFactor;
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
              // Very gentle separation to avoid jerky movement
              const overlap = minDistance - distance;
              const nx = dx / distance;
              const ny = dy / distance;
              
              // Extremely gradual separation force
              const separationForce = overlap * 0.001;

              data1.ax -= nx * separationForce;
              data1.ay -= ny * separationForce;
              data2.ax += nx * separationForce;
              data2.ay += ny * separationForce;
            }
          }
        }

        // Update DOM for all bubbles using smoothed display positions (no rounding for sub-pixel smoothness)
        bubbleIds.forEach((id) => {
          const data = bubbleDataRef.current.get(id);
          if (!data) return;
          
          const el = canvas.querySelector(`[data-bubble-id="${id}"]`) as HTMLElement;
          if (el) {
            // Use displayX/displayY for lerped smooth rendering, no rounding for sub-pixel precision
            const x = data.displayX - data.baseSize / 2;
            const y = data.displayY - data.baseSize / 2;
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

    // Long-press to show URL preview (touch only)
    if ('touches' in e) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setPreviewBubble(bookmarkId);
          setTimeout(() => setPreviewBubble(null), 3000);
        }
      }, 500);
    }
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
      // Cancel long-press if user starts dragging
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      setPreviewBubble(null);
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
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setTimeout(() => {
      isDraggingRef.current = false;
      setPreviewBubble(null);
    }, 50);
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount, isMobile, isTablet);
        const isDragging = draggedBubble === bookmark.id;
        const isPreview = previewBubble === bookmark.id;
        
        // Get clean display name: title or hostname
        let displayName = bookmark.title;
        try {
          const hostname = new URL(bookmark.url).hostname.replace(/^www\./, '');
          if (!displayName || displayName.length > 30) displayName = hostname;
        } catch { /* keep title */ }
        
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
              zIndex: isDragging ? 30 : isPreview ? 25 : 10,
              willChange: 'transform',
            }}
            onMouseDown={(e) => handleDragStart(e, bookmark.id)}
            onTouchStart={(e) => handleDragStart(e, bookmark.id)}
          >
            {/* URL preview tooltip on long press */}
            {isPreview && (
              <div
                className="absolute pointer-events-none select-none"
                style={{
                  bottom: `calc(100% + 10px)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 50,
                  animation: 'fadeInUp 0.18s ease-out',
                }}
              >
                <div
                  style={{
                    background: 'hsla(220, 20%, 12%, 0.92)',
                    border: '1px solid hsla(210, 60%, 70%, 0.3)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '10px',
                    padding: '6px 10px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 20px hsla(0,0%,0%,0.35)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img
                      src={bookmark.favicon}
                      alt=""
                      style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span style={{ color: 'hsla(210, 80%, 90%, 1)', fontSize: 12, fontWeight: 500, letterSpacing: '0.01em' }}>
                      {displayName}
                    </span>
                  </div>
                  {/* Arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -5,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 10,
                      height: 10,
                      background: 'hsla(220, 20%, 12%, 0.92)',
                      border: '1px solid hsla(210, 60%, 70%, 0.3)',
                      borderTop: 'none',
                      borderLeft: 'none',
                      rotate: '45deg',
                    }}
                  />
                </div>
              </div>
            )}
            {/* Realistic bubble with depth and reflections */}
            <div
              className="w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                background: `radial-gradient(ellipse 60% 40% at 30% 25%, ${heatStyles.highlight}, transparent 50%),
                             radial-gradient(ellipse 80% 80% at 50% 50%, ${heatStyles.background}, transparent 90%),
                             radial-gradient(ellipse 100% 100% at 50% 60%, ${heatStyles.innerShadow}, transparent 70%)`,
                border: `1.5px solid ${heatStyles.border}`,
                boxShadow: `
                  0 8px 32px hsla(${heatStyles.hue}, ${heatStyles.saturation}%, 30%, 0.25),
                  0 0 20px ${heatStyles.glow},
                  inset 0 -8px 20px ${heatStyles.innerShadow},
                  inset 0 4px 12px hsla(0, 0%, 100%, 0.15)
                `,
                backdropFilter: 'blur(2px)',
              }}
              onClick={() => handleBubbleClick(bookmark)}
            >
              {/* Light reflection highlight */}
              <div 
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '40%',
                  height: '25%',
                  top: '12%',
                  left: '18%',
                  background: 'linear-gradient(180deg, hsla(0, 0%, 100%, 0.6) 0%, hsla(0, 0%, 100%, 0) 100%)',
                  borderRadius: '50%',
                  transform: 'rotate(-15deg)',
                }}
              />
              {/* Secondary smaller highlight */}
              <div 
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '15%',
                  height: '10%',
                  top: '22%',
                  left: '55%',
                  background: 'hsla(0, 0%, 100%, 0.4)',
                  borderRadius: '50%',
                }}
              />
              <img
                src={bookmark.favicon}
                alt={bookmark.title}
                className="w-6 h-6 rounded pointer-events-none relative z-10 drop-shadow-md"
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
