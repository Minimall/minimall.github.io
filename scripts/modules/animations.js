
import { handleWaveEffect } from './interactions.js';

export const initializeAnimations = () => {
  initHeadlineWave();
};

export const initHeadlineWave = () => {
  const observer = new IntersectionObserver((entries) => {
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
