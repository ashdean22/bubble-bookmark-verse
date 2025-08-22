import { useMemo } from 'react';

export const AbstractBackground = () => {
  // Generate static geometric shapes to prevent re-renders
  const geometricShapes = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 60 + Math.random() * 120,
      rotation: Math.random() * 360,
      opacity: 0.03 + Math.random() * 0.07,
      delay: Math.random() * 4,
      duration: 8 + Math.random() * 4,
    })), []
  );

  const meshGradients = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 200 + Math.random() * 300,
      delay: Math.random() * 6,
      duration: 12 + Math.random() * 8,
    })), []
  );

  const floatingLines = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: 100 + Math.random() * 200,
      rotation: Math.random() * 180,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Mesh gradient blobs */}
      {meshGradients.map((blob) => (
        <div
          key={`blob-${blob.id}`}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${blob.left}%`,
            top: `${blob.top}%`,
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
            animationDelay: `${blob.delay}s`,
            animationDuration: `${blob.duration}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Geometric shapes */}
      {geometricShapes.map((shape) => (
        <div
          key={`shape-${shape.id}`}
          className="absolute border border-primary/10 animate-pulse"
          style={{
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
            borderRadius: shape.id % 3 === 0 ? '50%' : shape.id % 2 === 0 ? '12px' : '0px',
            background: `linear-gradient(45deg, hsl(var(--primary) / ${shape.opacity}), transparent)`,
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
          }}
        />
      ))}
      
      {/* Floating lines */}
      {floatingLines.map((line) => (
        <div
          key={`line-${line.id}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse"
          style={{
            left: `${line.left}%`,
            top: `${line.top}%`,
            width: `${line.width}px`,
            transform: `translate(-50%, -50%) rotate(${line.rotation}deg)`,
            animationDelay: `${line.delay}s`,
            animationDuration: `${line.duration}s`,
          }}
        />
      ))}

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};