// Web Worker for bubble physics calculations
interface BubbleData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  currentSize: number;
  targetSize: number;
  accessCount: number;
}

interface PhysicsConfig {
  canvasWidth: number;
  canvasHeight: number;
  headerHeight: number;
  hoveredBubble: string | null;
  draggedBubble: string | null;
  clickedBubble: string | null;
}

// Spatial partitioning system for efficient collision detection
class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, BubbleData[]>;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(cellSize: number, canvasWidth: number, canvasHeight: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  clear() {
    this.grid.clear();
  }

  addBubble(bubble: BubbleData, radius: number) {
    // Add bubble to all cells it might occupy
    const minX = Math.max(0, bubble.x - radius);
    const maxX = Math.min(this.canvasWidth, bubble.x + radius);
    const minY = Math.max(0, bubble.y - radius);
    const maxY = Math.min(this.canvasHeight, bubble.y + radius);

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
        this.grid.get(key)!.push(bubble);
      }
    }
  }

  getNearbyBubbles(bubble: BubbleData, radius: number): BubbleData[] {
    const nearby = new Set<BubbleData>();
    
    // Check all cells that this bubble might interact with
    const minX = Math.max(0, bubble.x - radius - this.cellSize);
    const maxX = Math.min(this.canvasWidth, bubble.x + radius + this.cellSize);
    const minY = Math.max(0, bubble.y - radius - this.cellSize);
    const maxY = Math.min(this.canvasHeight, bubble.y + radius + this.cellSize);

    const startCellX = Math.floor(minX / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);

    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cellBubbles = this.grid.get(key);
        if (cellBubbles) {
          cellBubbles.forEach(b => {
            if (b.id !== bubble.id) nearby.add(b);
          });
        }
      }
    }

    return Array.from(nearby);
  }
}

let bubbleDataMap = new Map<string, BubbleData>();

// Initialize bubble data
function initializeBubbles(bubbles: Array<{id: string, x: number, y: number, size: number, accessCount: number}>, headerHeight: number) {
  bubbleDataMap.clear();
  
  bubbles.forEach(bubble => {
    bubbleDataMap.set(bubble.id, {
      id: bubble.id,
      x: bubble.x,
      y: Math.max(bubble.y, headerHeight + 50),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      baseSize: bubble.size,
      currentSize: bubble.size,
      targetSize: bubble.size,
      accessCount: bubble.accessCount || 0
    });
  });
}

