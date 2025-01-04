import { useEffect } from 'react';

export default function FootnoteTooltip() {
  useEffect(() => {
    const positionTooltip = (tooltip: HTMLElement, wrapper: Element) => {
      const rect = wrapper.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      
      // Set minimum width but don't exceed viewport width minus padding
      const minWidth = Math.min(200, viewportWidth - 32); // 32px for 16px padding on each side
      tooltip.style.minWidth = `${minWidth}px`;
      tooltip.style.maxWidth = `${viewportWidth - 32}px`;

      // Calculate horizontal position
      const tooltipRect = tooltip.getBoundingClientRect();
      const halfTooltipWidth = tooltipRect.width / 2;
      const centerX = rect.left + (rect.width / 2);
      
      // Check if tooltip would overflow on either side
      const wouldOverflowLeft = centerX - halfTooltipWidth < 16; // 16px padding
      const wouldOverflowRight = centerX + halfTooltipWidth > viewportWidth - 16;

      if (wouldOverflowLeft) {
        // Align to left edge with padding
        tooltip.style.left = '16px';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'none';
      } else if (wouldOverflowRight) {
        // Align to right edge with padding
        tooltip.style.right = '16px';
        tooltip.style.left = 'auto';
        tooltip.style.transform = 'none';
      } else {
        // Center align if no overflow
        tooltip.style.left = '50%';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'translateX(-50%)';
      }

      // Vertical positioning
      if (spaceBelow >= 100 || spaceBelow > spaceAbove) {
        tooltip.style.top = 'calc(100% + 5px)';
        tooltip.style.bottom = 'auto';
      } else {
        tooltip.style.bottom = 'calc(100% + 5px)';
        tooltip.style.top = 'auto';
      }
    };

    // Use event delegation for footnote interactions
    const handleInteractions = (e: Event) => {
      const target = e.target instanceof Element ? e.target : (e.target as { parentElement?: Element })?.parentElement;
      if (!target) return;

      // Handle footnotes
      const footnote = target.closest('.footnote');
      if (footnote) {
        e.preventDefault();
        e.stopPropagation();
        
        const wrapper = footnote.closest('.footnote-wrapper');
        if (!wrapper) return;
        
        const tooltip = wrapper.querySelector('.footnote-tooltip') as HTMLElement;
        if (!tooltip) return;

        if (e.type === 'click') {
          // Remove pinned class from all other tooltips
          document.querySelectorAll('.footnote-tooltip.pinned').forEach(t => {
            if (t !== tooltip) {
              t.classList.remove('pinned', 'opacity-100', 'visible');
              t.classList.add('opacity-0', 'invisible');
            }
          });
          
          // Toggle pinned state for this tooltip
          const wasPinned = tooltip.classList.contains('pinned');
          
          if (wasPinned) {
            tooltip.classList.remove('pinned', 'opacity-100', 'visible');
            tooltip.classList.add('opacity-0', 'invisible');
          } else {
            tooltip.classList.add('pinned', 'opacity-100', 'visible');
            tooltip.classList.remove('opacity-0', 'invisible');
            positionTooltip(tooltip, wrapper);
          }
        }
      }
    };

    // Add event listeners
    document.addEventListener('click', handleInteractions);
    
    // Handle repositioning on resize
    const handleResize = () => {
      const pinnedTooltip = document.querySelector('.footnote-tooltip.pinned') as HTMLElement;
      if (pinnedTooltip) {
        const wrapper = pinnedTooltip.closest('.footnote-wrapper');
        if (wrapper) {
          positionTooltip(pinnedTooltip, wrapper);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('click', handleInteractions);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return null; // This is a utility component that only handles events
} 