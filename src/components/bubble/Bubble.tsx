import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './bubble.css';

const POP_MS = 520;
const DROPLETS = 22;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Hidden SVG filter that warps the tear lip. Render once near the app root. */
export const TearFilter = () => (
  <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
    <filter id="bm-tear-filter" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves={2} seed={7} result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={9} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

export interface BubbleProps {
  size: number;
  glyph?: React.ReactNode;
  label?: string;
  sparkle?: boolean;
  /** Set true to run the film-tear pop sequence. */
  popping?: boolean;
  /** Fired when the pop sequence finishes. */
  onPopped?: () => void;
  /** Click / Enter / Space activation (does not pop). */
  onActivate?: () => void;
  /** Drop the backdrop-filter layer (dense boards / tiny bubbles). */
  refract?: boolean;
  seed?: number;
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}

export const Bubble = ({
  size,
  glyph,
  label,
  sparkle = false,
  popping = false,
  onPopped,
  onActivate,
  refract = true,
  seed = 0,
  className = '',
  style,
  showLabel = false,
}: BubbleProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [popActive, setPopActive] = useState(false);

  const small = size < 90;
  const showSparkle = sparkle && !small;

  const droplets = useMemo(() => {
    return Array.from({ length: DROPLETS }, (_, i) => {
      const r = (Math.sin((seed + i) * 12.9898) + 1) / 2;
      const r2 = (Math.sin((seed + i) * 78.233) + 1) / 2;
      // right hemisphere launch, gravity pulls the arc down
      const angle = -Math.PI / 2 + r * Math.PI;
      const dist = size * (0.5 + r2 * 0.75);
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist + size * 0.45,
        d: 4 + r2 * 7,
        dur: 620 + r * 360,
        delay: r2 * 190,
      };
    });
  }, [seed, size]);

  // Drive the radial eat mask with t^1.4 easing
  useEffect(() => {
    if (!popping) return;
    setPopActive(true);
    const node = rootRef.current;
    if (prefersReducedMotion() || !node) {
      const id = window.setTimeout(() => onPopped?.(), prefersReducedMotion() ? 180 : POP_MS);
      return () => window.clearTimeout(id);
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / POP_MS, 1);
      node.style.setProperty('--bm-eat', `${Math.pow(t, 1.4) * 132}%`);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else onPopped?.();
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [popping, onPopped]);

  const activate = useCallback(() => {
    if (popActive) return;
    onActivate?.();
  }, [popActive, onActivate]);

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-label={label ? `Pop ${label}` : 'Pop bubble'}
      data-popping={popActive ? 'true' : 'false'}
      className={`bm-bubble ${className}`}
      style={{ ['--bm-size' as string]: `${size}px`, ['--bm-eat' as string]: '0%', ...style }}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
    >
      <div className={`bm-layer bm-maskable bm-core${refract && !small ? ' bm-refract' : ''}`} />
      <div className="bm-layer bm-maskable bm-film" />
      <div className="bm-layer bm-maskable bm-band" />
      <div className="bm-layer bm-maskable bm-rim" />

      <div className="bm-layer bm-maskable" aria-hidden="true">
        <span className="bm-spec" />
        {!small && <span className="bm-spec2" />}
        <span className="bm-glint" />
      </div>

      {showSparkle && (
        <span
          className="bm-sparkle"
          aria-hidden="true"
          style={{ top: `${8 + (seed % 5) * 3}%`, right: `${10 + (seed % 7) * 2}%` }}
        />
      )}

      {glyph && <div className="bm-content bm-maskable">{glyph}</div>}

      {popActive && (
        <>
          <div className="bm-tear" aria-hidden="true" />
          {droplets.map((d, i) => (
            <span
              key={i}
              className="bm-droplet"
              aria-hidden="true"
              style={{
                width: d.d,
                height: d.d,
                ['--bm-dx' as string]: `${d.dx}px`,
                ['--bm-dy' as string]: `${d.dy}px`,
                ['--bm-dur' as string]: `${d.dur}ms`,
                ['--bm-delay' as string]: `${d.delay}ms`,
              }}
            />
          ))}
        </>
      )}

      {showLabel && label && <span className="bm-label">{label}</span>}
    </div>
  );
};