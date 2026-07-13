import { useEffect, useRef, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
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

interface ContextMenu {
  bookmarkId: string;
  x: number;
  y: number;
}

interface BubblePhysicsData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  seed: number;
  timeOffset: number;
  wanderSpeed: number;
  wanderStrength: number;
  targetInterval: number;
  targetX: number;
  targetY: number;
  nextTargetTime: number;
  displayX: number;
  displayY: number;
  prevVx: number;
  prevVy: number;
  ax: number;
  ay: number;
}

const getMaxAccessCount = (bookmarks: Bookmark[]) =>
  bookmarks.reduce((max, bookmark) => Math.max(max, Number.isFinite(bookmark.accessCount) ? bookmark.accessCount : 0), 1);

const finiteOr = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick, onEditBookmark, currentSubscription }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const bubbleElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [poppingIds, setPoppingIds] = useState<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const frameCountRef = useRef(0);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const bubbleDataRef = useRef<Map<string, BubblePhysicsData>>(new Map());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotionRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Initialize bubble data
  useEffect(() => {
    const maxAccessCount = getMaxAccessCount(bookmarks);
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    const headerHeight = isMobile ? 120 : 100;

    bookmarks.forEach((bookmark) => {
      if (!bubbleDataRef.current.has(bookmark.id)) {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount, isMobile, isTablet);

        // Each bubble gets fully unique seeds and timing so they NEVER sync
        // wanderSpeed range deliberately spread wide: 0.0002–0.0008 (vs original 0.0003–0.0005)
        // seed values are large and coprime-spaced so no two bubbles share a harmonic
        // Each bubble gets unique seeds + timing so movement never syncs.
        // Slower, wider-varied parameters produce a more organic, "floating" feel.
        const seed = Math.random() * 10000;
        const timeOffset = Math.random() * 100000;
        const wanderSpeed = 0.00012 + Math.random() * 0.00045;   // slower, more drift-like
        const wanderStrength = 0.005 + Math.random() * 0.007;    // varied steering force
        const targetInterval = 5000 + Math.random() * 9000;      // 5–14s wander cadence

        bubbleDataRef.current.set(bookmark.id, {
          x: finiteOr(bookmark.x, 80),
          y: Math.max(finiteOr(bookmark.y, headerHeight + 80), headerHeight + 50),
          vx: 0,
          vy: 0,
          baseSize: heatStyles.size,
          seed,
          timeOffset,
          wanderSpeed,
          wanderStrength,
          targetInterval,
          targetX: finiteOr(bookmark.x, 80),
          targetY: Math.max(finiteOr(bookmark.y, headerHeight + 80), headerHeight + 50),
          nextTargetTime: 0,
          displayX: finiteOr(bookmark.x, 80),
          displayY: Math.max(finiteOr(bookmark.y, headerHeight + 80), headerHeight + 50),
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
    bubbleElementsRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        bubbleElementsRef.current.delete(id);
      }
    });
  }, [bookmarks]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bookmarks.length === 0 || prefersReducedMotionRef.current) return;

    const headerHeight = window.innerWidth < 640 ? 120 : 100;
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - lastTime;
      
      if (elapsed >= frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval);
        
        const canvasWidth = Math.max(canvas.clientWidth, 320);
        const canvasHeight = Math.max(canvas.clientHeight, 480);

        const bubbleIds = Array.from(bubbleDataRef.current.keys());
        
        bubbleIds.forEach((id) => {
          const d = bubbleDataRef.current.get(id);
          if (!d || draggedBubble === id) return;

          // Each bubble uses its own private time stream — makes sync impossible
          const time = timestamp + d.timeOffset;
          const radius = d.baseSize / 2;
          
          // Pick next wander target on this bubble's personal cadence
          if (time > d.nextTargetTime) {
            const padding = radius + 60;
            const travelWidth = Math.max(1, canvasWidth - padding * 2);
            const travelHeight = Math.max(1, canvasHeight - headerHeight - padding * 2);
            d.targetX = padding + Math.random() * travelWidth;
            d.targetY = headerHeight + padding + Math.random() * travelHeight;
            d.nextTargetTime = time + d.targetInterval;
          }
          
          // Steering force — eased so bubbles glide toward their target
          // instead of snapping. Distance attenuation gives them a soft
          // "arrival" so they don't overshoot.
          const dx = d.targetX - d.x;
          const dy = d.targetY - d.y;
          const distToTarget = Math.sqrt(dx * dx + dy * dy);

          let targetAx = 0;
          let targetAy = 0;
          if (distToTarget > 1) {
            const arrival = Math.min(1, distToTarget / 180); // ease in last ~180px
            const forceStrength = d.wanderStrength * 0.35 * arrival;
            targetAx = (dx / distToTarget) * forceStrength;
            targetAy = (dy / distToTarget) * forceStrength;
          }

          // Heavier acceleration smoothing → no jitter, slow direction changes
          d.ax = d.ax * 0.97 + targetAx * 0.03;
          d.ay = d.ay * 0.97 + targetAy * 0.03;

          d.vx += d.ax;
          d.vy += d.ay;

          // Multi-octave wobble for organic, perlin-like drift.
          // Includes a tiny curl (perpendicular) component so paths gently
          // arc instead of moving in straight lines.
          const wobbleTime = time * d.wanderSpeed;
          const wobbleX = Math.sin(wobbleTime * 0.7  + d.seed)       * 0.0028 +
                          Math.sin(wobbleTime * 0.3  + d.seed * 2.1) * 0.0014 +
                          Math.sin(wobbleTime * 0.13 + d.seed * 3.7) * 0.0007;
          const wobbleY = Math.cos(wobbleTime * 0.5  + d.seed)       * 0.0028 +
                          Math.cos(wobbleTime * 0.23 + d.seed * 2.9) * 0.0014 +
                          Math.cos(wobbleTime * 0.11 + d.seed * 4.1) * 0.0007;

          // Curl noise: rotate a slow sine by 90° to nudge the bubble sideways
          // relative to its current heading → arcing, swimming-like paths.
          const curl = Math.sin(wobbleTime * 0.17 + d.seed * 1.3) * 0.0015;
          const speedNow = Math.sqrt(d.vx * d.vx + d.vy * d.vy) || 0.0001;
          const curlX = (-d.vy / speedNow) * curl;
          const curlY = ( d.vx / speedNow) * curl;

          d.vx += wobbleX + curlX;
          d.vy += wobbleY + curlY;
          
          // Velocity smoothing — light blend so collision impulses stay
          // visible (natural bounce) instead of being averaged away.
          const smoothVx = d.vx * 0.85 + d.prevVx * 0.15;
          const smoothVy = d.vy * 0.85 + d.prevVy * 0.15;
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
          d.x = Math.max(radius, Math.min(canvasWidth - radius, finiteOr(d.x, radius)));
          d.y = Math.max(headerHeight + radius, Math.min(canvasHeight - radius, finiteOr(d.y, headerHeight + radius)));

          // Light damping → bounces decay naturally instead of dying instantly,
          // giving the cryptobubbles-style springy settle.
          d.vx *= 0.992;
          d.vy *= 0.992;

          const maxV = 2.2;
          const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
          if (speed > maxV) {
            const scale = maxV / speed;
            d.vx *= scale;
            d.vy *= scale;
          }
          
          // Snappier display lerp so bounces read crisply on screen.
          d.displayX += (d.x - d.displayX) * 0.35;
          d.displayY += (d.y - d.displayY) * 0.35;
        });

        frameCountRef.current += 1;
        const shouldRunCollisions = bubbleIds.length <= 220;
        const collisionStep = bubbleIds.length > 120 ? 4 : bubbleIds.length > 70 ? 2 : 1;
        if (shouldRunCollisions && frameCountRef.current % collisionStep === 0) {
          const cellSize = 110;
          const grid = new Map<string, string[]>();
          bubbleIds.forEach((id) => {
            const data = bubbleDataRef.current.get(id);
            if (!data || draggedBubble === id) return;
            const gx = Math.floor(data.x / cellSize);
            const gy = Math.floor(data.y / cellSize);
            const key = `${gx},${gy}`;
            const bucket = grid.get(key);
            if (bucket) bucket.push(id);
            else grid.set(key, [id]);
          });

          const testedPairs = new Set<string>();
          bubbleIds.forEach((id1) => {
            const data1 = bubbleDataRef.current.get(id1);
            if (!data1 || draggedBubble === id1) return;
            const gx = Math.floor(data1.x / cellSize);
            const gy = Math.floor(data1.y / cellSize);

            for (let ox = -1; ox <= 1; ox++) {
              for (let oy = -1; oy <= 1; oy++) {
                const neighbors = grid.get(`${gx + ox},${gy + oy}`);
                if (!neighbors) continue;

                neighbors.forEach((id2) => {
                  if (id1 === id2 || draggedBubble === id2) return;
                  const pairKey = id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
                  if (testedPairs.has(pairKey)) return;
                  testedPairs.add(pairKey);

                  const data2 = bubbleDataRef.current.get(id2);
                  if (!data2) return;

                  const dx = data2.x - data1.x;
                  const dy = data2.y - data1.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const r1 = data1.baseSize / 2;
                  const r2 = data2.baseSize / 2;
                  const minDistance = r1 + r2;

                  if (distance < minDistance) {
                    const angle = distance > 0.001 ? 0 : (data1.seed - data2.seed);
                    const nx = distance > 0.001 ? dx / distance : Math.cos(angle);
                    const ny = distance > 0.001 ? dy / distance : Math.sin(angle);
                    const overlap = minDistance - distance;

                    // Mass proportional to area so larger bubbles push smaller ones more
                    const m1 = r1 * r1;
                    const m2 = r2 * r2;
                    const totalMass = m1 + m2;
                    const share1 = m2 / totalMass;
                    const share2 = m1 / totalMass;

                    // Positional correction split by mass
                    data1.x -= nx * overlap * share1;
                    data1.y -= ny * overlap * share1;
                    data2.x += nx * overlap * share2;
                    data2.y += ny * overlap * share2;

                    const vRelX = data2.vx - data1.vx;
                    const vRelY = data2.vy - data1.vy;
                    const vAlong = vRelX * nx + vRelY * ny;
                    if (vAlong < 0) {
                      // Slightly damped elastic bounce — feels springy and
                      // natural rather than perfectly rigid.
                      const restitution = 0.88;
                      const j = -(1 + restitution) * vAlong / totalMass;
                      data1.vx -= nx * j * m2;
                      data1.vy -= ny * j * m2;
                      data2.vx += nx * j * m1;
                      data2.vy += ny * j * m1;
                    } else {
                      // Static overlap (resting contact): nudge apart so they don't stick
                      const nudge = 0.08;
                      data1.vx -= nx * nudge;
                      data1.vy -= ny * nudge;
                      data2.vx += nx * nudge;
                      data2.vy += ny * nudge;
                    }
                  }
                });
              }
            }
          });
        }

        // Update DOM
        bubbleIds.forEach((id) => {
          const data = bubbleDataRef.current.get(id);
          if (!data) return;

          const el = bubbleElementsRef.current.get(id);
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

  // Wrap delete with a pop animation: mark as popping → wait for keyframes → really delete
  const popAndRemove = useCallback((bookmarkId: string) => {
    setPoppingIds(prev => {
      if (prev.has(bookmarkId)) return prev;
      const next = new Set(prev);
      next.add(bookmarkId);
      return next;
    });
    setTimeout(() => {
      onRemoveBookmark(bookmarkId);
      setPoppingIds(prev => {
        const next = new Set(prev);
        next.delete(bookmarkId);
        return next;
      });
    }, 450);
  }, [onRemoveBookmark]);

  const handleBubbleClick = (bookmark: Bookmark) => {
    if (!isDraggingRef.current) {
      setClickedBubble(bookmark.id);
      onBubbleClick(bookmark.id);
      setTimeout(() => setClickedBubble(null), 150);
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
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

  const maxAccessCount = getMaxAccessCount(bookmarks);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

  const contextBookmark = contextMenu ? bookmarks.find(b => b.id === contextMenu.bookmarkId) : null;

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => {
        const heatStyles = getHeatStylesAndSize(bookmark.accessCount, maxAccessCount, isMobile, isTablet);
        const isDragging = draggedBubble === bookmark.id;
        const isPopping = poppingIds.has(bookmark.id);
        
        return (
          <div
            key={bookmark.id}
            data-bubble-id={bookmark.id}
            ref={(node) => {
              if (node) bubbleElementsRef.current.set(bookmark.id, node);
              else bubbleElementsRef.current.delete(bookmark.id);
            }}
            className={`bubble absolute cursor-pointer group select-none${isPopping ? ' bubble-popping' : ''}`}
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
              className="bubble-shell w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                // Soap-bubble glass: mostly transparent film with faint prismatic tint,
                // heat-map hue kept as a very subtle wash so frequency is still legible.
                background: `
                  radial-gradient(ellipse 55% 40% at 30% 22%, hsla(0,0%,100%,0.55), transparent 55%),
                  radial-gradient(circle at 70% 78%, hsla(${heatStyles.hue}, 90%, 75%, 0.18), transparent 60%),
                  radial-gradient(circle at 50% 50%, hsla(${heatStyles.hue}, ${heatStyles.saturation}%, 70%, 0.08), hsla(0,0%,100%,0.04) 70%, transparent 100%)
                `,
                border: `1px solid hsla(0, 0%, 100%, 0.35)`,
                boxShadow: `
                  0 10px 28px hsla(${heatStyles.hue}, 40%, 20%, 0.28),
                  0 0 18px ${heatStyles.glow},
                  inset 0 -14px 28px hsla(${heatStyles.hue}, 60%, 40%, 0.18),
                  inset 0 6px 18px hsla(0, 0%, 100%, 0.35),
                  inset 0 0 0 1px hsla(0, 0%, 100%, 0.12)
                `,
                backdropFilter: 'blur(3px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(3px) saturate(1.3)',
              }}
              onClick={() => handleBubbleClick(bookmark)}
            >
              {/* #2 Iridescent rim — soap-film thin-film interference */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  padding: '2px',
                  background: `conic-gradient(from 0deg,
                    hsla(0,   95%, 75%, 0.9),
                    hsla(45,  95%, 75%, 0.9),
                    hsla(120, 85%, 75%, 0.9),
                    hsla(190, 95%, 75%, 0.9),
                    hsla(260, 90%, 80%, 0.9),
                    hsla(320, 95%, 80%, 0.9),
                    hsla(0,   95%, 75%, 0.9))`,
                  WebkitMask:
                    'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  animation: `iridescent-spin ${14 + (parseInt(bookmark.id.slice(-2), 36) % 10)}s linear infinite`,
                  mixBlendMode: 'screen',
                  opacity: 1,
                }}
              />
              {/* Broad prismatic sheen sweeping across the film */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `conic-gradient(from 210deg at 40% 40%,
                    hsla(300, 90%, 80%, 0.25),
                    hsla(200, 90%, 80%, 0.25),
                    hsla(150, 90%, 80%, 0.2),
                    hsla(50,  90%, 80%, 0.25),
                    hsla(340, 90%, 80%, 0.25),
                    hsla(300, 90%, 80%, 0.25))`,
                  mixBlendMode: 'screen',
                  opacity: 0.55,
                }}
              />
              {/* Light reflection highlight */}
              <div 
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '45%',
                  height: '28%',
                  top: '10%',
                  left: '16%',
                  background: 'linear-gradient(180deg, hsla(0, 0%, 100%, 0.9) 0%, hsla(0, 0%, 100%, 0) 100%)',
                  borderRadius: '50%',
                  transform: 'rotate(-18deg)',
                  filter: 'blur(1px)',
                }}
              />
              <div 
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '14%',
                  height: '10%',
                  top: '68%',
                  left: '58%',
                  background: 'hsla(0, 0%, 100%, 0.75)',
                  borderRadius: '50%',
                  filter: 'blur(0.5px)',
                }}
              />
              {/* White contrast disc behind logo for legibility against iridescent overlays */}
              <div
                className="absolute rounded-full pointer-events-none z-10 flex items-center justify-center"
                style={{
                  width: '46%',
                  height: '46%',
                  top: '27%',
                  left: '27%',
                  background: 'radial-gradient(circle at 50% 45%, hsla(0,0%,100%,0.85) 0%, hsla(0,0%,100%,0.65) 70%, hsla(0,0%,100%,0.35) 100%)',
                  boxShadow: '0 2px 6px hsla(0,0%,0%,0.2), inset 0 0 0 1px hsla(0,0%,100%,0.45)',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <img
                  src={bookmark.favicon}
                  alt={bookmark.title}
                  className="pointer-events-none"
                  style={{
                    width: '72%',
                    height: '72%',
                    objectFit: 'contain',
                    imageRendering: 'auto',
                    filter: 'drop-shadow(0 1px 1px hsla(0,0%,0%,0.25))',
                  }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <ExternalLink className="w-3 h-3 text-white drop-shadow-lg" />
              </div>
            </div>
            {/* #8 Pop particle spray — only rendered while popping */}
            {isPopping && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const dist = heatStyles.size * 0.7;
                  return (
                    <span
                      key={i}
                      className="bubble-particle absolute rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: 6,
                        height: 6,
                        marginLeft: -3,
                        marginTop: -3,
                        background: heatStyles.highlight,
                        boxShadow: `0 0 8px ${heatStyles.glow}`,
                        '--px': `${Math.cos(angle) * dist}px`,
                        '--py': `${Math.sin(angle) * dist}px`,
                      } as CSSProperties}
                    />
                  );
                })}
              </div>
            )}
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
              onClick={() => { setContextMenu(null); popAndRemove(contextBookmark.id); }}
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
