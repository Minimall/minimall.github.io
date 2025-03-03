
// Preload hover-related styles immediately
document.addEventListener("DOMContentLoaded", function() {
  // Ensure critical CSS for hover effects is loaded first
  if (!document.querySelector('link[href*="links.css"]')) {
    const linkCss = document.createElement('link');
    linkCss.rel = 'stylesheet';
    linkCss.href = 'styles/links.css';
    linkCss.setAttribute('priority', 'high');
    document.head.insertBefore(linkCss, document.head.firstChild);
  }
  
  // Preload hover.js script with high priority
  const hoverScript = document.createElement('script');
  hoverScript.src = 'scripts/hover.js';
  hoverScript.setAttribute('priority', 'high');
  document.head.appendChild(hoverScript);
  
  // Initialize basic hover effect early
  const hoverableElements = document.querySelectorAll('a, button, [data-hover="true"]');
  hoverableElements.forEach(element => {
    if (element.hasAttribute('data-processed')) return;
    
    element.addEventListener('mouseenter', () => {
      element.style.fontVariationSettings = '"wght" 700';
    });
    element.addEventListener('mouseleave', () => {
      element.style.fontVariationSettings = '"wght" 500';
    });
  });
});
