
// Color transition utilities
const interpolateColor = (color1, color2, factor) => {
  const parseColor = (color) => {
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ];
    }
    return color.match(/\d+/g)?.map(Number) || [255, 255, 255];
  };

  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  const result = rgb1.map((start, i) => {
    const end = rgb2[i];
    return Math.round(start + (end - start) * factor);
  });

  return `rgb(${result.join(',')})`;
};

let currentBackground = '#FFFFFF';
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

const updateBackgroundColor = () => {
  const currentTime = performance.now();
  const deltaTime = Math.min(currentTime - lastScrollTime, 50); // Cap delta time
  const currentScrollY = window.scrollY;
  
  // Calculate and heavily dampen scroll velocity
  const rawVelocity = deltaTime > 0 ? (currentScrollY - lastScrollY) / deltaTime : 0;
  scrollVelocity = Math.sign(rawVelocity) * Math.pow(Math.min(Math.abs(rawVelocity), 1), 2) * 0.25;
  
  // Enhanced smoothed position prediction with stronger dampening
  const predictedOffset = scrollVelocity * Math.min(deltaTime * 1.5, 24);
  
  const sections = document.querySelectorAll('.case-study-container');
  let targetBackground = '#FFFFFF';
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section, predictedOffset);
    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      const sectionBg = getComputedStyle(section).getPropertyValue('--data-bg').trim();
      targetBackground = sectionBg || '#FFFFFF';
    }
  });

  // Smooth easing with velocity consideration
  const startTime = performance.now();
  const easeDuration = 1200; // 1200ms transition
  
  const smoothTransition = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / easeDuration, 1);
    
    // Cubic easing
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    // Blend current visibility with eased transition
    const transitionFactor = Math.pow(maxVisibility, 1.5) * easedProgress;
    document.body.style.backgroundColor = interpolateColor(currentBackground, targetBackground, transitionFactor);
    
    if (progress < 1) {
      requestAnimationFrame(smoothTransition);
    } else {
      if (maxVisibility >= 0.95) {
        currentBackground = targetBackground;
      } else if (maxVisibility <= 0.05) {
        currentBackground = '#FFFFFF';
      }
    }
  };
  
  smoothTransition();

  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

// Initialize scroll tracking
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.transition = 'none';
  
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    lastScrollTime = performance.now();
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(updateBackgroundColor);
    }
  }, { passive: true });
  
  updateBackgroundColor();
});

// Cleanup
window.addEventListener('beforeunload', () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
