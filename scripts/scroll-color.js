
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
  const deltaTime = currentTime - lastScrollTime;
  const currentScrollY = window.scrollY;
  
  // Calculate scroll velocity (pixels per millisecond)
  scrollVelocity = deltaTime > 0 ? (currentScrollY - lastScrollY) / deltaTime : 0;
  
  // Predict scroll position based on velocity
  const predictedOffset = scrollVelocity * 32; // Predict ~32ms ahead
  
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

  // Interpolate between current and target color based on visibility
  document.body.style.backgroundColor = interpolateColor(currentBackground, targetBackground, maxVisibility);
  
  if (maxVisibility >= 0.99) {
    currentBackground = targetBackground;
  } else if (maxVisibility <= 0.01) {
    currentBackground = '#FFFFFF';
  }

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
