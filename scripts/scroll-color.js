
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

// Visibility tracking
let currentBackground = '#FFFFFF';
let animationFrame;

const calculateVisibility = (element) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Calculate how much of the element is visible in the first 45% of viewport
  const viewportThreshold = windowHeight * 0.45;
  const elementTop = rect.top;
  const elementBottom = rect.bottom;
  
  // If element is above viewport, return 0
  if (elementBottom <= 0) return 0;
  
  // If element is below 45% threshold, return 0
  if (elementTop >= viewportThreshold) return 0;
  
  // Calculate visibility percentage within the 45% threshold
  const visibleTop = Math.max(0, elementTop);
  const visibleBottom = Math.min(viewportThreshold, elementBottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  
  return Math.min(1, visibleHeight / viewportThreshold);
};

const updateBackgroundColor = () => {
  const sections = document.querySelectorAll('.case-study-container');
  let targetBackground = '#FFFFFF';
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section);
    const computedStyle = getComputedStyle(section);
    const sectionBackground = computedStyle.getPropertyValue('--case-background').trim();
    
    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      targetBackground = sectionBackground || '#FFFFFF';
    }
  });

  // Smoothly interpolate between current and target color
  document.body.style.backgroundColor = interpolateColor(currentBackground, targetBackground, maxVisibility);
  
  if (maxVisibility === 1) {
    currentBackground = targetBackground;
  }

  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

// Initialize scroll tracking
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.transition = 'none'; // Remove CSS transition to handle it in JS
  window.addEventListener('scroll', () => {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(updateBackgroundColor);
    }
  }, { passive: true });
  
  // Initial color update
  updateBackgroundColor();
});

// Cleanup
window.addEventListener('beforeunload', () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
