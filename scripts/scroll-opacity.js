
// Scale transition for case studies based on scroll position
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all case studies with scale 0.7 (70%)
  const caseStudies = document.querySelectorAll('.case-study-container:not(.footer2)');
  
  caseStudies.forEach((section, index) => {
    // Set transform origin to the top for better scaling effect
    section.style.transformOrigin = 'center top';
    section.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // First case study starts at 100% scale, others at 70%
    if (index === 0) {
      section.style.transform = 'scale(1)';
    } else {
      section.style.transform = 'scale(0.7)';
    }
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

  const updateCaseStudyScale = () => {
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - lastScrollTime, 50); // Cap delta time
    const currentScrollY = window.scrollY;
    
    // Calculate and heavily dampen scroll velocity
    const rawVelocity = deltaTime > 0 ? (currentScrollY - lastScrollY) / deltaTime : 0;
    scrollVelocity = Math.sign(rawVelocity) * Math.pow(Math.min(Math.abs(rawVelocity), 1), 2) * 0.25;
    
    // Enhanced smoothed position prediction with stronger dampening
    const predictedOffset = scrollVelocity * Math.min(deltaTime * 1.5, 24);
    
    // Update scale for each case study based on visibility
    caseStudies.forEach((section, index) => {
      const visibility = calculateVisibility(section, predictedOffset);
      
      // Calculate scale between 0.7 (70%) and 1 (100%)
      const scale = 0.7 + (visibility * 0.3);
      
      // Apply scale transformation with a power function for more dramatic effect
      section.style.transform = `scale(${scale})`;
    });

    lastScrollY = currentScrollY;
    lastScrollTime = currentTime;
    animationFrame = requestAnimationFrame(updateCaseStudyScale);
  };

  // Initialize scroll tracking
  window.addEventListener('scroll', () => {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(updateCaseStudyScale);
    }
  }, { passive: true });
  
  // Start the initial animation
  updateCaseStudyScale();

  // Cleanup
  window.addEventListener('beforeunload', () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
});
