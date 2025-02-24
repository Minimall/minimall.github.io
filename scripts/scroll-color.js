
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
let currentBackground = 'rgb(255, 255, 255)';
let animationFrame;
let lastScrollPosition = window.scrollY;
let scrollTimeout;

const calculateVisibility = (element) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const elementHeight = rect.height;
  const visibility = visibleHeight / (elementHeight * 0.35);

  return Math.max(0, Math.min(1, visibility));
};

const updateBackgroundColor = () => {
  const sections = document.querySelectorAll('.case-study-container');
  let targetColor = 'rgb(255, 255, 255)';
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section);
    const sectionColor = section.dataset.bg;

    if (visibility > maxVisibility && sectionColor) {
      maxVisibility = visibility;
      targetColor = sectionColor;
    }
  });

  const transitionFactor = Math.min(1, maxVisibility);
  document.body.style.backgroundColor = interpolateColor(currentBackground, targetColor, transitionFactor);
  currentBackground = document.body.style.backgroundColor;

  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

// Handle scroll events
const handleScroll = () => {
  lastScrollPosition = window.scrollY;
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(updateBackgroundColor);
  }

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }, 150);
};

// Initialize scroll tracking
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.transition = 'background-color 0.3s ease';
  window.addEventListener('scroll', handleScroll, { passive: true });
  updateBackgroundColor();
});

// Cleanup
window.addEventListener('beforeunload', () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  window.removeEventListener('scroll', handleScroll);
});
