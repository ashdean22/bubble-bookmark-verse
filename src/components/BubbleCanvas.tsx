import { useEffect, useRef, useState } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink } from 'lucide-react';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onBubbleClick: (id: string) => void;
  currentSubscription?: string | null;
}

// Helper functions for heat-based bubble colors (cold=blue, hot=red)
const getHeatColor = (accessCount: number, maxAccess: number) => {
  // Normalize access count to 0-1 range
  const heat = maxAccess > 0 ? Math.min(accessCount / maxAccess, 1) : 0;
  
  // Interpolate from blue (cold) to red (hot)
  // Cold: HSL(210, 100%, 50%) - Blue
  // Hot: HSL(0, 100%, 50%) - Red
  const hue = 210 - (heat * 210); // 210 (blue) → 0 (red)
  const saturation = 70 + (heat * 30); // 70% → 100%
  const lightness = 50 + (heat * 10); // 50% → 60%
  
  return {
    gradient: `linear-gradient(135deg, hsla(${hue}, ${saturation}%, ${lightness}%, 0.35), hsla(${hue}, ${saturation - 10}%, ${lightness - 10}%, 0.45))`,
    border: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`,
    glow: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`
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

    // Create completely independent ecosystems for each bubble
    const bubbleData = new Map();
    bubbles.forEach((bubble) => {
      const element = bubble as HTMLElement;
      const bookmarkId = element.getAttribute('data-bubble-id');
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      const headerHeight = getHeaderHeight();
      const uniqueSeed = bookmarkId ? parseInt(bookmarkId.slice(-8), 16) || 1 : Math.random() * 1000;
      const ecosystemId = Math.random() * 1000000;
      
      bubbleData.set(element, {
        // Position & Physics
        x: bookmark?.x || Math.random() * (window.innerWidth - 100),
        y: Math.max(
          bookmark?.y || Math.random() * (window.innerHeight - 100),
          headerHeight + 50
        ),
        vx: (Math.random() - 0.5) * (0.2 + Math.random() * 0.3),
        vy: (Math.random() - 0.5) * (0.2 + Math.random() * 0.3),
        
        // Size & Animation
        baseSize: bookmark?.size || 60,
        currentSize: bookmark?.size || 60,
        targetSize: bookmark?.size || 60,
        
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
        
        const isClicked = clickedBubble === bookmarkId;

        // Each bubble's independent ecosystem behavior
        const currentTime = Date.now();
        const bubbleAge = (currentTime - data.birthTime) * 0.001;
        const p = data.personality;
        
        // Update life cycles with organic timing variations
        data.floatCycle += p.rhythm * (0.008 + Math.sin(bubbleAge * 0.1) * 0.004);
        data.pulseCycle += p.rhythm * (0.012 + Math.cos(bubbleAge * 0.07) * 0.006);  
        data.breatheCycle += p.rhythm * (0.006 + Math.sin(bubbleAge * 0.05) * 0.003);
        
        // Continuous organic behavior
        const organicForce = {
          x: Math.sin(data.floatCycle + bubbleAge * 0.1) * 0.008 * p.amplitude,
          y: Math.cos(data.breatheCycle + bubbleAge * 0.07) * 0.006 * p.amplitude
        };
        
        // Add subtle drift based on bubble's personality
        const personalityDrift = {
          x: Math.sin(bubbleAge * p.rhythm * 0.01 + data.ecosystemId) * 0.004 * p.energy,
          y: Math.cos(bubbleAge * p.rhythm * 0.008 + data.ecosystemId) * 0.003 * p.energy
        };
        
        // Apply continuous gentle forces
        data.vx += organicForce.x + personalityDrift.x;
        data.vy += organicForce.y + personalityDrift.y;
        
        // Gradual excitement decay with organic fluctuation
        data.excitement *= (0.998 + Math.sin(bubbleAge * 0.1) * 0.001);
        
        // Pure autonomous behavior - no mouse interference
        const excitementDecay = Math.max(0, data.excitement - 0.01);
        data.excitement = excitementDecay;
        
        // Natural floating movement with layered organic patterns
        const primaryWave = Math.sin(data.floatCycle * p.rhythm) * (0.015 * p.amplitude);
        const secondaryWave = Math.cos(data.floatCycle * p.rhythm * 1.618) * (0.008 * p.amplitude);
        const tertiaryWave = Math.sin(data.breatheCycle * p.rhythm * 0.7) * (0.005 * p.amplitude);
        
        const organicX = primaryWave + secondaryWave * 0.6 + tertiaryWave * 0.3;
        const organicY = Math.cos(data.breatheCycle * p.rhythm) * (0.012 * p.amplitude) + 
                        Math.sin(data.floatCycle * p.rhythm * 0.8) * (0.006 * p.amplitude);
        
        data.vx += organicX * (0.3 + p.energy * 0.4);
        data.vy += organicY * (0.3 + p.energy * 0.4);
        
        // Natural size with minimal breathing
        const breatheEffect = Math.sin(data.breatheCycle) * 0.01 + 1;
        data.targetSize = data.baseSize * breatheEffect;

        // Smooth size interpolation
        data.currentSize += (data.targetSize - data.currentSize) * 0.12;

        // Apply velocity
        data.x += data.vx;
        data.y += data.vy;

        // Soft, natural boundary interactions
        const radius = data.currentSize / 2;
        const topBoundary = headerHeight + radius;
        const softness = 0.85 + (p.stability * 0.1);
        const cushion = radius * 0.3;
        
        // Gradual boundary approach with soft reflection
        if (data.x < radius + cushion) {
          const penetration = (radius + cushion - data.x) / cushion;
          data.x = radius + cushion;
          data.vx = Math.abs(data.vx) * softness + (penetration * 0.1 * p.energy);
          data.excitement = Math.min(1, data.excitement + 0.05);
        } else if (data.x > canvasWidth - radius - cushion) {
          const penetration = (data.x - (canvasWidth - radius - cushion)) / cushion;
          data.x = canvasWidth - radius - cushion;
          data.vx = -Math.abs(data.vx) * softness - (penetration * 0.1 * p.energy);
          data.excitement = Math.min(1, data.excitement + 0.05);
        }
        
        // Soft vertical boundaries
        if (data.y < topBoundary + cushion) {
          const penetration = (topBoundary + cushion - data.y) / cushion;
          data.y = topBoundary + cushion;
          data.vy = Math.abs(data.vy) * softness + (penetration * 0.1 * p.energy);
          data.excitement = Math.min(1, data.excitement + 0.05);
        } else if (data.y > canvasHeight - radius - cushion) {
          const penetration = (data.y - (canvasHeight - radius - cushion)) / cushion;
          data.y = canvasHeight - radius - cushion;
          data.vy = -Math.abs(data.vy) * softness - (penetration * 0.1 * p.energy);
          data.excitement = Math.min(1, data.excitement + 0.05);
        }

        // Organic velocity damping with natural fluctuation
        const dampingBase = 0.9985 - (p.stability * 0.0008);
        const dampingVariation = Math.sin(bubbleAge * 0.03) * 0.0002;
        const finalDamping = dampingBase + dampingVariation;
        
        data.vx *= finalDamping;
        data.vy *= finalDamping;

        // Natural velocity limits with smooth capping
        const baseMaxVelocity = 0.6 + (p.energy * 0.4);
        const excitementBoost = data.excitement * 0.3;
        const maxVelocity = baseMaxVelocity + excitementBoost;
        
        const velocityMagnitude = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
        if (velocityMagnitude > maxVelocity) {
          const reductionFactor = maxVelocity / velocityMagnitude;
          const smoothFactor = 0.95 + (reductionFactor * 0.05);
          data.vx *= smoothFactor;
          data.vy *= smoothFactor;
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

      // Batch all DOM updates together for better performance
      const styleUpdates: Array<{ element: HTMLElement; transform: string; width: string; height: string }> = [];
      
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        styleUpdates.push({
          element,
          transform: `translate3d(${data.x - data.currentSize / 2}px, ${data.y - data.currentSize / 2}px, 0) scale(${data.currentSize / data.baseSize})`,
          width: `${data.baseSize}px`,
          height: `${data.baseSize}px`
        });
      });

      // Apply all DOM updates in a single batch
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

  // Calculate max access count for heat coloring
  const maxAccessCount = Math.max(...bookmarks.map(b => b.accessCount), 1);

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => {
        const heatColors = getHeatColor(bookmark.accessCount, maxAccessCount);
        return (
          <div
            key={bookmark.id}
            data-bubble-id={bookmark.id}
            className="bubble absolute cursor-pointer transition-all duration-150 group select-none"
            style={{
              transform: `translate3d(${bookmark.x}px, ${bookmark.y}px, 0)`,
              width: bookmark.size,
              height: bookmark.size,
              zIndex: draggedBubble === bookmark.id ? 30 : 10,
            }}
            onMouseDown={(e) => handleDragStart(e, bookmark.id)}
            onTouchStart={(e) => handleDragStart(e, bookmark.id)}
          >
            <div
              className="w-full h-full rounded-full flex flex-col items-center justify-center relative transition-all duration-300 ease-out"
              style={{
                background: heatColors.gradient,
                border: `3px solid ${heatColors.border}`,
                boxShadow: `0 0 15px ${heatColors.glow}, inset 0 1px 5px rgba(255,255,255,0.1)`,
                transform: 'scale(1)',
                filter: 'brightness(1)',
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