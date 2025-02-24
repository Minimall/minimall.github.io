
export const setupHoverEffects = () => {
  const hoverableElements = document.querySelectorAll('a, [data-hover="true"]');
  
  hoverableElements.forEach(element => {
    if (element.hasAttribute('data-processed')) return;
    
    element.addEventListener('mouseenter', () => handleWaveEffect(element, true));
    element.addEventListener('mouseleave', () => handleWaveEffect(element, false));
    element.setAttribute('data-processed', 'true');
  });
};

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
