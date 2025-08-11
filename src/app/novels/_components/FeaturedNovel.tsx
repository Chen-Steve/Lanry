'use client';

import { Novel } from '@/types/database';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface FeaturedNovelProps {
  novels: Novel[];
}

const FeaturedNovel = ({ novels }: FeaturedNovelProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const [stepSize, setStepSize] = useState<number>(0);
  const [maxStartIndex, setMaxStartIndex] = useState<number>(0);
  const [constraints, setConstraints] = useState<{ left: number; right: number }>({ left: 0, right: 0 });
  const draggingRef = useRef<boolean>(false);

  // Squiggly clip-path for mobile card edges
  const mobileClip = 'polygon(0 0,100% 0,100% 5%,98% 8%,100% 11%,98% 14%,100% 17%,98% 20%,100% 23%,98% 26%,100% 29%,98% 32%,100% 35%,98% 38%,100% 41%,98% 44%,100% 47%,98% 50%,100% 53%,98% 56%,100% 59%,98% 62%,100% 65%,98% 68%,100% 71%,98% 74%,100% 77%,98% 80%,100% 83%,98% 86%,100% 89%,98% 92%,100% 95%,100% 100%,0 100%,0 95%,2% 92%,0 89%,2% 86%,0 83%,2% 80%,0 77%,2% 74%,0 71%,2% 68%,0 65%,2% 62%,0 59%,2% 56%,0 53%,2% 50%,0 47%,2% 44%,0 41%,2% 38%,0 35%,2% 32%,0 29%,2% 26%,0 23%,2% 20%,0 17%,2% 14%,0 11%,2% 8%,0 5%)';

  // Track desktop breakpoint (lg: 1024px)
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Measure step size and drag constraints
  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const compute = () => {
      // Step size from first two children (includes gap). Fallback to first width.
      if (inner.children.length >= 2) {
        const first = inner.children[0] as HTMLElement;
        const second = inner.children[1] as HTMLElement;
        const step = second.offsetLeft - first.offsetLeft;
        setStepSize(step > 0 ? step : first.getBoundingClientRect().width);
      } else if (inner.children.length === 1) {
        const only = inner.children[0] as HTMLElement;
        setStepSize(only.getBoundingClientRect().width);
      } else {
        setStepSize(0);
      }

      const containerWidth = container.clientWidth;
      const contentWidth = inner.scrollWidth;
      const left = Math.min(0, containerWidth - contentWidth);
      setConstraints({ left, right: 0 });

      const visibleCount = isDesktop ? 3 : 1;
      setMaxStartIndex(Math.max(0, novels.length - visibleCount));
      // Snap to current index to avoid drift after resize
      const targetX = -Math.min(currentIndex, Math.max(0, novels.length - visibleCount)) * stepSize;
      x.set(targetX);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(container);
    ro.observe(inner);
    Array.from(inner.children).forEach((c) => ro.observe(c as Element));
    return () => ro.disconnect();
  }, [novels.length, isDesktop, currentIndex, x, stepSize]);

  const animateToIndex = useCallback((index: number) => {
    const clamped = Math.min(Math.max(index, 0), maxStartIndex);
    setCurrentIndex(clamped);
    const targetX = -clamped * stepSize;
    animate(x, targetX, { type: 'spring', stiffness: 550, damping: 38 });
  }, [maxStartIndex, stepSize, x]);

  if (novels.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <motion.div
        ref={innerRef}
        className="flex items-stretch gap-3 px-1"
        style={{ x }}
        drag="x"
        dragConstraints={constraints}
        dragElastic={0.25}
        dragMomentum
        onDragStart={() => { draggingRef.current = true; }}
        onDragEnd={(_e, info) => {
          // project momentum for natural feel
          const projected = x.get() + info.velocity.x * 0.18;
          const rawIndex = Math.round(-projected / Math.max(stepSize, 1));
          const clamped = Math.min(Math.max(rawIndex, 0), maxStartIndex);
          animateToIndex(clamped);
          // allow clicks shortly after if movement was tiny
          setTimeout(() => { draggingRef.current = false; }, 50);
        }}
      >
        {novels.map((novel) => (
          <div key={novel.id} className="flex-none w-[88%] lg:w-1/3">
            <Link
              href={`/novels/${novel.slug}`}
              className="group relative block p-2 overflow-hidden aspect-[3/2] lg:aspect-[3/2] min-h-[140px] lg:min-h-[220px] bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${novel.coverImageUrl})`, clipPath: mobileClip }}
              onClick={(e) => {
                if (draggingRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex flex-row gap-4 w-full items-start">
                <div className="flex-1 min-w-0 flex flex-col h-full px-2 sm:px-4">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-white transition-colors mb-2 sm:mb-1 line-clamp-2 sm:line-clamp-1">
                    {novel.title}
                  </h3>
                  {novel.tags?.length ? (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {novel.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag.id}
                          className="bg-white/20 text-white text-xs sm:text-sm px-2 sm:px-3 py-0.5 rounded-full backdrop-blur-md"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex justify-start mt-auto">
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2 sm:px-4 sm:py-1 bg-red-600 hover:bg-red-700 text-white text-base sm:text-sm rounded-full transition-colors"
                      aria-label="Read now"
                    >
                      Read now
                      <Icon icon="mdi:arrow-right" className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </motion.div>

      {novels.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {Array.from({ length: Math.max(1, maxStartIndex + 1) }, (_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => animateToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === i ? 'w-5 bg-primary' : 'w-2 bg-foreground/30 hover:bg-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedNovel;