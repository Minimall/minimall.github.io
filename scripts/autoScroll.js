
/**
 * Auto-scrolling functionality for the carousel
 * Works with both desktop and mobile implementations
 */

document.addEventListener('DOMContentLoaded', () => {
  // Configure auto-scroll parameters
  const AUTO_SCROLL_SPEED = 0.5; // pixels per frame
  const SCROLL_PAUSE_DURATION = 2000; // ms to pause after interaction
  
  // Find all carousel containers
  const carouselContainers = document.querySelectorAll('.carousel-container');
  
  // Detect if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  carouselContainers.forEach(container => {
    // Track state
    let isScrolling = false;
    let isPaused = false;
    let pauseTimeout = null;
    let isVisible = false;
    let scrollAnimationId = null;
    
    // Create an Intersection Observer to detect when carousel is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        
        // Start/stop auto-scrolling based on visibility
        if (isVisible && !isPaused) {
          startAutoScroll();
        } else {
          stopAutoScroll();
        }
      });
    }, { threshold: 0.1 }); // 10% visibility threshold
    
    // Observe the carousel container
    observer.observe(container);
    
    // Listen for user interaction to pause auto-scrolling
    container.addEventListener('carouselInteractionStart', () => {
      isPaused = true;
      stopAutoScroll();
    });
    
    // Resume auto-scrolling after interaction ends (with delay)
    container.addEventListener('carouselInteractionEnd', () => {
      // Clear any existing timeout
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
      }
      
      // Set a timeout to resume auto-scrolling
      pauseTimeout = setTimeout(() => {
        isPaused = false;
        if (isVisible) {
          startAutoScroll();
        }
      }, SCROLL_PAUSE_DURATION);
    });
    
    // Auto-scroll animation frame callback
    const autoScrollFrame = () => {
      if (!isVisible || isPaused) {
        isScrolling = false;
        return;
      }
      
      // Get the appropriate carousel instance
      const carousel = isMobile ? container.mobileCarousel : container.carousel;
      
      if (carousel) {
        // Update position for auto-scrolling
        carousel.offset += AUTO_SCROLL_SPEED;
        carousel.renderItems();
      }
      
      // Continue animation
      scrollAnimationId = requestAnimationFrame(autoScrollFrame);
    };
    
    // Start auto-scrolling
    const startAutoScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        scrollAnimationId = requestAnimationFrame(autoScrollFrame);
      }
    };
    
    // Stop auto-scrolling
    const stopAutoScroll = () => {
      if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
      }
      isScrolling = false;
    };
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoScroll();
      } else if (isVisible && !isPaused) {
        startAutoScroll();
      }
    });
    
    // Start initial auto-scroll if visible
    if (isVisible && !isPaused) {
      startAutoScroll();
    }
  });
});
