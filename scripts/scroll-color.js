
// Color transition utilities
const interpolateColor = (color1, color2, factor) => {
  const rgb1 = color1.match(/\d+/g).map(Number);
  const rgb2 = color2.match(/\d+/g).map(Number);
  
  const result = rgb1.map((start, i) => {
    const end = rgb2[i];
    return Math.round(start + (end - start) * factor);
  });
  
  return `rgb(${result.join(',')})`;
};

// Visibility tracking
const sections = new Map();
let currentBackground = document.body.style.backgroundColor || '#FFFFFF';
let animationFrame;

const calculateVisibility = (element) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const elementHeight = rect.height;
  
  return Math.max(0, Math.min(1, visibleHeight / (elementHeight * 0.35)));
};

const updateBackgroundColor = () => {
  let targetColor = '#FFFFFF';
  let maxVisibility = 0;
  
  sections.forEach((data, element) => {
    const visibility = calculateVisibility(element);
    data.visibility = visibility;
    
    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      targetColor = data.background;
    }
  });
  
  if (maxVisibility > 0) {
    document.body.style.backgroundColor = interpolateColor(currentBackground, targetColor, Math.min(1, maxVisibility));
    currentBackground = document.body.style.backgroundColor;
  }
  
  animationFrame = requestAnimationFrame(updateBackgroundColor);
};

// Initialize scroll tracking
const initScrollColorTransition = () => {
  const sectionElements = document.querySelectorAll('.case-study-container');
  
  sectionElements.forEach(section => {
    const background = getComputedStyle(section).getPropertyValue('--case-background').trim();
    sections.set(section, { background, visibility: 0 });
  });
  
  updateBackgroundColor();
};

// Cleanup function
const cleanup = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
};

// Start on DOM load
document.addEventListener('DOMContentLoaded', initScrollColorTransition);
window.addEventListener('beforeunload', cleanup);
