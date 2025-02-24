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
let targetBackground = '#FFFFFF';
let transitionProgress = 0;
let animationFrame = null;
let lastTime = null;

const TRANSITION_DURATION = 500; // Duration in milliseconds

const calculateVisibility = (element) => {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const elementHeight = rect.height;

  return Math.max(0, Math.min(1, visibleHeight / elementHeight));
};

const updateBackgroundColor = (timestamp) => {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;

  const sections = document.querySelectorAll('.case-study-container');
  let mostVisibleSection = null;
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section);
    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      mostVisibleSection = section;
    }
  });

  const newTargetBackground = mostVisibleSection 
    ? getComputedStyle(mostVisibleSection).getPropertyValue('--data-bg').trim() || '#FFFFFF'
    : '#FFFFFF';

  if (newTargetBackground !== targetBackground) {
    targetBackground = newTargetBackground;
    transitionProgress = 0;
  }

  transitionProgress = Math.min(1, transitionProgress + (deltaTime / TRANSITION_DURATION));

  const interpolatedColor = interpolateColor(currentBackground, targetBackground, transitionProgress);
  document.body.style.backgroundColor = interpolatedColor;

  if (transitionProgress >= 1) {
    currentBackground = targetBackground;
  }

  lastTime = timestamp;
  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

// Initialize scroll tracking
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.transition = 'none';

  window.addEventListener('scroll', () => {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame((timestamp) => {
        lastTime = null;
        updateBackgroundColor(timestamp);
      });
    }
  }, { passive: true });

  updateBackgroundColor(performance.now());
});

// Cleanup
window.addEventListener('beforeunload', () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});