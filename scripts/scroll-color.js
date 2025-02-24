
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

  // Calculate visibility based on element position
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const elementHeight = rect.height;
  const viewportCenter = windowHeight / 2;
  const elementCenter = rect.top + (elementHeight / 2);
  const distanceFromCenter = Math.abs(viewportCenter - elementCenter);
  
  // Normalize visibility value
  let visibility = visibleHeight / (elementHeight * 0.5);
  visibility *= 1 - (distanceFromCenter / (windowHeight * 0.75));
  
  return Math.max(0, Math.min(1, visibility));
};

const updateBackgroundColor = () => {
  const sections = document.querySelectorAll('.case-study-container');
  let targetColor = '#FFFFFF';
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section);
    const sectionColor = section.dataset.bg;

    if (visibility > maxVisibility && sectionColor) {
      maxVisibility = visibility;
      targetColor = sectionColor;
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
