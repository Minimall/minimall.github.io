
// Opacity transition for case studies based on scroll position
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all case studies with opacity 0
  const caseStudies = document.querySelectorAll('.case-study-container:not(.footer2)');
  caseStudies.forEach(section => {
    section.style.opacity = '0';
    section.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  });

  let animationFrame;
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  let lastScrollTime = performance.now();

  const calculateVisibility = (element, predictedOffset = 0) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const threshold = windowHeight * 0.45;
    
    // Adjust rect based on predicted scroll
    const predictedRect = {
      top: rect.top - predictedOffset,
      bottom: rect.bottom - predictedOffset
    };
    
    // If element is completely above or below threshold with prediction
    if (predictedRect.bottom <= 0 || predictedRect.top >= threshold) return 0;
    
    // Calculate visibility percentage with prediction
    const visibleTop = Math.max(0, predictedRect.top);
    const visibleBottom = Math.min(threshold, predictedRect.bottom);
    const visibleHeight = visibleBottom - visibleTop;
    
    return Math.max(0, Math.min(1, visibleHeight / threshold));
  };

  const updateCaseStudyOpacity = () => {
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - lastScrollTime, 50); // Cap delta time
    const currentScrollY = window.scrollY;
    
    // Calculate and heavily dampen scroll velocity
    const rawVelocity = deltaTime > 0 ? (currentScrollY - lastScrollY) / deltaTime : 0;
    scrollVelocity = Math.sign(rawVelocity) * Math.pow(Math.min(Math.abs(rawVelocity), 1), 2) * 0.25;
    
    // Enhanced smoothed position prediction with stronger dampening
    const predictedOffset = scrollVelocity * Math.min(deltaTime * 1.5, 24);
    
    // Update opacity for each case study based on visibility
    caseStudies.forEach(section => {
      const visibility = calculateVisibility(section, predictedOffset);
      // Apply visibility as opacity with a power function for more dramatic effect
      section.style.opacity = Math.pow(visibility, 1.2).toString();
    });

    lastScrollY = currentScrollY;
    lastScrollTime = currentTime;
    animationFrame = requestAnimationFrame(updateCaseStudyOpacity);
  };

  // Initialize scroll tracking
  window.addEventListener('scroll', () => {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(updateCaseStudyOpacity);
    }
  }, { passive: true });
  
  // Start the initial animation
  updateCaseStudyOpacity();

  // Cleanup
  window.addEventListener('beforeunload', () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
});
