import { useMemo } from 'react';

export const AbstractBackground = () => {
  // Aurora blobs — large, slow-drifting colour pools
  const auroraBlobs = useMemo(() =>
    [
      { id: 0, cx: 15,  cy: 20,  r: 480, hue: 200, sat: 95, lit: 60, alpha: 0.13, dur: 22, delay: 0   },
      { id: 1, cx: 75,  cy: 10,  r: 420, hue: 180, sat: 80, lit: 55, alpha: 0.10, dur: 28, delay: -6  },
      { id: 2, cx: 85,  cy: 70,  r: 550, hue: 220, sat: 90, lit: 55, alpha: 0.11, dur: 34, delay: -12 },
      { id: 3, cx: 10,  cy: 80,  r: 460, hue: 35,  sat: 100,lit: 58, alpha: 0.08, dur: 26, delay: -4  },
      { id: 4, cx: 50,  cy: 50,  r: 380, hue: 190, sat: 85, lit: 60, alpha: 0.07, dur: 40, delay: -18 },
      { id: 5, cx: 60,  cy: 90,  r: 400, hue: 210, sat: 90, lit: 58, alpha: 0.09, dur: 31, delay: -9  },
    ], []);

  // Light-beam lines crossing the canvas
  const beams = useMemo(() =>
    [
      { id: 0, x1: 0,   y1: 0,   x2: 60,  y2: 100, dur: 18, delay: 0   },
      { id: 1, x1: 100, y1: 0,   x2: 30,  y2: 100, dur: 24, delay: -7  },
      { id: 2, x1: 30,  y1: 0,   x2: 80,  y2: 100, dur: 20, delay: -13 },
      { id: 3, x1: 70,  y1: 0,   x2: 10,  y2: 100, dur: 30, delay: -3  },
    ], []);

  // Small sparkle dots
  const sparkles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.round((i * 37 + 11) % 100),
      top:  Math.round((i * 53 + 7)  % 100),
      size: 1.5 + (i % 3) * 0.8,
      dur:  2.5 + (i % 4) * 1.2,
      delay: -(i * 0.7),
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">

      {/* ── Layer 1: deep vignette so edges feel like deep space ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, hsl(220 55% 4% / 0.7) 100%)',
        }}
      />

      {/* ── Layer 2: animated aurora colour blobs ── */}
      {auroraBlobs.map(b => (
        <div
          key={`aurora-${b.id}`}
          className="absolute rounded-full"
          style={{
            left: `${b.cx}%`,
            top:  `${b.cy}%`,
            width:  `${b.r * 2}px`,
            height: `${b.r * 2}px`,
            marginLeft: `-${b.r}px`,
            marginTop:  `-${b.r}px`,
            background: `radial-gradient(circle, hsla(${b.hue},${b.sat}%,${b.lit}%,${b.alpha}) 0%, transparent 70%)`,
            animation: `aurora-drift-${b.id % 3} ${b.dur}s ease-in-out ${b.delay}s infinite`,
            willChange: 'transform, opacity',
            filter: 'blur(2px)',
          }}
        />
      ))}

      {/* ── Layer 3: diagonal light beams ── */}
      {beams.map(beam => (
        <div
          key={`beam-${beam.id}`}
          className="absolute pointer-events-none"
          style={{
            left: `${beam.x1}%`,
            top:  `${beam.y1}%`,
            width:  '1px',
            height: '140%',
            transformOrigin: '0 0',
            transform: `rotate(${Math.atan2(beam.y2 - beam.y1, beam.x2 - beam.x1) * (180 / Math.PI) + 90}deg)`,
            background: 'linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.07) 40%, hsl(var(--primary) / 0.12) 60%, transparent)',
            animation: `beam-fade ${beam.dur}s ease-in-out ${beam.delay}s infinite`,
          }}
        />
      ))}

      {/* ── Layer 4: sparkle star dots ── */}
      {sparkles.map(s => (
        <div
          key={`spark-${s.id}`}
          className="absolute rounded-full"
          style={{
            left:   `${s.left}%`,
            top:    `${s.top}%`,
            width:  `${s.size}px`,
            height: `${s.size}px`,
            background: 'hsl(var(--primary) / 0.7)',
            boxShadow: '0 0 4px 1px hsl(var(--primary) / 0.5)',
            animation: `sparkle-blink ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* ── Layer 5: subtle dot grid ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.025,
          backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Keyframe definitions ── */}
      <style>{`
        @keyframes aurora-drift-0 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          33%       { transform: translate(30px, -20px) scale(1.08); opacity: 0.85; }
          66%       { transform: translate(-20px, 25px) scale(0.95); opacity: 0.9; }
        }
        @keyframes aurora-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.9; }
          40%       { transform: translate(-35px, 20px) scale(1.1); opacity: 1; }
          70%       { transform: translate(20px, -30px) scale(0.92); opacity: 0.8; }
        }
        @keyframes aurora-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.85; }
          50%       { transform: translate(25px, 35px) scale(1.06); opacity: 1; }
        }
        @keyframes beam-fade {
          0%, 100% { opacity: 0; }
          40%, 60%  { opacity: 1; }
        }
        @keyframes sparkle-blink {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50%       { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
};
