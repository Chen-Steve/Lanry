'use client';

import { useEffect, useState, useCallback } from 'react';

const SPRITE_CONFIG = {
  scale: 2,
  walk: {
    src: '/walk.png',
    frameWidth: 32,
    frameHeight: 32,
    frames: 4,
  },
  idle: {
    src: '/idle.png',
    frameWidth: 32,
    frameHeight: 32,
    frames: 4,
  },
  idle_lick: {
    src: '/idle_lick.png',
    frameWidth: 32,
    frameHeight: 32,
    frames: 4,
  }
};

const FOLLOW_CONFIG = {
  targetDistance: 50,
  speed: 0.5,
  startDelay: 2000,
};

const CatFollower = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [catPosition, setCatPosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [spritePosition, setSpritePosition] = useState(0);
  const [shouldFollow, setShouldFollow] = useState(false);
  const [currentIdleSprite, setCurrentIdleSprite] = useState<'idle' | 'idle_lick'>('idle');

  const getNearestEdgePoint = useCallback((x: number, y: number) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const distToLeft = x;
    const distToRight = width - x;
    const distToTop = y;
    const distToBottom = height - y;
    
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
    
    if (minDist === distToLeft) return { x: 0, y };
    if (minDist === distToRight) return { x: width, y };
    if (minDist === distToTop) return { x, y: 0 };
    return { x, y: height };
  }, []);

  // Updated movement logic without acceleration
  useEffect(() => {
    const moveTowardsTarget = () => {
      if (!shouldFollow) return;

      setCatPosition(current => {
        const dx = position.x - current.x;
        const dy = position.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < FOLLOW_CONFIG.targetDistance) {
          setIsMoving(false);
          return current;
        }

        setIsMoving(true);

        // Calculate direction vector and normalize it
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Move at constant speed in the calculated direction
        const newX = current.x + dirX * FOLLOW_CONFIG.speed;
        const newY = current.y + dirY * FOLLOW_CONFIG.speed;

        return { x: newX, y: newY };
      });
    };

    const animationFrame = requestAnimationFrame(moveTowardsTarget);
    return () => cancelAnimationFrame(animationFrame);
  }, [position, catPosition, shouldFollow]);

  // Mouse movement handler with delay
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      if (catPosition.x === 0 && catPosition.y === 0) {
        const edgePoint = getNearestEdgePoint(e.clientX, e.clientY);
        setCatPosition(edgePoint);
        
        // Start following after delay
        setTimeout(() => {
          setShouldFollow(true);
        }, FOLLOW_CONFIG.startDelay);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [getNearestEdgePoint, catPosition]);

  // Sprite animation
  useEffect(() => {
    const currentSprite = isMoving ? SPRITE_CONFIG.walk : SPRITE_CONFIG[currentIdleSprite];
    const animationSpeed = isMoving ? 150 : 300;

    const interval = setInterval(() => {
      setSpritePosition((prev) => 
        (prev + currentSprite.frameWidth) % (currentSprite.frameWidth * currentSprite.frames)
      );
    }, animationSpeed);
    
    return () => clearInterval(interval);
  }, [isMoving, currentIdleSprite]);

  // Add new effect for switching idle animations
  useEffect(() => {
    if (isMoving) {
      setCurrentIdleSprite('idle');
      return;
    }

    const switchIdleAnimation = () => {
      const shouldLick = Math.random() < 0.3; // 30% chance to switch to licking
      setCurrentIdleSprite(shouldLick ? 'idle_lick' : 'idle');
    };

    const interval = setInterval(switchIdleAnimation, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [isMoving]);

  return (
    <div
      style={{
        position: 'fixed',
        left: catPosition.x - (SPRITE_CONFIG.walk.frameWidth * SPRITE_CONFIG.scale) / 2,
        top: catPosition.y - (SPRITE_CONFIG.walk.frameHeight * SPRITE_CONFIG.scale) / 2,
        width: SPRITE_CONFIG.walk.frameWidth * SPRITE_CONFIG.scale + 'px',
        height: SPRITE_CONFIG.walk.frameHeight * SPRITE_CONFIG.scale + 'px',
        backgroundImage: `url(${isMoving ? SPRITE_CONFIG.walk.src : SPRITE_CONFIG[currentIdleSprite].src})`,
        backgroundPosition: `-${spritePosition * SPRITE_CONFIG.scale}px 0`,
        backgroundSize: `${(isMoving ? SPRITE_CONFIG.walk : SPRITE_CONFIG[currentIdleSprite]).frameWidth * 
          (isMoving ? SPRITE_CONFIG.walk : SPRITE_CONFIG[currentIdleSprite]).frames * 
          SPRITE_CONFIG.scale}px ${
          (isMoving ? SPRITE_CONFIG.walk : SPRITE_CONFIG[currentIdleSprite]).frameHeight * 
          SPRITE_CONFIG.scale}px`,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
        zIndex: 9999,
        transform: `scaleX(${position.x > catPosition.x ? 1 : -1})`,
      }}
    />
  );
};

export default CatFollower; 