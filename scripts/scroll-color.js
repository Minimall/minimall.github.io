// Color transition utilities
const interpolateColor = (color1, color2, factor) => {
  const rgb1 = color1.match(/\d+/g)?.map(Number) || [255, 255, 255];
  const rgb2 = color2.match(/\d+/g)?.map(Number) || [255, 255, 255];

  const result = rgb1.map((start, i) => {
    const end = rgb2[i];
    return Math.round(start + (end - start) * factor);
  });

  return `rgb(${result.join(',')})`;
};

// Visibility tracking
let currentBackground = 'rgb(255, 255, 255)';
let animationFrame;

const calculateVisibility = (element) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const elementHeight = rect.height;

  return Math.max(0, Math.min(1, visibleHeight / (elementHeight * 0.35)));
};

const updateBackgroundColor = () => {
  const sections = document.querySelectorAll('.case-study-container');
  let targetColor = 'rgb(255, 255, 255)';
  let maxVisibility = 0;

  sections.forEach(section => {
    const visibility = calculateVisibility(section);
    const sectionColor = section.dataset.bg || '#FFFFFF';

    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      targetColor = sectionColor;
    }
  });

  document.body.style.backgroundColor = interpolateColor(currentBackground, targetColor, maxVisibility);
  currentBackground = document.body.style.backgroundColor;

  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

// Initialize scroll tracking
document.addEventListener('DOMContentLoaded', () => {
  updateBackgroundColor();
});

// Cleanup
window.addEventListener('beforeunload', () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});