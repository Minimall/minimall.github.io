
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
  const viewportThreshold = windowHeight * 0.45;
  const minVisiblePixels = 1;
  
  // If element is completely above or below viewport
  if (rect.bottom <= 0 || rect.top >= windowHeight) return 0;
  
  // Calculate visibility percentage from first pixel to 45% threshold
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(viewportThreshold, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  
  // If element is barely visible (at least 1px), return minimum progress
  if (visibleHeight > 0 && visibleHeight < minVisiblePixels) {
    return 0.01; // 1% progress for minimal visibility
  }
  
  // Calculate progress (1% to 100%) based on visibility from 0 to 45% viewport
  return Math.min(1, visibleHeight / viewportThreshold);
};

const updateBackgroundColor = () => {
  const sections = document.querySelectorAll('.case-study-container');
  let targetBackground = '#FFFFFF';
  let currentVisibility = 0;
  let previousBackground = currentBackground;
  let hasVisibleSection = false;

  // Find the most visible section
  sections.forEach(section => {
    const visibility = calculateVisibility(section);
    const computedStyle = getComputedStyle(section);
    const sectionBackground = computedStyle.getPropertyValue('--data-bg').trim();
    
    if (visibility > 0) {
      hasVisibleSection = true;
      currentVisibility = visibility;
      targetBackground = sectionBackground || '#FFFFFF';
      previousBackground = currentBackground;
    }
  });

  // If no section is visible, calculate visibility based on the closest section
  if (!hasVisibleSection) {
    const scrollPosition = window.scrollY;
    const firstSection = sections[0];
    const rect = firstSection.getBoundingClientRect();
    const distanceFromTop = rect.top;
    const transitionZone = window.innerHeight * 0.45;
    
    if (distanceFromTop > 0) {
      // Scrolling down towards first section
      currentVisibility = 1 - (distanceFromTop / transitionZone);
      currentVisibility = Math.max(0, Math.min(1, currentVisibility));
      targetBackground = firstSection.style.getPropertyValue('--data-bg').trim() || '#FFFFFF';
      previousBackground = '#FFFFFF';
    } else if (distanceFromTop < -rect.height) {
      // Scrolling up from sections to header
      const distanceFromBottom = Math.abs(distanceFromTop + rect.height);
      currentVisibility = distanceFromBottom / transitionZone;
      currentVisibility = Math.max(0, Math.min(1, currentVisibility));
      targetBackground = '#FFFFFF';
      previousBackground = firstSection.style.getPropertyValue('--data-bg').trim() || '#FFFFFF';
    } else {
      // Within the first section
      currentVisibility = 1;
      targetBackground = firstSection.style.getPropertyValue('--data-bg').trim() || '#FFFFFF';
      previousBackground = currentBackground;
    }
  }

  // Update color with smooth interpolation
  document.body.style.backgroundColor = interpolateColor(previousBackground, targetBackground, currentVisibility);
  
  if (currentVisibility >= 0.99) {
    currentBackground = targetBackground;
  }

  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

let lastColorUpdate = null;
const FRAME_RATE = 1000 / 60; // 60fps

// Initialize scroll tracking
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.transition = 'none'; // Remove CSS transition to handle it in JS
  
  window.addEventListener('scroll', () => {
    const now = performance.now();
    if (!lastColorUpdate || now - lastColorUpdate >= FRAME_RATE) {
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(() => {
          updateBackgroundColor();
          lastColorUpdate = now;
        });
      }
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
