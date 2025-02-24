
// Core functionality module
export const initCore = () => {
  // Essential initialization
  setupHoverEffects();
  initHeadlineWave();
};

// Basic hover effect handling 
const setupHoverEffects = () => {
  const hoverableElements = document.querySelectorAll('a, [data-hover="true"]');
  
  hoverableElements.forEach(element => {
    if (element.hasAttribute('data-processed')) return;
    
    element.addEventListener('mouseenter', () => handleWaveEffect(element, true));
    element.addEventListener('mouseleave', () => handleWaveEffect(element, false));
    element.setAttribute('data-processed', 'true');
  });
};

// Optimized wave effect
const handleWaveEffect = (element, isEnter) => {
  const letters = element.querySelectorAll('.wave-text span');
  requestAnimationFrame(() => {
    letters.forEach((letter, i) => {
      setTimeout(
        () => {
          letter.classList.toggle('wave-in', isEnter);
          letter.classList.toggle('wave-out', !isEnter);
        },
        isEnter ? i * 48 : (letters.length - 1 - i) * 26
      );
    });
  });
};

// Initialize headline animations
const initHeadlineWave = () => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const headline = entry.target;
        const spans = headline.querySelectorAll('.wave-text span');
        spans.forEach((span, i) => {
          setTimeout(() => span.classList.add('shimmer-in'), i * 25);
        });
        observer.unobserve(headline);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('h1').forEach(headline => {
    if (!headline.hasAttribute('data-wave-processed')) {
      observer.observe(headline);
      headline.setAttribute('data-wave-processed', 'true');
    }
  });
};
