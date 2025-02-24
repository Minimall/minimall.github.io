import { handleWaveEffect } from './interactions.js';

export const initializeAnimations = () => {
  initHeadlineWave();
};

export const initHeadlineWave = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const h1Element = entry.target;
        setTimeout(() => {
          const waveTextSpan = h1Element.querySelector('.wave-text');
          if (waveTextSpan) {
            const spans = waveTextSpan.querySelectorAll('span');
            spans.forEach((span, i) => {
              setTimeout(() => span.classList.add('shimmer-in'), i * 25);
            });
          }
        }, 200);
        observer.unobserve(h1Element);
      }
    });
  }, { threshold: 0.5 });

  const processHeadlines = () => {
    document.querySelectorAll('h1:not([data-wave-processed])').forEach(headline => {
      const waveTextSpan = headline.querySelector('.wave-text');
      if (waveTextSpan) {
        const text = waveTextSpan.textContent.trim();
        waveTextSpan.innerHTML = text
          .split('')
          .map(char => char === ' ' ? `<span>&nbsp;</span>` : `<span>${char}</span>`)
          .join('');
        observer.observe(headline);
        headline.setAttribute('data-wave-processed', 'true');
      }
    });
  };

  processHeadlines();

  const contentObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) processHeadlines();
    });
  });

  contentObserver.observe(document.body, { childList: true, subtree: true });
};