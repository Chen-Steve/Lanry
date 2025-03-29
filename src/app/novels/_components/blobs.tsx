'use client';

import { useEffect, useRef, useState } from 'react';

const LavaBlobs = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseOver = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint in Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const PARTICLE_COUNT = isMobile ? 300 : 600;
    const INTERACTION_RADIUS = 20;
    const MOUSE_FORCE = 1500;
    const MOUSE_RADIUS = 40;

    const particles = initializeParticles(
      PARTICLE_COUNT,
      canvas.width,
      canvas.height,
    );

    const dt = 0.016;
    const GRAVITY = [0, 150]; // Reduced from 300 for slower movement

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseEnter = () => {
      isMouseOver.current = true;
    };

    const handleMouseLeave = () => {
      isMouseOver.current = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    function update() {
      if (!canvas || !ctx) return;

      applyForces(particles, dt, GRAVITY);

      if (isMouseOver.current) {
        applyMouseForces(particles, mousePos.current, MOUSE_FORCE, MOUSE_RADIUS);
      }

      applyDoubleDensityRelaxation(particles, INTERACTION_RADIUS);
      containParticlesToRect(particles, canvas.width, canvas.height, INTERACTION_RADIUS);
      updateVelocities(particles, dt);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawMetaballs(ctx, particles);

      animationFrameId = requestAnimationFrame(update);
    }

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isMobile]); // Re-run effect when mobile state changes

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
};

export default LavaBlobs;

// Helper functions

interface Particle {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  vx: number;
  vy: number;
  p: number;
  pNear: number;
  g?: number;
}

function initializeParticles(
  count: number,
  width: number,
  height: number,
) {
  const particles: Particle[] = [];
  const margin = 50; // Keep particles away from edges

  for (let i = 0; i < count; i++) {
    const x = margin + Math.random() * (width - 2 * margin);
    const y = margin + Math.random() * (height - 2 * margin);
    particles.push({
      x,
      y,
      oldX: x,
      oldY: y,
      vx: 0,
      vy: 0,
      p: 0,
      pNear: 0,
    });
  }
  return particles;
}

function applyForces(particles: Particle[], dt: number, gravity: number[]) {
  for (const p of particles) {
    p.oldX = p.x;
    p.oldY = p.y;
    // Apply gravity over time
    p.vx += gravity[0] * dt;
    p.vy += gravity[1] * dt;
    // Update positions over time
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function applyDoubleDensityRelaxation(
  particles: Particle[],
  interactionRadius: number,
) {
  const REST_DENSITY = 8;
  const STIFFNESS = 0.12; // Increased from 0.08 for more bounce
  const STIFFNESS_NEAR = 0.12; // Increased from 0.08 for more bounce

  const interactionRadiusSq = interactionRadius * interactionRadius;

  // Use a spatial grid to optimize particle interactions
  const gridSize = interactionRadius * 2;
  const grid: { [key: string]: Particle[] } = {};
  
  // Assign particles to grid cells
  for (const p of particles) {
    const gridX = Math.floor(p.x / gridSize);
    const gridY = Math.floor(p.y / gridSize);
    const key = `${gridX},${gridY}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(p);
  }

  for (let i = 0; i < particles.length; i++) {
    const p_i = particles[i];
    const gridX = Math.floor(p_i.x / gridSize);
    const gridY = Math.floor(p_i.y / gridSize);

    let density = 0;
    let nearDensity = 0;

    // Only check particles in neighboring grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cellParticles = grid[key] || [];
        
        for (const p_j of cellParticles) {
          if (p_i === p_j) continue;

          const dx = p_j.x - p_i.x;
          const dy = p_j.y - p_i.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < interactionRadiusSq) {
            const distance = Math.sqrt(distanceSq);
            const q = 1 - distance / interactionRadius;
            const qSq = q * q;
            const qCube = qSq * q;

            density += qSq;
            nearDensity += qCube;

            const pressure = STIFFNESS * (density - REST_DENSITY);
            const nearPressure = STIFFNESS_NEAR * nearDensity;

            const magnitude = (pressure + nearPressure) * q;
            const nx = dx / distance || 0;
            const ny = dy / distance || 0;

            const D = magnitude * 0.5;
            p_i.x -= D * nx;
            p_i.y -= D * ny;
            p_j.x += D * nx;
            p_j.y += D * ny;
          }
        }
      }
    }
  }
}

function applyMouseForces(
  particles: Particle[],
  mousePos: { x: number; y: number },
  force: number,
  radius: number,
) {
  const radiusSq = radius * radius;

  for (const p of particles) {
    const dx = p.x - mousePos.x;
    const dy = p.y - mousePos.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < radiusSq) {
      const dist = Math.sqrt(distSq);
      const strength = force * (1 - dist / radius);
      const nx = dx / dist || 0;
      const ny = dy / dist || 0;

      p.vx += nx * strength;
      p.vy += ny * strength;
    }
  }
}

function containParticlesToRect(
  particles: Particle[],
  width: number,
  height: number,
  interactionRadius: number,
) {
  const margin = interactionRadius;

  for (const p of particles) {
    // Contain horizontally
    if (p.x < margin) {
      p.x = margin;
      p.vx = Math.abs(p.vx) * 0.7; // Increased from 0.5 for more bounce
    } else if (p.x > width - margin) {
      p.x = width - margin;
      p.vx = -Math.abs(p.vx) * 0.7; // Increased from 0.5 for more bounce
    }

    // Contain vertically
    if (p.y < margin) {
      p.y = margin;
      p.vy = Math.abs(p.vy) * 0.7; // Increased from 0.5 for more bounce
    } else if (p.y > height - margin) {
      p.y = height - margin;
      p.vy = -Math.abs(p.vy) * 0.7; // Increased from 0.5 for more bounce
    }

    // Anti-stick correction
    if (p.x < margin) p.oldX += margin - p.x;
    if (p.x > width - margin) p.oldX -= p.x - (width - margin);
    if (p.y < margin) p.oldY += margin - p.y;
    if (p.y > height - margin) p.oldY -= p.y - (height - margin);
  }
}

function updateVelocities(particles: Particle[], dt: number) {
  for (const p of particles) {
    p.vx = (p.x - p.oldX) / dt;
    p.vy = (p.y - p.oldY) / dt;
  }
}

// Metaballs rendering using offscreen canvas
function drawMetaballs(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  // Create offscreen canvas at full resolution
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = canvasWidth;
  offscreenCanvas.height = canvasHeight;
  const offscreenCtx = offscreenCanvas.getContext('2d');
  if (!offscreenCtx) return;

  // Draw particles as radial gradients
  for (const p of particles) {
    const gradient = offscreenCtx.createRadialGradient(
      p.x,
      p.y,
      0,
      p.x,
      p.y,
      40, // Reduced from 50
    );
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

    offscreenCtx.fillStyle = gradient;
    offscreenCtx.beginPath();
    offscreenCtx.arc(p.x, p.y, 40, 0, Math.PI * 2);
    offscreenCtx.fill();
  }

  // Apply a threshold to create the metaball effect
  const imageData = offscreenCtx.getImageData(
    0,
    0,
    canvasWidth,
    canvasHeight,
  );
  const data = imageData.data;

  // Apply a threshold to alpha channel
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 100) {
      data[i] = 0;
    }
  }

  // Draw the result at full resolution
  ctx.putImageData(imageData, 0, 0);
} 