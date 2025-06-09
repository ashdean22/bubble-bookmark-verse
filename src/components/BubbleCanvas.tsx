import { useEffect, useRef, useState } from 'react';
import { Bookmark } from '@/pages/Index';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BubbleCanvasProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
}

export const BubbleCanvas = ({ bookmarks, onRemoveBookmark }: BubbleCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const mouseInteractionRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bubbles = canvas.querySelectorAll('.bubble');
    let mouseX = 0;
    let mouseY = 0;

    // Initialize bubble positions and velocities
    const bubbleData = new Map();
    bubbles.forEach((bubble, index) => {
      const element = bubble as HTMLElement;
      bubbleData.set(element, {
        x: parseFloat(element.style.left) || Math.random() * (window.innerWidth - 100),
        y: parseFloat(element.style.top) || Math.random() * (window.innerHeight - 100),
        vx: (Math.random() - 0.5) * 2, // velocity x
        vy: (Math.random() - 0.5) * 2, // velocity y
        baseX: 0,
        baseY: 0,
        mouseInfluence: 0
      });
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      bubbles.forEach((bubble) => {
        const element = bubble as HTMLElement;
        const data = bubbleData.get(element);
        if (!data) return;

        const rect = element.getBoundingClientRect();
        const bubbleX = rect.left + rect.width / 2;
        const bubbleY = rect.top + rect.height / 2;
        
        // Mouse interaction
        const deltaX = mouseX - bubbleX;
        const deltaY = mouseY - bubbleY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let mouseForceX = 0;
        let mouseForceY = 0;
        if (distance < 200 && distance > 0) {
          const force = (200 - distance) / 200;
          mouseForceX = -deltaX * force * 0.5;
          mouseForceY = -deltaY * force * 0.5;
        }

        // Continuous floating animation
        data.x += data.vx;
        data.y += data.vy;

        // Boundary collision
        const padding = 50;
        if (data.x < padding || data.x > window.innerWidth - padding) {
          data.vx *= -1;
          data.x = Math.max(padding, Math.min(window.innerWidth - padding, data.x));
        }
        if (data.y < padding || data.y > window.innerHeight - padding) {
          data.vy *= -1;
          data.y = Math.max(padding, Math.min(window.innerHeight - padding, data.y));
        }

        // Apply small random variations to keep movement interesting
        data.vx += (Math.random() - 0.5) * 0.1;
        data.vy += (Math.random() - 0.5) * 0.1;

        // Limit velocity
        const maxVelocity = 1.5;
        data.vx = Math.max(-maxVelocity, Math.min(maxVelocity, data.vx));
        data.vy = Math.max(-maxVelocity, Math.min(maxVelocity, data.vy));

        // Apply damping
        data.vx *= 0.99;
        data.vy *= 0.99;

        // Combine floating and mouse interaction
        const finalX = data.x + mouseForceX;
        const finalY = data.y + mouseForceY;

        element.style.left = `${finalX}px`;
        element.style.top = `${finalY}px`;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bookmarks]);

  const handleBubbleClick = (bookmark: Bookmark) => {
    window.open(bookmark.url, '_blank');
  };

  return (
    <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bubble absolute cursor-pointer transition-all duration-300 hover:scale-110 group"
          style={{
            left: bookmark.x,
            top: bookmark.y,
            width: bookmark.size,
            height: bookmark.size,
          }}
          onMouseEnter={() => setHoveredBubble(bookmark.id)}
          onMouseLeave={() => setHoveredBubble(null)}
        >
          {/* Main bubble */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border-2 border-white/30 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${bookmark.color}88, ${bookmark.color}CC)`,
              boxShadow: `0 0 30px ${bookmark.color}44`,
            }}
            onClick={() => handleBubbleClick(bookmark)}
          >
            {/* Favicon */}
            <img
              src={bookmark.favicon}
              alt={bookmark.title}
              className="w-8 h-8 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
              }}
            />
            
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle at 30% 30%, white, transparent 70%)`,
              }}
            />
            
            {/* External link icon on hover */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Tooltip */}
          {hoveredBubble === bookmark.id && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50 border border-white/20">
              {bookmark.title}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
            </div>
          )}

          {/* Remove button */}
          {hoveredBubble === bookmark.id && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
