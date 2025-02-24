// Core functionality initialization
export const initCore = () => {
  // Set up event delegation for hover effects
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-hover="true"]');
    if (target) handleWaveEffect(target, true); //Corrected to use handleWaveEffect
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-hover="true"]');
    if (target) handleWaveEffect(target, false); //Corrected to use handleWaveEffect
  });
};

// Optimized wave effect
export const handleWaveEffect = (element, isEnter) => {
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
export const initHeadlineWave = () => {
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

import { setupHoverEffects } from './modules/interactions.js';
import { initializeAnimations } from './modules/animations.js';
import { initializeContentLoader } from './modules/loader.js';
import { initPerformance } from './modules/performance.js';


export {setupHoverEffects, initHeadlineWave, initCore, handleWaveEffect};