// Bubble Animation Presets
// Use these presets to quickly switch between different bubble movement styles

export interface BubblePreset {
  name: string;
  description: string;
  // Movement characteristics
  wanderStrength: { min: number; max: number };
  wanderSpeed: { min: number; max: number };
  // Physics
  damping: number;
  maxVelocity: number;
  boundaryForce: number;
  separationForce: number;
  // Smoothing
  accelerationSmoothing: number;
  velocitySmoothing: number;
  lerpFactor: number;
  // Wobble
  wobbleStrength: number;
  // Target timing (ms)
  targetChangeMin: number;
  targetChangeMax: number;
}

export const BUBBLE_PRESETS: Record<string, BubblePreset> = {
  // Current smooth, natural flow
  SMOOTH_FLOW: {
    name: 'Smooth Flow',
    description: 'Ultra-smooth, natural floating movement with lerp interpolation and acceleration smoothing',
    wanderStrength: { min: 0.003, max: 0.005 },
    wanderSpeed: { min: 0.0001, max: 0.00015 },
    damping: 0.992,
    maxVelocity: 0.4,
    boundaryForce: 0.005,
    separationForce: 0.005,
    accelerationSmoothing: 0.95,
    velocitySmoothing: 0.7,
    lerpFactor: 0.15,
    wobbleStrength: 0.002,
    targetChangeMin: 8000,
    targetChangeMax: 15000,
  },

  // Faster, more energetic
  ENERGETIC: {
    name: 'Energetic',
    description: 'Faster movement with more responsive changes',
    wanderStrength: { min: 0.01, max: 0.015 },
    wanderSpeed: { min: 0.0003, max: 0.0005 },
    damping: 0.98,
    maxVelocity: 1.2,
    boundaryForce: 0.015,
    separationForce: 0.015,
    accelerationSmoothing: 0.85,
    velocitySmoothing: 0.6,
    lerpFactor: 0.25,
    wobbleStrength: 0.006,
    targetChangeMin: 2000,
    targetChangeMax: 5000,
  },

  // Very slow, meditative
  MEDITATIVE: {
    name: 'Meditative',
    description: 'Extremely slow, calming drift',
    wanderStrength: { min: 0.001, max: 0.002 },
    wanderSpeed: { min: 0.00005, max: 0.0001 },
    damping: 0.995,
    maxVelocity: 0.2,
    boundaryForce: 0.003,
    separationForce: 0.003,
    accelerationSmoothing: 0.98,
    velocitySmoothing: 0.8,
    lerpFactor: 0.08,
    wobbleStrength: 0.001,
    targetChangeMin: 12000,
    targetChangeMax: 20000,
  },

  // Playful bouncy
  PLAYFUL: {
    name: 'Playful',
    description: 'Bouncy, lively movement with more personality',
    wanderStrength: { min: 0.008, max: 0.012 },
    wanderSpeed: { min: 0.0002, max: 0.0004 },
    damping: 0.985,
    maxVelocity: 0.8,
    boundaryForce: 0.01,
    separationForce: 0.01,
    accelerationSmoothing: 0.9,
    velocitySmoothing: 0.65,
    lerpFactor: 0.2,
    wobbleStrength: 0.004,
    targetChangeMin: 3000,
    targetChangeMax: 7000,
  },
};

// Default preset - currently SMOOTH_FLOW
export const DEFAULT_PRESET = BUBBLE_PRESETS.SMOOTH_FLOW;

// Helper to get preset by name
export const getPreset = (name: keyof typeof BUBBLE_PRESETS): BubblePreset => {
  return BUBBLE_PRESETS[name] || DEFAULT_PRESET;
};
