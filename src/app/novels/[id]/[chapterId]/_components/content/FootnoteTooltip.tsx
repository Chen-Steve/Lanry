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
      const minWidth = Math.min(300, viewportWidth - 32); // 32px for 16px padding on each side
      tooltip.style.minWidth = `${minWidth}px`;
      tooltip.style.maxWidth = `${Math.min(500, viewportWidth - 32)}px`;

      // Calculate horizontal position
      const tooltipRect = tooltip.getBoundingClientRect();
      const halfTooltipWidth = tooltipRect.width / 2;
      const centerX = rect.left + (rect.width / 2);
      
      // Check if tooltip would overflow on either side
      const wouldOverflowLeft = centerX - halfTooltipWidth < 16;
      const wouldOverflowRight = centerX + halfTooltipWidth > viewportWidth - 16;

      if (wouldOverflowLeft) {
        // Align to left edge with padding
        tooltip.style.left = '16px';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'none';
        // Move arrow to match footnote position
        const arrow = tooltip.querySelector('.arrow') as HTMLElement;
        if (arrow) {
          const arrowX = centerX - 16; // 16px is left padding
          arrow.style.left = `${arrowX}px`;
          arrow.style.transform = 'rotate(45deg)';
          arrow.style.right = 'auto';
        }
      } else if (wouldOverflowRight) {
        // Align to right edge with padding
        tooltip.style.right = '16px';
        tooltip.style.left = 'auto';
        tooltip.style.transform = 'none';
        // Move arrow to match footnote position
        const arrow = tooltip.querySelector('.arrow') as HTMLElement;
        if (arrow) {
          const arrowX = viewportWidth - centerX - 16; // 16px is right padding
          arrow.style.right = `${arrowX}px`;
          arrow.style.transform = 'rotate(45deg)';
          arrow.style.left = 'auto';
        }
      } else {
        // Center align if no overflow
        tooltip.style.left = '50%';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'translateX(-50%)';
        // Reset arrow position
        const arrow = tooltip.querySelector('.arrow') as HTMLElement;
        if (arrow) {
          arrow.style.left = '50%';
          arrow.style.right = 'auto';
          arrow.style.transform = 'translateX(-50%) rotate(45deg)';
        }
      }

      // Vertical positioning with more space for images
      const minSpaceNeeded = 150; // Minimum space needed for tooltip
      if (spaceBelow >= minSpaceNeeded || spaceBelow > spaceAbove) {
        tooltip.style.top = 'calc(100% + 12px)';
        tooltip.style.bottom = 'auto';
        tooltip.classList.add('tooltip-bottom');
        tooltip.classList.remove('tooltip-top');
      } else {
        tooltip.style.bottom = 'calc(100% + 12px)';
        tooltip.style.top = 'auto';
        tooltip.classList.add('tooltip-top');
        tooltip.classList.remove('tooltip-bottom');
      }

      // Handle images
      const images = tooltip.querySelectorAll('img');
      images.forEach(img => {
        img.addEventListener('load', () => {
          // Reposition tooltip after image loads
          positionTooltip(tooltip, wrapper);
        });
      });
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

        if (e.type === 'click' || e.type === 'touchend') {
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

    // Add event listeners for both mouse and touch interactions
    document.addEventListener('click', handleInteractions);
    document.addEventListener('touchend', handleInteractions);
    
    // Enhance mobile experience with explicit touch handling
    const touchEvents: Record<string, number> = {};
    
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as Element;
      const footnote = target.closest('.footnote');
      if (footnote) {
        // Prevent this touch from triggering paragraph handlers
        e.stopPropagation();
        
        // Store the touch start time
        const touchId = `touch_${Date.now()}`;
        touchEvents[touchId] = Date.now();
        
        // Clean up this touch ID after a delay
        setTimeout(() => {
          delete touchEvents[touchId];
        }, 1000);
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    
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
    
    // Handle closing tooltips when tapping elsewhere
    const handleDocumentTap = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element;
      if (!target.closest('.footnote') && !target.closest('.footnote-tooltip')) {
        document.querySelectorAll('.footnote-tooltip.pinned').forEach(tooltip => {
          tooltip.classList.remove('pinned', 'opacity-100', 'visible');
          tooltip.classList.add('opacity-0', 'invisible');
        });
      }
    };
    
    document.addEventListener('click', handleDocumentTap);
    document.addEventListener('touchend', handleDocumentTap);
    
    return () => {
      document.removeEventListener('click', handleInteractions);
      document.removeEventListener('touchend', handleInteractions);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('click', handleDocumentTap);
      document.removeEventListener('touchend', handleDocumentTap);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return null; // This is a utility component that only handles events
} 