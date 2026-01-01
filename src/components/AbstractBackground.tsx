import { useMemo } from 'react';

export const AbstractBackground = () => {
  // Generate static geometric shapes to prevent re-renders
  const geometricShapes = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      top: Math.round(Math.random() * 100),
      size: Math.round(60 + Math.random() * 120),
      rotation: Math.round(Math.random() * 360),
      opacity: 0.03 + Math.random() * 0.07,
      delay: Math.random() * 4,
      duration: 8 + Math.random() * 4,
    })), []
  );

  const meshGradients = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      top: Math.round(Math.random() * 100),
      size: Math.round(200 + Math.random() * 300),
      delay: Math.random() * 6,
      duration: 12 + Math.random() * 8,
    })), []
  );

  const floatingLines = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      top: Math.round(Math.random() * 100),
      width: Math.round(100 + Math.random() * 200),
      rotation: Math.round(Math.random() * 180),
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
          className="absolute rounded-full"
          style={{
            left: `${blob.left}%`,
            top: `${blob.top}%`,
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
            marginLeft: `-${blob.size / 2}px`,
            marginTop: `-${blob.size / 2}px`,
          }}
        />
      ))}

      {/* Geometric shapes - using margin offset instead of transform for crisp rendering */}
      {geometricShapes.map((shape) => (
        <div
          key={`shape-${shape.id}`}
          className="absolute"
          style={{
            left: `${shape.left}%`,
            top: `${shape.top}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            marginLeft: `-${shape.size / 2}px`,
            marginTop: `-${shape.size / 2}px`,
            transform: `rotate(${shape.rotation}deg)`,
            borderRadius: shape.id % 3 === 0 ? '50%' : shape.id % 2 === 0 ? '12px' : '0px',
            border: '1px solid hsl(var(--primary) / 0.1)',
            background: `linear-gradient(45deg, hsl(var(--primary) / ${shape.opacity.toFixed(2)}), transparent)`,
            backfaceVisibility: 'hidden',
          }}
        />
      ))}
      
      {/* Floating lines */}
      {floatingLines.map((line) => (
        <div
          key={`line-${line.id}`}
          className="absolute h-px"
          style={{
            left: `${line.left}%`,
            top: `${line.top}%`,
            width: `${line.width}px`,
            marginLeft: `-${line.width / 2}px`,
            transform: `rotate(${line.rotation}deg)`,
            background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 0.2), transparent)',
            backfaceVisibility: 'hidden',
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