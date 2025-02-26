
(function() {
  // Add the fonts-loading class to hide content while fonts load
  document.documentElement.classList.add('fonts-loading');
  
  // Check if FontFaceObserver is already defined
  if (typeof FontFaceObserver === 'undefined') {
    // Simple polyfill/implementation for font loading detection
    const fontTimeoutMs = 3000; // 3 second timeout for font loading
    
    // Create promise for Recursive font
    const recursiveFont = new Promise((resolve) => {
      const fontLoader = new Image();
      fontLoader.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="50"><text font-family="Recursive" font-size="20" x="0" y="30">Recursive Font</text></svg>');
      fontLoader.onload = () => {
        resolve();
      };
      setTimeout(resolve, fontTimeoutMs);
    });
    
    // Wait for font to load or timeout
    recursiveFont.then(() => {
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
      localStorage.setItem('fonts-loaded', 'true');
    });
  }
  
  // Use cached font loading information if available
  if (sessionStorage.getItem('fonts-loaded')) {
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
  }
})();
