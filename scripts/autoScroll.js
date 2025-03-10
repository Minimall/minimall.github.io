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
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const scrollSpeed = isMobile ? 0.1 : 0.3; // Much slower on mobile for smoother experience
    let isScrolling = true;
    let isInteracting = false;
    let isVisible = false;
    let animationId = null;
    let lastRenderTime = 0;
    
    // Track scroll events at page level to better detect user scrolling
    let isPageScrolling = false;
    let pageScrollTimer = null;

    // Set up Intersection Observer to track visibility
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          // Only start scrolling if not currently interacting
          if (!isInteracting && !animationId && !isPageScrolling) {
            startAutoScroll();
          }
        } else {
          // Stop scrolling when out of view
          stopAutoScroll();
        }
      });
    }, {
      threshold: 0.1, // Consider visible when 10% is in viewport
      rootMargin: '0px 0px 100px 0px' // Add margin to detect earlier
    });

    // Observe the carousel container
    observer.observe(container);

    // Auto-scroll animation function with throttling
    function autoScroll(timestamp) {
      if (!lastRenderTime) lastRenderTime = timestamp;
      
      const elapsed = timestamp - lastRenderTime;
      
      // Only update every 30ms for smoother scrolling (~ 33fps)
      if (elapsed > 30) {
        if (isScrolling && !carousel.isDragging && !carousel.isScrolling && !isPageScrolling) {
          // Move slightly to the left (less on mobile)
          carousel.offset += scrollSpeed;
          carousel.renderItems(false); // Don't animate for smoother movement
        }
        lastRenderTime = timestamp;
      }

      animationId = requestAnimationFrame(autoScroll);
    }

    function startAutoScroll() {
      if (!animationId) {
        lastRenderTime = 0;
        animationId = requestAnimationFrame(autoScroll);
      }
    }

    function stopAutoScroll() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    // Detect page scrolling to better handle touch interactions
    document.addEventListener('scroll', () => {
      if (!isPageScrolling) {
        isPageScrolling = true;
        stopAutoScroll();
      }
      
      clearTimeout(pageScrollTimer);
      pageScrollTimer = setTimeout(() => {
        isPageScrolling = false;
        if (isVisible && !isInteracting) {
          startAutoScroll();
        }
      }, 1000);
    }, { passive: true });

    // Listen for custom carousel events
    container.addEventListener('carouselInteractionStart', () => {
      isInteracting = true;
      stopAutoScroll();
    });
    
    container.addEventListener('carouselInteractionEnd', () => {
      // Add delay before restarting to avoid conflicts
      setTimeout(() => {
        isInteracting = false;
        if (isVisible && !isPageScrolling) {
          startAutoScroll();
        }
      }, 500);
    });

    // Listen for user interactions to pause auto-scrolling
    const interactionEvents = [
      { element: carousel.track, event: 'mousedown', type: 'start' },
      { element: window, event: 'mouseup', type: 'end' },
      { element: carousel.track, event: 'touchstart', type: 'start' },
      { element: window, event: 'touchend', type: 'end' },
      { element: container, event: 'wheel', type: 'wheel' }
    ];

    interactionEvents.forEach(({ element, event, type }) => {
      element.addEventListener(event, (e) => {
        if (type === 'start') {
          isInteracting = true;
          stopAutoScroll();
        } else if (type === 'end') {
          // Add delay before restarting
          setTimeout(() => {
            isInteracting = false;
            if (isVisible && !isPageScrolling) {
              startAutoScroll();
            }
          }, 500);
        } else if (type === 'wheel') {
          // For wheel events, pause briefly then resume
          isInteracting = true;
          stopAutoScroll();

          clearTimeout(wheelTimeout);
          const wheelTimeout = setTimeout(() => {
            isInteracting = false;
            if (isVisible && !isPageScrolling) {
              startAutoScroll();
            }
          }, 1000);
        }
      }, { passive: true });
    });

    // Initial start if visible
    if (isVisible) {
      startAutoScroll();
    }
  }
});