// Main physics update function
function updatePhysics(config: PhysicsConfig): Array<{id: string, x: number, y: number, size: number}> {
  const results: Array<{id: string, x: number, y: number, size: number}> = [];
  
  // Calculate average bubble size for spatial grid
  const bubbles = Array.from(bubbleDataMap.values());
  const averageBubbleSize = bubbles.reduce((sum, b) => sum + b.baseSize, 0) / (bubbles.length || 1);
  const cellSize = Math.max(averageBubbleSize * 2, 100);
  const spatialGrid = new SpatialGrid(cellSize, config.canvasWidth, config.canvasHeight);
  
  // Update each bubble's physics
  bubbles.forEach(data => {
    // Skip animation for dragged bubble
    if (config.draggedBubble === data.id) {
      results.push({
        id: data.id,
        x: data.x,
        y: data.y,
        size: data.currentSize
      });
      return;
    }
    
    const isHovered = config.hoveredBubble === data.id;
    const isClicked = config.clickedBubble === data.id;

    // Individual bubble floating movement
    if (isHovered) {
      // Enhanced floating for hovered bubble only
      const time = Date.now() * 0.003;
      const uniqueOffset = parseFloat(data.id.slice(-4)) || 1;
      
      // Gentle pulsing and floating when hovered
      const pulseEffect = Math.sin(time * 2) * 0.05 + 1;
      data.targetSize = data.baseSize * 1.3 * pulseEffect;
      
      // Individual floating motion
      data.vx += Math.sin(time + uniqueOffset) * 0.02;
      data.vy += Math.cos(time * 1.2 + uniqueOffset) * 0.02;
    } else {
      // Natural floating for all bubbles
      const time = Date.now() * 0.002;
      const uniqueOffset = parseFloat(data.id.slice(-4)) || 1;
      
      // Gentle natural floating movement
      const floatX = Math.sin(time * 0.5 + uniqueOffset) * 0.08;
      const floatY = Math.cos(time * 0.3 + uniqueOffset * 1.5) * 0.06;
      
      data.vx += floatX;
      data.vy += floatY;
      
      data.targetSize = data.baseSize;
    }

    if (isClicked) {
      data.targetSize = data.baseSize * 0.85;
    }

    // Smooth size interpolation
    data.currentSize += (data.targetSize - data.currentSize) * 0.12;

    // Apply velocity
    data.x += data.vx;
    data.y += data.vy;

    // Enhanced boundary collision
    const radius = data.currentSize / 2;
    const topBoundary = config.headerHeight + radius;
    const restitution = 0.85;
    
    // Left and right boundaries
    if (data.x < radius) {
      data.x = radius;
      data.vx = Math.abs(data.vx) * restitution + 0.5;
    } else if (data.x > config.canvasWidth - radius) {
      data.x = config.canvasWidth - radius;
      data.vx = -Math.abs(data.vx) * restitution - 0.5;
    }
    
    // Top and bottom boundaries
    if (data.y < topBoundary) {
      data.y = topBoundary;
      data.vy = Math.abs(data.vy) * restitution + 0.5;
    } else if (data.y > config.canvasHeight - radius) {
      data.y = config.canvasHeight - radius;
      data.vy = -Math.abs(data.vy) * restitution - 0.5;
    }

    // Velocity damping
    data.vx *= 0.995;
    data.vy *= 0.995;

    // Velocity limits
    const maxVelocity = 1.0;
    const velocityMagnitude = Math.sqrt(data.vx * data.vx + data.vy * data.vy);
    if (velocityMagnitude > maxVelocity) {
      data.vx = (data.vx / velocityMagnitude) * maxVelocity;
      data.vy = (data.vy / velocityMagnitude) * maxVelocity;
    }
  });

  // Populate spatial grid
  bubbles.forEach(data => {
    if (config.draggedBubble === data.id) return;
    const radius = data.currentSize / 2;
    spatialGrid.addBubble(data, radius);
  });

  // Collision detection
  bubbles.forEach(dataA => {
    if (config.draggedBubble === dataA.id) return;

    const radiusA = dataA.currentSize / 2;
    const nearbyBubbles = spatialGrid.getNearbyBubbles(dataA, radiusA);
    
    nearbyBubbles.forEach(dataB => {
      if (config.draggedBubble === dataB.id) return;

      // Calculate distance between bubble centers
      const dx = dataB.x - dataA.x;
      const dy = dataB.y - dataA.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (dataA.currentSize + dataB.currentSize) / 2;

      // Check for collision
      if (distance < minDistance + 2 && distance > 0) {
        // Calculate collision normal
        const normalX = dx / distance;
        const normalY = dy / distance;

        // Separate bubbles
        const overlap = minDistance - distance + 4;
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

        // Collision response
        const restitution = 0.9;
        const impulse = 2 * relativeSpeed / (1 + 1);
        const impulseX = impulse * normalX * restitution;
        const impulseY = impulse * normalY * restitution;

        // Apply impulse
        const minBounce = 0.3;
        dataA.vx += impulseX + (Math.random() - 0.5) * minBounce;
        dataA.vy += impulseY + (Math.random() - 0.5) * minBounce;
        dataB.vx -= impulseX + (Math.random() - 0.5) * minBounce;
        dataB.vy -= impulseY + (Math.random() - 0.5) * minBounce;
      }
    });
  });

  // Collect results
  bubbles.forEach(data => {
    results.push({
      id: data.id,
      x: data.x,
      y: data.y,
      size: data.currentSize
    });
  });

  return results;
}

// Message handling
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'init':
      initializeBubbles(data.bubbles, data.headerHeight);
      break;
      
    case 'update':
      const results = updatePhysics(data.config);
      self.postMessage({ type: 'physics-update', data: results });
      break;
      
    case 'updateBubble':
      if (bubbleDataMap.has(data.id)) {
        const bubble = bubbleDataMap.get(data.id)!;
        bubble.x = data.x;
        bubble.y = data.y;
      }
      break;
  }
};