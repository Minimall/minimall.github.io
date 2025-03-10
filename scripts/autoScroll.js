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
  
  // Detect if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  carouselContainers.forEach(container => {
    // Wait for the carousel to be initialized first
    const checkForCarousel = setInterval(() => {
      // Check for either desktop or mobile carousel
      if ((container.carousel instanceof TrulyInfiniteCarousel) || 
          (isMobile && window.MobileCarousel && container.carousel instanceof MobileCarousel)) {
        clearInterval(checkForCarousel);
        initAutoScroll(container);
      }
    }, 100);
  });

  function initAutoScroll(container) {
    const carousel = container.carousel;
    if (!carousel) return;

    // Configuration
    const scrollSpeed = isMobile ? 0.15 : 0.3; // Slower on mobile for smoother experience
    let isScrolling = true;
    let isInteracting = false;
    let isVisible = false;
    let animationId = null;

    // Set up Intersection Observer to track visibility
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          // Only start scrolling if not currently interacting
          if (!isInteracting && !animationId) {
            startAutoScroll();
          }
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

    // Listen for user interactions to pause auto-scrolling
    const interactionEvents = [
      // Desktop events
      { element: carousel.track, event: 'mousedown', type: 'start' },
      { element: window, event: 'mousemove', type: 'during' },
      { element: window, event: 'mouseup', type: 'end' },
      // Mobile events
      { element: carousel.track, event: 'touchstart', type: 'start' },
      { element: window, event: 'touchmove', type: 'during' },
      { element: window, event: 'touchend', type: 'end' },
      { element: window, event: 'touchcancel', type: 'end' },
      // Wheel events
      { element: container, event: 'wheel', type: 'wheel' },
      // Page scroll for mobile
      { element: window, event: 'scroll', type: 'scroll' }
    ];

    interactionEvents.forEach(({ element, event, type }) => {
      element.addEventListener(event, (e) => {
        if (type === 'start') {
          isInteracting = true;
          stopAutoScroll();
        } else if (type === 'end') {
          isInteracting = false;
          // Resume scrolling after a short delay
          setTimeout(() => {
            if (isVisible && !carousel.isDragging && !carousel.isScrolling) {
              startAutoScroll();
            }
          }, 500);
        } else if (type === 'wheel' || type === 'scroll') {
          // For wheel/scroll events, pause briefly then resume
          isInteracting = true;
          stopAutoScroll();

          clearTimeout(this.pauseTimeout);
          this.pauseTimeout = setTimeout(() => {
            isInteracting = false;
            if (isVisible && !carousel.isDragging && !carousel.isScrolling) {
              startAutoScroll();
            }
          }, 1000);
        }
      }, { passive: true });
    });

    // Custom event listeners for broader interaction support
    container.addEventListener('carouselInteractionStart', () => {
      isInteracting = true;
      stopAutoScroll();
    });
    
    container.addEventListener('carouselInteractionEnd', () => {
      isInteracting = false;
      // Resume scrolling after a short delay
      setTimeout(() => {
        if (isVisible && !carousel.isDragging && !carousel.isScrolling) {
          startAutoScroll();
        }
      }, 500);
    });

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoScroll();
      } else if (isVisible && !isInteracting) {
        startAutoScroll();
      }
    });

    // Initial start if visible
    if (isVisible) {
      startAutoScroll();
    }
  }
});