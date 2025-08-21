import { useEffect, useRef, useState } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './BubbleCanvas.css';

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

  // Spatial partitioning system for efficient collision detection
  class SpatialGrid {
    private cellSize: number;
    private grid: Map<string, HTMLElement[]>;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(cellSize: number, canvasWidth: number, canvasHeight: number) {
      this.cellSize = cellSize;
      this.grid = new Map();
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
    }

    private getCellKey(x: number, y: number): string {
      const cellX = Math.floor(x / this.cellSize);
      const cellY = Math.floor(y / this.cellSize);
      return `${cellX},${cellY}`;
    }

    clear() {
      this.grid.clear();
    }

    addBubble(element: HTMLElement, x: number, y: number, radius: number) {
      // Add bubble to all cells it might occupy
      const minX = Math.max(0, x - radius);
      const maxX = Math.min(this.canvasWidth, x + radius);
      const minY = Math.max(0, y - radius);
      const maxY = Math.min(this.canvasHeight, y + radius);

      const startCellX = Math.floor(minX / this.cellSize);
      const endCellX = Math.floor(maxX / this.cellSize);
      const startCellY = Math.floor(minY / this.cellSize);
      const endCellY = Math.floor(maxY / this.cellSize);

      for (let cellX = startCellX; cellX <= endCellX; cellX++) {
        for (let cellY = startCellY; cellY <= endCellY; cellY++) {
          const key = `${cellX},${cellY}`;
          if (!this.grid.has(key)) {
            this.grid.set(key, []);
          }
          this.grid.get(key)!.push(element);
        }
      }
    }

    getNearbyBubbles(x: number, y: number, radius: number): HTMLElement[] {
      const nearby = new Set<HTMLElement>();
      
      // Check all cells that this bubble might interact with
      const minX = Math.max(0, x - radius - this.cellSize);
      const maxX = Math.min(this.canvasWidth, x + radius + this.cellSize);
      const minY = Math.max(0, y - radius - this.cellSize);
      const maxY = Math.min(this.canvasHeight, y + radius + this.cellSize);

      const startCellX = Math.floor(minX / this.cellSize);
      const endCellX = Math.floor(maxX / this.cellSize);
      const startCellY = Math.floor(minY / this.cellSize);
      const endCellY = Math.floor(maxY / this.cellSize);

      for (let cellX = startCellX; cellX <= endCellX; cellX++) {
        for (let cellY = startCellY; cellY <= endCellY; cellY++) {
          const key = `${cellX},${cellY}`;
          const cellBubbles = this.grid.get(key);
          if (cellBubbles) {
            cellBubbles.forEach(bubble => nearby.add(bubble));
          }
        }
      }

      return Array.from(nearby);
    }
  }

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark, onBubbleClick }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [clickedBubble, setClickedBubble] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

    // Initialize bubble positions and velocities with independent physics
    const bubbleData = new Map();
    bubbles.forEach((bubble) => {
      const element = bubble as HTMLElement;
      const bookmarkId = element.getAttribute('data-bubble-id');
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      const headerHeight = getHeaderHeight();
      
      bubbleData.set(element, {
        x: bookmark?.x || Math.random() * (window.innerWidth - 100),
        y: Math.max(
          bookmark?.y || Math.random() * (window.innerHeight - 100),
          headerHeight + 50 // Ensure bubbles start below header
        ),
        vx: (Math.random() - 0.5) * 0.5, // Reduced initial velocity
        vy: (Math.random() - 0.5) * 0.5,
        baseSize: bookmark?.size || 60,
        currentSize: bookmark?.size || 60,
        targetSize: bookmark?.size || 60,
      });
    });

    const animate = () => {
      const headerHeight = getHeaderHeight();
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;
      
      // Create spatial grid with cell size based on average bubble size
      const averageBubbleSize = bookmarks.reduce((sum, b) => sum + (b.size || 60), 0) / (bookmarks.length || 1);
      const cellSize = Math.max(averageBubbleSize * 2, 100); // Ensure reasonable cell size
      const spatialGrid = new SpatialGrid(cellSize, canvasWidth, canvasHeight);
      
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

        // Natural floating for all bubbles
        const time = Date.now() * 0.002;
        const uniqueOffset = parseFloat(bookmarkId?.slice(-4) || '1') || 1;
        
        // Gentle natural floating movement
        const floatX = Math.sin(time * 0.5 + uniqueOffset) * 0.08;
        const floatY = Math.cos(time * 0.3 + uniqueOffset * 1.5) * 0.06;
        
        data.vx += floatX;
        data.vy += floatY;
        
        data.targetSize = data.baseSize;

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

      // Populate spatial grid with current bubble positions
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        const bookmarkId = element.getAttribute('data-bubble-id');
        if (draggedBubble === bookmarkId) return; // Skip dragged bubbles

        const radius = data.currentSize / 2;
        spatialGrid.addBubble(element, data.x, data.y, radius);
      });

      // Efficient spatial-partitioned collision detection
      bubbles.forEach((bubbleA) => {
        const elementA = bubbleA as HTMLElement;
        const dataA = bubbleData.get(elementA);
        if (!dataA) return;

        const bookmarkIdA = elementA.getAttribute('data-bubble-id');
        if (draggedBubble === bookmarkIdA) return; // Skip dragged bubbles

        const radiusA = dataA.currentSize / 2;
        const nearbyBubbles = spatialGrid.getNearbyBubbles(dataA.x, dataA.y, radiusA);
        
        nearbyBubbles.forEach((elementB) => {
          if (elementA === elementB) return; // Skip self
          
          const dataB = bubbleData.get(elementB);
          if (!dataB) return;

          const bookmarkIdB = elementB.getAttribute('data-bubble-id');
          if (draggedBubble === bookmarkIdB) return; // Skip dragged bubbles

          // Calculate distance between bubble centers
          const dx = dataB.x - dataA.x;
          const dy = dataB.y - dataA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (dataA.currentSize + dataB.currentSize) / 2;

          // Check for collision with slight buffer for better detection
          if (distance < minDistance + 2 && distance > 0) {
            // Calculate collision normal
            const normalX = dx / distance;
            const normalY = dy / distance;

            // Separate bubbles to prevent overlap
            const overlap = minDistance - distance + 4; // Add buffer
            const separationX = (normalX * overlap) / 2;
            const separationY = (normalY * overlap) / 2;
            
            dataA.x -= separationX;
            dataA.y -= separationY;
            dataB.x += separationX;
            dataB.y += separationY;

            // Calculate relative velocity
            const relativeVx = dataB.vx - dataA.vx;
            const relativeVy = dataB.vy - dataA.vy;
            const relativeSpeed = relativeVx * normalX + relativeVy * normalY;

            // Enhanced collision response with higher restitution
            const restitution = 0.9; // Increased bounciness
            const impulse = 2 * relativeSpeed / (1 + 1); // Assuming equal mass
            const impulseX = impulse * normalX * restitution;
            const impulseY = impulse * normalY * restitution;

            // Apply impulse to velocities with minimum bounce
            const minBounce = 0.3;
            dataA.vx += impulseX + (Math.random() - 0.5) * minBounce;
            dataA.vy += impulseY + (Math.random() - 0.5) * minBounce;
            dataB.vx -= impulseX + (Math.random() - 0.5) * minBounce;
            dataB.vy -= impulseY + (Math.random() - 0.5) * minBounce;
          }
        });
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
  }, [bookmarks, draggedBubble, clickedBubble]);

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
      
      bubble.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
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
          className="bubble absolute cursor-pointer select-none bubble-hover-effect"
          style={{
            width: `${bookmark.size}px`,
            height: `${bookmark.size}px`,
            background: getTransparentBubbleColor(),
            border: `2px solid ${getTransparentBorderColor()}`,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
            transform: 'translate3d(0, 0, 0)', // Enable GPU acceleration
            willChange: 'transform', // Optimize for animations
          }}
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
                const innerGlow = `inset 0 1px 5px rgba(255,255,255,0.1)`;
                
                return `${baseGlow}, ${innerGlow}`;
              })(),
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
            <div className="external-link-icon absolute top-1 right-1 opacity-0 transition-opacity pointer-events-none">
              <ExternalLink className="w-3 h-3 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Enhanced tooltip - now CSS controlled */}
          <div className="bubble-tooltip absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50 border border-white/20 pointer-events-none opacity-0 transition-opacity">
            {bookmark.title}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </div>

          {/* Enhanced remove button - now CSS controlled */}
          <Button
            size="sm"
            variant="destructive"
            className="remove-button absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 shadow-lg hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBookmark(bookmark.id);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};
