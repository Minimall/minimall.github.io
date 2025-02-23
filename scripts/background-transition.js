
function initBackgroundTransition() {
  const cases = document.querySelectorAll('.case-study-container');
  console.log('Found case containers:', cases.length);
  let currentBgColor = '#FFFFFF';

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const interpolateColor = (color1, color2, factor) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    return `rgb(${
      Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor)
    }, ${
      Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor)
    }, ${
      Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor)
    })`;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const container = entry.target;
      const bgColor = getComputedStyle(container).getPropertyValue('--case-background').trim();
      console.log('Background color found:', bgColor);
      
      // Handle cases where color might be in rgb() format
      if (!bgColor || bgColor === 'none' || bgColor === '') return;
      
      // Convert rgb() to hex if needed
      const actualColor = bgColor.startsWith('rgb') ? 
        bgColor : 
        bgColor.startsWith('#') ? 
          bgColor : 
          `#${bgColor}`;
      
      const ratio = entry.intersectionRatio;
      const threshold = 0.3;
      
      if (ratio > 0) {
        const factor = Math.min(ratio / threshold, 1);
        document.body.style.backgroundColor = interpolateColor(currentBgColor, bgColor, factor);
        
        if (ratio >= threshold) {
          currentBgColor = bgColor;
        }
      }
    });
  }, {
    threshold: Array.from({ length: 31 }, (_, i) => i / 30)
  });

  cases.forEach(caseElement => observer.observe(caseElement));
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  initBackgroundTransition();
});

// Also try loading on window load
window.addEventListener('load', () => {
  console.log('Window Loaded');
  initBackgroundTransition();
});

// Log any potential errors
window.addEventListener('error', (event) => {
  console.error('Script error:', event.error);
});
