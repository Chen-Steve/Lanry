'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  vx: number;
  vy: number;
}

const LavaBlobs = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const PARTICLE_COUNT = 500;
    const INTERACTION_RADIUS = 30;
    const particles: Particle[] = [];

    // Initialize particles with random velocities
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 200 + 50; // Adjust speed range as needed
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        oldX: 0,
        oldY: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }

    const dt = 0.016;

    function update() {
      if (!canvas || !ctx) return;

      // Apply velocities and integrate positions
      particles.forEach((p) => {
        p.oldX = p.x;
        p.oldY = p.y;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });

      // Double density relaxation
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p_i = particles[i];
        let density = 0;
        let nearDensity = 0;
        const neighbors = [];

        for (let j = 0; j < PARTICLE_COUNT; j++) {
          if (i === j) continue;
          const p_j = particles[j];
          const dx = p_j.x - p_i.x;
          const dy = p_j.y - p_i.y;
          const distanceSq = dx * dx + dy * dy;
          if (
            distanceSq < INTERACTION_RADIUS * INTERACTION_RADIUS
          ) {
            const distance = Math.sqrt(distanceSq);
            const q = 1 - distance / INTERACTION_RADIUS;
            density += q * q;
            nearDensity += q * q * q;
            neighbors.push({ particle: p_j, q });
          }
        }

        const pressure = density - 10;
        const nearPressure = nearDensity;

        // Apply displacements
        neighbors.forEach(({ particle: p_j, q }) => {
          const dx = p_j.x - p_i.x;
          const dy = p_j.y - p_i.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const D =
            (pressure * q + nearPressure * q * q) * dt * dt;
          const nx = dx / distance || 0;
          const ny = dy / distance || 0;

          const D_x = D * nx * 0.5;
          const D_y = D * ny * 0.5;

          p_i.x -= D_x;
          p_i.y -= D_y;
          p_j.x += D_x;
          p_j.y += D_y;
        });
      }

      // Contain particles within canvas
      particles.forEach((p) => {
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -0.5;
        } else if (p.x > canvas.width) {
          p.x = canvas.width;
          p.vx *= -0.5;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -0.5;
        } else if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -0.5;
        }
      });

      // Update velocities
      particles.forEach((p) => {
        p.vx = (p.x - p.oldX) / dt;
        p.vy = (p.y - p.oldY) / dt;
      });

      // Draw particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
      ctx.beginPath();
      particles.forEach((p) => {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      });
      ctx.fill();

      animationFrameId = requestAnimationFrame(update);
    }

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full z-50 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default LavaBlobs; 