
function initBackgroundTransition() {
  const cases = document.querySelectorAll('.case-study-container');
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
      
      if (!bgColor) return;
      
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

document.addEventListener('DOMContentLoaded', initBackgroundTransition);
