/**
 * Auto-scrolling functionality for the carousel that:
 * - Scrolls slowly to the left automatically
 * - Pauses when user interacts (drag, swipe, wheel)
 * - Pauses when the carousel is out of viewport
 * - Resumes from the same position when back in view
 */

document.addEventListener('DOMContentLoaded', () => {
  // Find all carousel containers on the page
  const carouselContainers = document.querySelectorAll('.carousel-container');

  carouselContainers.forEach(container => {
    // Wait for the carousel to be initialized first
    const checkForCarousel = setInterval(() => {
      if (container.carousel instanceof TrulyInfiniteCarousel) {
        clearInterval(checkForCarousel);
        initAutoScroll(container);
      }
    }, 100);
  });

  function initAutoScroll(container) {
    const carousel = container.carousel;

    // Configuration
    const scrollSpeed = 0.3; // Pixels per frame (lower = slower)
    let isScrolling = true;
    let isInteracting = false;
    let isVisible = false;
    let animationId = null;
    let wheelTimeout = null;
    
    // Explicitly set the itemSpacing for more consistent layout
    if (carousel.options) {
      // Increase spacing to prevent overlapping (mobile vs desktop)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      carousel.options.itemSpacing = isMobile ? 60 : 80;
    }

    // Fix z-indexing for mobile items to prevent stacking issues
    function fixItemZindexing() {
      if (carousel.virtualItems) {
        // Sort items by their position to determine proper z-index
        const sortedItems = [...carousel.virtualItems].sort((a, b) => {
          if (a.wrappedPosition && b.wrappedPosition) {
            return a.wrappedPosition - b.wrappedPosition;
          } else if (a.x && b.x) {
            return a.x - b.x;
          }
          return a.index - b.index;
        });

        // Set z-index based on position - further left = lower z-index
        sortedItems.forEach((item, index) => {
          if (item.element) {
            // Make sure elements don't share the same z-index
            const zIndex = 100 + index * 10;
            item.element.style.zIndex = zIndex;
            
            // Clear any transform that might be causing issues
            if (!item.onScreen) {
              item.element.style.transform = 'none'; 
              item.element.style.display = 'none';
            }
            
            // Set explicit width based on content to avoid overlap
            const imgElement = item.element.querySelector('img, video');
            if (imgElement) {
              item.element.style.width = `${imgElement.offsetWidth}px`;
            }
          }
        });
      }
    }

    // Set up Intersection Observer to track visibility
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          // Only start scrolling if not currently interacting
          if (!isInteracting && !animationId) {
            startAutoScroll();
          }

          // Fix z-index issues when coming into view
          fixItemZindexing();
        } else {
          // Stop scrolling when out of view
          stopAutoScroll();
        }
      });
    }, {
      threshold: 0.1 // Consider visible when 10% is in viewport
    });

    // Observe the carousel container
    observer.observe(container);

    // Auto-scroll animation function
    function autoScroll() {
      if (isScrolling && !carousel.isDragging && !carousel.isScrolling) {
        // Move slightly to the left
        carousel.offset += scrollSpeed;
        carousel.renderItems();

        // Apply z-index fixing on each frame to ensure proper stacking
        fixItemZindexing();
        
        // Re-measure and adjust item positions every few frames
        if (Math.random() < 0.01) { // Occasionally remeasure
          // Force a measurement update to ensure proper spacing
          carousel.measureDimensions();
          
          // Update spacings between items
          carousel.virtualItems.forEach(item => {
            if (item.element && item.element.style) {
              item.element.style.margin = '0 40px';
            }
          });
        }
      }

      animationId = requestAnimationFrame(autoScroll);
    }

    function startAutoScroll() {
      if (!animationId) {
        animationId = requestAnimationFrame(autoScroll);
      }
    }

    function stopAutoScroll() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    // Add special handling for drag interactions
    container.addEventListener('carousel-drag-start', () => {
      // During drag, fix z-indexing to prevent stacking issues
      fixItemZindexing();

      // Ensure the currently focused item is on top
      if (carousel.virtualItems && carousel.currentIndex >= 0) {
        const currentItem = carousel.virtualItems[carousel.currentIndex];
        if (currentItem && currentItem.element) {
          currentItem.element.style.zIndex = 100; // Put active item on top
        }
      }
    });

    // Listen for user interactions to pause auto-scrolling
    const interactionEvents = [
      { element: carousel.track, event: 'mousedown', type: 'start' },
      { element: window, event: 'mousemove', type: 'during' },
      { element: window, event: 'mouseup', type: 'end' },
      { element: carousel.track, event: 'touchstart', type: 'start' },
      { element: window, event: 'touchmove', type: 'during' },
      { element: window, event: 'touchend', type: 'end' },
      { element: container, event: 'wheel', type: 'wheel' }
    ];

    interactionEvents.forEach(({ element, event, type }) => {
      element.addEventListener(event, (e) => {
        if (type === 'start') {
          isInteracting = true;
          stopAutoScroll();

          // Fix z-indexing on interaction start
          fixItemZindexing();
        } else if (type === 'end') {
          isInteracting = false;
          // Resume scrolling if still visible
          if (isVisible) {
            // Small delay before resuming to ensure user is done
            setTimeout(() => {
              if (!isInteracting && isVisible) {
                startAutoScroll();
              }
            }, 200);
          }
        } else if (type === 'wheel') {
          // For wheel events, pause briefly then resume
          isInteracting = true;
          stopAutoScroll();

          if (wheelTimeout) clearTimeout(wheelTimeout);
          wheelTimeout = setTimeout(() => {
            isInteracting = false;
            if (isVisible) {
              startAutoScroll();
            }
          }, 1000);
        }
      }, { passive: true });
    });

    // Listen for custom carousel events
    container.addEventListener('carouselInteractionStart', () => {
      isInteracting = true;
      stopAutoScroll();
      fixItemZindexing();
    });

    container.addEventListener('carouselInteractionEnd', () => {
      isInteracting = false;
      if (isVisible) {
        setTimeout(() => {
          if (!isInteracting && isVisible) {
            startAutoScroll();
          }
        }, 200);
      }
    });

    // Initial z-index fixing
    setTimeout(fixItemZindexing, 500);

    // Initial start if visible
    if (isVisible) {
      startAutoScroll();
    }
  }
});