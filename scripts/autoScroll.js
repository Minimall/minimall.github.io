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
    const scrollSpeed = isMobile ? 0.15 : 0.3; // Even slower on mobile for smoother experience
    let isScrolling = true;
    let isInteracting = false;
    let isVisible = false;
    let animationId = null;
    let lastFrameTime = 0; // For consistent timing

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

    // Auto-scroll animation function with time-based movement for consistency
    function autoScroll(timestamp) {
      if (!lastFrameTime) lastFrameTime = timestamp;
      
      const deltaTime = timestamp - lastFrameTime;
      lastFrameTime = timestamp;
      
      // Only proceed if we're supposed to be scrolling and not in middle of user interaction
      if (isScrolling && !carousel.isDragging && !carousel.isScrolling) {
        // Use deltaTime to ensure consistent speed regardless of frame rate
        // Move slightly to the left (time-normalized)
        const frameAdjustedSpeed = scrollSpeed * (deltaTime / 16.67); // Normalize to 60fps
        carousel.offset += frameAdjustedSpeed;
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
        } else if (type === 'end') {
          isInteracting = false;
          // Resume scrolling if still visible
          if (isVisible) {
            startAutoScroll();
          }
        } else if (type === 'wheel') {
          // For wheel events, pause briefly then resume
          isInteracting = true;
          stopAutoScroll();

          clearTimeout(wheelTimeout);
          const wheelTimeout = setTimeout(() => {
            isInteracting = false;
            if (isVisible) {
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