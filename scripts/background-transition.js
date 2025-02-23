function initBackgroundTransition() {
  const cases = document.querySelectorAll('.case-study-container');
  let currentBgColor = window.getComputedStyle(document.body).backgroundColor;

  const rgbToValues = (rgb) => {
    const match = rgb.match(/\d+/g);
    return match ? {
      r: parseInt(match[0]),
      g: parseInt(match[1]),
      b: parseInt(match[2])
    } : { r: 255, g: 255, b: 255 };
  };

  const interpolateColor = (color1, color2, factor) => {
    const rgb1 = color1.startsWith('#') ? hexToRgb(color1) : rgbToValues(color1);
    const rgb2 = color2.startsWith('#') ? hexToRgb(color2) : rgbToValues(color2);

    return `rgb(${
      Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor)
    }, ${
      Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor)
    }, ${
      Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor)
    })`;
  };

  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
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
    threshold: Array.from({ length: 100 }, (_, i) => i / 99)
  });

  cases.forEach(caseElement => observer.observe(caseElement));
}

// Initialize on both DOMContentLoaded and load to ensure it runs
document.addEventListener('DOMContentLoaded', initBackgroundTransition);
window.addEventListener('load', initBackgroundTransition);

// Log any potential errors
window.addEventListener('error', (event) => {
  console.error('Script error:', event.error);
});