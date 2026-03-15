import { useEffect, useRef, useState, useCallback } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  currentSubscription?: string | null;
}

const getHeatStylesAndSize = (accessCount: number, maxAccess: number, isMobile: boolean, isTablet: boolean) => {
  const heat = maxAccess > 0 ? Math.min(accessCount / maxAccess, 1) : 0;
  const hue = 210 - (heat * 210);
  const saturation = 65 + (heat * 15);
  const lightness = 50 - (heat * 10);
  
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

/** Build a unique physics personality for each bubble so they can NEVER drift into sync. */
const createBubblePersonality = () => {
  const r = () => Math.random();

  // Three completely independent noise octaves per axis — each with its own
  // frequency, amplitude, and phase offset so no two bubbles share a harmonic.
  return {
    // Wander target refresh — spread across 2 s – 9 s
    minTargetInterval: 2000 + r() * 2000,
    maxTargetExtraInterval: 1500 + r() * 5500,

    // Steering force to target (uniquely strong/weak per bubble)
    wanderStrength: 0.004 + r() * 0.010,

    // Acceleration smoothing ratio (0.85 – 0.98) — affects how "laggy" steering feels
    accelSmoothing: 0.85 + r() * 0.13,
    accelBlend: 0.02 + r() * 0.08,

    // Velocity smoothing ratio (0.60 – 0.85) — affects "weight" of the bubble
    velSmoothing: 0.60 + r() * 0.25,

    // Damping per frame — slight variation in "drag"
    damping: 0.980 + r() * 0.010,

    // Max speed — some bubbles are sprinters, some are lazy drifters
    maxSpeed: 0.4 + r() * 0.9,

    // Display lerp — affects how snappy the visual follows physics
    lerpFactor: 0.08 + r() * 0.14,

    // --- Octave 1: slow, large-amplitude drift ---
    oct1FreqX: 0.00008 + r() * 0.00018,
    oct1FreqY: 0.00008 + r() * 0.00018,
    oct1AmpX:  0.0010 + r() * 0.0020,
    oct1AmpY:  0.0010 + r() * 0.0020,
    oct1PhaseX: r() * Math.PI * 2,
    oct1PhaseY: r() * Math.PI * 2,

    // --- Octave 2: medium frequency micro-drift ---
    oct2FreqX: 0.00025 + r() * 0.00045,
    oct2FreqY: 0.00025 + r() * 0.00045,
    oct2AmpX:  0.0006 + r() * 0.0012,
    oct2AmpY:  0.0006 + r() * 0.0012,
    oct2PhaseX: r() * Math.PI * 2,
    oct2PhaseY: r() * Math.PI * 2,

    // --- Octave 3: high-frequency flutter (very subtle) ---
    oct3FreqX: 0.00080 + r() * 0.00140,
    oct3FreqY: 0.00080 + r() * 0.00140,
    oct3AmpX:  0.0002 + r() * 0.0005,
    oct3AmpY:  0.0002 + r() * 0.0005,
    oct3PhaseX: r() * Math.PI * 2,
    oct3PhaseY: r() * Math.PI * 2,

    // Independent time offset so timestamp-based cycles start out of phase
    timeOffset: r() * 999983,  // large prime-ish multiplier
  };
};

interface ContextMenu {
  bookmarkId: string;
  x: number;
  y: number;
}

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick, onEditBookmark, currentSubscription }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
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

    bookmarks.forEach((bookmark) => {
      if (!bubbleDataRef.current.has(bookmark.id)) {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount, isMobile, isTablet);
        const p = createBubblePersonality();

        bubbleDataRef.current.set(bookmark.id, {
          x: bookmark.x,
          y: Math.max(bookmark.y, headerHeight + 50),
          vx: 0,
          vy: 0,
          baseSize: heatStyles.size,
          // Physics personality — unique per bubble, never shared
          ...p,
          targetX: bookmark.x,
          targetY: Math.max(bookmark.y, headerHeight + 50),
          nextTargetTime: 0,
          displayX: bookmark.x,
          displayY: Math.max(bookmark.y, headerHeight + 50),
          prevVx: 0,
          prevVy: 0,
          ax: 0,
          ay: 0,
        });
      }
    });

    const currentIds = new Set(bookmarks.map(b => b.id));
    bubbleDataRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        bubbleDataRef.current.delete(id);
      }
    });
  }, [bookmarks]);

  // Animation loop
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

        const bubbleIds = Array.from(bubbleDataRef.current.keys());
        
        bubbleIds.forEach((id) => {
          const d = bubbleDataRef.current.get(id);
          if (!d || draggedBubble === id) return;

          // Each bubble uses its own time stream — impossible to sync
          const t = timestamp + d.timeOffset;
          const radius = d.baseSize / 2;
          
          // Pick a new wander target using this bubble's personal interval
          if (t > d.nextTargetTime) {
            const padding = radius + 60;
            d.targetX = padding + Math.random() * (canvasWidth - padding * 2);
            d.targetY = headerHeight + padding + Math.random() * (canvasHeight - headerHeight - padding * 2);
            d.nextTargetTime = t + d.minTargetInterval + Math.random() * d.maxTargetExtraInterval;
          }
          
          // Steering toward target using this bubble's unique strength
          const dx = d.targetX - d.x;
          const dy = d.targetY - d.y;
          const distToTarget = Math.sqrt(dx * dx + dy * dy);
          
          let targetAx = 0;
          let targetAy = 0;
          
          if (distToTarget > 1) {
            const forceStrength = d.wanderStrength * 0.5;
            targetAx = (dx / distToTarget) * forceStrength;
            targetAy = (dy / distToTarget) * forceStrength;
          }
          
          // Acceleration smoothing — unique ratio per bubble
          d.ax = d.ax * d.accelSmoothing + targetAx * d.accelBlend;
          d.ay = d.ay * d.accelSmoothing + targetAy * d.accelBlend;
          
          d.vx += d.ax;
          d.vy += d.ay;
          
          // Three independent noise octaves, each with unique frequency & phase
          const wobbleX =
            Math.sin(t * d.oct1FreqX + d.oct1PhaseX) * d.oct1AmpX +
            Math.sin(t * d.oct2FreqX + d.oct2PhaseX) * d.oct2AmpX +
            Math.sin(t * d.oct3FreqX + d.oct3PhaseX) * d.oct3AmpX;

          const wobbleY =
            Math.cos(t * d.oct1FreqY + d.oct1PhaseY) * d.oct1AmpY +
            Math.cos(t * d.oct2FreqY + d.oct2PhaseY) * d.oct2AmpY +
            Math.cos(t * d.oct3FreqY + d.oct3PhaseY) * d.oct3AmpY;
          
          d.vx += wobbleX;
          d.vy += wobbleY;
          
          // Velocity smoothing — each bubble feels a different "weight"
          const smoothVx = d.vx * d.velSmoothing + d.prevVx * (1 - d.velSmoothing);
          const smoothVy = d.vy * d.velSmoothing + d.prevVy * (1 - d.velSmoothing);
          d.prevVx = d.vx;
          d.prevVy = d.vy;
          d.vx = smoothVx;
          d.vy = smoothVy;

          d.x += d.vx;
          d.y += d.vy;

          // Soft boundary repulsion
          const margin = 50;
          const boundaryForce = 0.005;
          if (d.x < radius + margin) d.vx += boundaryForce;
          else if (d.x > canvasWidth - radius - margin) d.vx -= boundaryForce;
          if (d.y < headerHeight + radius + margin) d.vy += boundaryForce;
          else if (d.y > canvasHeight - radius - margin) d.vy -= boundaryForce;

          // Hard clamp
          d.x = Math.max(radius, Math.min(canvasWidth - radius, d.x));
          d.y = Math.max(headerHeight + radius, Math.min(canvasHeight - radius, d.y));

          // Unique drag per bubble
          d.vx *= d.damping;
          d.vy *= d.damping;

          // Unique max speed per bubble
          const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
          if (speed > d.maxSpeed) {
            const scale = d.maxSpeed / speed;
            d.vx *= scale;
            d.vy *= scale;
          }
          
          // Unique display lerp — visual snappiness varies per bubble
          d.displayX += (d.x - d.displayX) * d.lerpFactor;
          d.displayY += (d.y - d.displayY) * d.lerpFactor;
        });

        // Collision detection
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
              const overlap = minDistance - distance;
              const nx = dx / distance;
              const ny = dy / distance;
              const separationForce = overlap * 0.0003;

              data1.ax -= nx * separationForce;
              data1.ay -= ny * separationForce;
              data2.ax += nx * separationForce;
              data2.ay += ny * separationForce;
            }
          }
        }

        // Update DOM
        bubbleIds.forEach((id) => {
          const data = bubbleDataRef.current.get(id);
          if (!data) return;
          
          const el = canvas.querySelector(`[data-bubble-id="${id}"]`) as HTMLElement;
          if (el) {
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

  // Close context menu on outside click or after 3s
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const timer = setTimeout(close, 3000);
    document.addEventListener('click', close);
    document.addEventListener('touchstart', close);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
      document.removeEventListener('touchstart', close);
    };
  }, [contextMenu]);

  const clearLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleBubbleClick = (bookmark: Bookmark) => {
    if (!isDraggingRef.current) {
      setClickedBubble(bookmark.id);
      onBubbleClick(bookmark.id);
      setTimeout(() => setClickedBubble(null), 150);
      window.open(bookmark.url, '_blank');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, bookmarkId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ bookmarkId, x: e.clientX, y: e.clientY });
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, bookmarkId: string) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };

    const bubble = e.currentTarget as HTMLElement;
    const rect = bubble.getBoundingClientRect();
    dragOffsetRef.current = { x: clientX - rect.left, y: clientY - rect.top };
    isDraggingRef.current = false;

    // Touch: 3s hold → show URL + edit/delete menu
    if ('touches' in e) {
      clearLongPress();
      longPressTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setContextMenu({ bookmarkId, x: clientX, y: clientY });
        }
      }, 3000);
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
      clearLongPress();
      setContextMenu(null);
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
    clearLongPress();
    setTimeout(() => {
      isDraggingRef.current = false;
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

  const contextBookmark = contextMenu ? bookmarks.find(b => b.id === contextMenu.bookmarkId) : null;

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount, isMobile, isTablet);
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
            onContextMenu={(e) => handleContextMenu(e, bookmark.id)}
          >
            {/* Realistic bubble */}
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

      {/* Context menu (3s touch hold / right-click) */}
      {contextMenu && contextBookmark && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-10 select-none"
          onClick={() => setContextMenu(null)}
          onTouchStart={() => setContextMenu(null)}
        >
          <div
            style={{
              background: 'hsla(220, 20%, 10%, 0.97)',
              border: '1px solid hsla(210, 60%, 60%, 0.25)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '8px',
              width: '260px',
              boxShadow: '0 16px 48px hsla(0,0%,0%,0.6)',
              animation: 'fadeInUp 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Site info header */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid hsla(210, 60%, 60%, 0.15)',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <img
                  src={contextBookmark.favicon}
                  alt=""
                  style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span style={{ color: 'hsla(210, 80%, 90%, 1)', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {contextBookmark.title}
                </span>
              </div>
              <div style={{ color: 'hsla(210, 50%, 65%, 0.85)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 26 }}>
                {contextBookmark.url}
              </div>
            </div>
            {/* Edit */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
              style={{ color: 'hsla(210, 80%, 85%, 1)', fontSize: 15 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsla(210, 60%, 50%, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onTouchStart={(e) => { e.currentTarget.style.background = 'hsla(210, 60%, 50%, 0.2)'; e.stopPropagation(); }}
              onTouchEnd={(e) => { e.currentTarget.style.background = 'transparent'; }}
              onClick={() => { setContextMenu(null); onEditBookmark(contextBookmark); }}
            >
              <Pencil style={{ width: 16, height: 16, flexShrink: 0 }} />
              Edit bubble
            </button>
            {/* Delete */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
              style={{ color: 'hsla(0, 80%, 70%, 1)', fontSize: 15 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsla(0, 60%, 50%, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onTouchStart={(e) => { e.currentTarget.style.background = 'hsla(0, 60%, 50%, 0.2)'; e.stopPropagation(); }}
              onTouchEnd={(e) => { e.currentTarget.style.background = 'transparent'; }}
              onClick={() => { setContextMenu(null); onRemoveBookmark(contextBookmark.id); }}
            >
              <Trash2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              Delete bubble
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
