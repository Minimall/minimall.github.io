
function initBackgroundTransition() {
  const cases = document.querySelectorAll('.case-study-container');
  const defaultBgColor = 'rgb(255, 255, 255)';
  let currentBgColor = defaultBgColor;

  const rgbToValues = (rgb) => {
    const match = rgb.match(/\d+/g);
    return match ? {
      r: parseInt(match[0]),
      g: parseInt(match[1]),
      b: parseInt(match[2])
    } : { r: 255, g: 255, b: 255 };
  };

  const interpolateColor = (color1, color2, factor) => {
    const rgb1 = rgbToValues(color1);
    const rgb2 = rgbToValues(color2);

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
      const computedStyle = window.getComputedStyle(container);
      const targetBgColor = computedStyle.getPropertyValue('--case-background').trim();
      
      if (!targetBgColor) return;

      const ratio = entry.intersectionRatio;
      if (ratio > 0) {
        const factor = Math.min(ratio, 1);
        const interpolatedColor = interpolateColor(currentBgColor, targetBgColor, factor);
        document.body.style.backgroundColor = interpolatedColor;
        
        if (ratio > 0.5) {
          currentBgColor = targetBgColor;
        }
      } else {
        document.body.style.backgroundColor = defaultBgColor;
        currentBgColor = defaultBgColor;
      }
    });
  }, {
    threshold: Array.from({ length: 20 }, (_, i) => i / 19)
  });

  cases.forEach(caseElement => {
    observer.observe(caseElement);
    console.log('Observing case element:', caseElement);
  });
}

// Initialize only once when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing background transition');
  initBackgroundTransition();
});
