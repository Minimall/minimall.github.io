
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
  
  // Calculate visibility based on first 45% of the element
  const elementHeight = rect.height * 0.45;
  const elementTop = rect.top;
  const visibleTop = Math.max(0, elementTop);
  const visibleBottom = Math.min(elementTop + elementHeight, windowHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  
  // Calculate visibility ratio based on the 45% portion
  return Math.max(0, Math.min(1, visibleHeight / elementHeight));
};

const updateBackgroundColor = () => {
  const sections = document.querySelectorAll('.case-study-container');
  let targetColor = '#FFFFFF';
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section);
    const computedStyle = getComputedStyle(section);
    const caseBackground = computedStyle.getPropertyValue('--case-background').trim() || '#EEEDE5';

    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      targetColor = caseBackground;
    }
  });

  document.body.style.backgroundColor = interpolateColor(currentBackground, targetColor, 0.1);
  currentBackground = document.body.style.backgroundColor;

  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

// Initialize scroll tracking
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.transition = 'background-color 0.2s ease-out';
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
