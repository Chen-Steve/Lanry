'use client';

import { useEffect, useRef } from 'react';

interface FloatingElementsProps {
  className?: string;
}

const FloatingElements: React.FC<FloatingElementsProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match its display size
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        const { devicePixelRatio: ratio = 1 } = window;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.scale(ratio, ratio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Define our floating elements
    type ElementShape = 'circle' | 'squiggle' | 'macaroni' | 'star' | 'confetti';
    type Element = {
      x: number;
      y: number;
      size: number;
      speed: number;
      angle: number;
      rotationSpeed: number;
      rotation: number;
      shape: ElementShape;
      color: string;
      alpha: number;
    };

    // Create a collection of elements
    const elements: Element[] = [];
    const colors = [
      '#8b5cf6', // purple-500
      '#6366f1', // indigo-500
      '#a855f7', // purple-600
      '#4f46e5', // indigo-600
      '#c084fc', // purple-400
      '#818cf8', // indigo-400
      '#d946ef', // fuchsia-500
      '#ec4899', // pink-500
      '#8b5cf6', // purple-500
      '#3b82f6', // blue-500
      '#06b6d4', // cyan-500
      '#f472b6', // pink-400
    ];

    // Generate elements - SIGNIFICANTLY increased element count and visibility
    const generateElements = () => {
      // Drastically increased density - 1 element per 2500 pixels instead of 5000
      const elementCount = Math.max(50, Math.floor(canvas.width * canvas.height / 2500));
      
      for (let i = 0; i < elementCount; i++) {
        const shape: ElementShape = ['circle', 'squiggle', 'macaroni', 'star', 'confetti'][Math.floor(Math.random() * 5)] as ElementShape;
        // Larger size range - up to 30px
        const size = 10 + Math.random() * 20;
        
        elements.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size,
          // Faster movement
          speed: 0.3 + Math.random() * 0.6,
          angle: Math.random() * Math.PI * 2,
          // Faster rotation
          rotationSpeed: (Math.random() - 0.5) * 0.05,
          rotation: Math.random() * Math.PI * 2,
          shape,
          color: colors[Math.floor(Math.random() * colors.length)],
          // Much higher opacity - minimum 0.4, up to 0.8
          alpha: 0.4 + Math.random() * 0.4
        });
      }
    };

    // Draw functions for different shapes
    const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawSquiggle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.bezierCurveTo(-size / 4, -size / 2, size / 4, size / 2, size / 2, 0);
      // Make lines thicker
      ctx.lineWidth = size / 3;
      ctx.stroke();
      
      ctx.restore();
    };

    const drawMacaroni = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 1.5);
      // Make lines thicker
      ctx.lineWidth = size / 3;
      ctx.stroke();
      
      ctx.restore();
    };

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * 2 * i) / (spikes * 2);
        const pointX = Math.cos(angle) * radius;
        const pointY = Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          ctx.lineTo(pointX, pointY);
        }
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawConfetti = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      
      ctx.restore();
    };

    // Draw an element based on its shape
    const drawElement = (ctx: CanvasRenderingContext2D, element: Element) => {
      ctx.fillStyle = element.color;
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.size / 4;
      ctx.globalAlpha = element.alpha;
      
      switch (element.shape) {
        case 'circle':
          drawCircle(ctx, element.x, element.y, element.size, element.rotation);
          break;
        case 'squiggle':
          drawSquiggle(ctx, element.x, element.y, element.size, element.rotation);
          break;
        case 'macaroni':
          drawMacaroni(ctx, element.x, element.y, element.size, element.rotation);
          break;
        case 'star':
          drawStar(ctx, element.x, element.y, element.size, element.rotation);
          break;
        case 'confetti':
          drawConfetti(ctx, element.x, element.y, element.size, element.rotation);
          break;
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw each element
      elements.forEach(element => {
        // Update position - slightly slowed down
        element.x += Math.cos(element.angle) * element.speed;
        element.y += Math.sin(element.angle) * element.speed;
        
        // Update rotation
        element.rotation += element.rotationSpeed;
        
        // Bounce off edges
        if (element.x < 0 || element.x > canvas.width) {
          element.angle = Math.PI - element.angle;
        }
        if (element.y < 0 || element.y > canvas.height) {
          element.angle = -element.angle;
        }
        
        // Draw the element
        drawElement(ctx, element);
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start the animation
    generateElements();
    let animationFrameId = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%', zIndex: 1 }}
    />
  );
};

export default FloatingElements; 