
// Lazy loading with Intersection Observer
const lazyLoadImages = () => {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, { rootMargin: '50px' });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
};

// Debounce utility
const debounce = (func, wait = 20) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Update elements based on scroll position
const updateScrollBasedElements = () => {
  // Add scroll-based updates here
  const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
  document.documentElement.style.setProperty('--scroll-progress', scrollProgress.toString());
};

// Initialize performance optimizations
const initPerformance = () => {
  // Lazy load images
  lazyLoadImages();
  
  // Set up efficient scroll handling
  window.addEventListener('scroll', debounce(updateScrollBasedElements), { passive: true });
};

export { initPerformance, lazyLoadImages, debounce };
