
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

const calculateVisibility = (element) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Calculate the visibility threshold (45% of viewport)
  const threshold = windowHeight * 0.45;
  
  // If element is completely above or below threshold
  if (rect.bottom <= 0 || rect.top >= threshold) return 0;
  
  // Calculate visibility percentage
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(threshold, rect.bottom);
  const visibleHeight = visibleBottom - visibleTop;
  
  return Math.max(0, Math.min(1, visibleHeight / threshold));
};

const updateBackgroundColor = () => {
  const sections = document.querySelectorAll('.case-study-container');
  let targetBackground = '#FFFFFF';
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section);
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
