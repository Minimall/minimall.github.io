
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
// Interactions module
export const setupHoverEffects = () => {
  const hoverableElements = document.querySelectorAll('a, [data-hover="true"]');
  
  hoverableElements.forEach(element => {
    if (element.hasAttribute('data-processed')) return;
    
    const hasDirectImageHover = element.dataset.images && !element.querySelector('.wave-text');
    
    if (hasDirectImageHover) {
      setupImageHover(element);
    } else {
      setupWaveEffect(element);
    }
    
    element.setAttribute('data-processed', 'true');
  });
};

const setupImageHover = (element) => {
  const img = document.createElement('img');
  img.className = 'hover-image';
  img.alt = element.textContent;
  document.body.appendChild(img);
  
  element.addEventListener('mouseenter', () => {
    handleImageHover(element, img, true);
    handleWaveEffect(element, true);
  });
  
  element.addEventListener('mouseleave', () => {
    handleImageHover(element, img, false);
    handleWaveEffect(element, false);
  });
};

const setupWaveEffect = (element) => {
  if (!element.querySelector('.wave-text')) {
    const text = element.textContent.trim();
    element.innerHTML = `<span class="wave-text">${
      text.split('').map(char => `<span>${char}</span>`).join('')
    }</span>`;
  }

  element.addEventListener('mouseenter', () => handleWaveEffect(element, true));
  element.addEventListener('mouseleave', () => handleWaveEffect(element, false));
};

const handleWaveEffect = (element, isEnter) => {
  const letters = element.querySelectorAll('.wave-text span');
  const delay = isEnter ? 48 : 26;
  
  letters.forEach((letter, i) => {
    setTimeout(() => {
      letter.classList.remove('wave-in', 'wave-out');
      letter.classList.add(isEnter ? 'wave-in' : 'wave-out');
    }, isEnter ? i * delay : (letters.length - 1 - i) * delay);
  });
};

const handleImageHover = (element, img, isEnter) => {
  if (isEnter) {
    const rotation = (Math.random() > 0.5 ? 3 : -3);
    img.style.setProperty('--rotation', `${rotation}deg`);
    img.classList.add('active');
    cycleImages(element, img);
  } else {
    img.classList.remove('active');
  }
};

const cycleImages = (element, img) => {
  const images = element.dataset.images?.split(',') || [];
  if (!images.length) return;
  
  let currentIndex = 0;
  const showImage = () => {
    img.src = `/images/${images[currentIndex]}`;
    currentIndex = (currentIndex + 1) % images.length;
  };
  
  showImage();
  const interval = setInterval(showImage, 600);
  element.stopImageCycle = () => clearInterval(interval);
};
