
(function() {
  // Add the fonts-loading class to hide content while fonts load
  document.documentElement.classList.add('fonts-loading');
  
  // Check if fonts were already loaded in a previous session
  if (sessionStorage.getItem('fonts-loaded')) {
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    return;
  }
  
  // Create a simpler font loading detector that doesn't trigger CORS issues
  if ('fonts' in document) {
    // Simple timeout-based approach
    const fontLoadingTimeout = setTimeout(function() {
      console.log('Font loading timeout - using fallbacks');
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
    }, 2000);
    
    // Use a simpler check that doesn't send extra headers
    const fontLoaded = () => {
      clearTimeout(fontLoadingTimeout);
      console.log('Google fonts loaded successfully');
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
      // Cache the font loading status for future page views
      sessionStorage.setItem('fonts-loaded', 'true');
    };
    
    // Check if the font is already loaded
    document.fonts.ready.then(fontLoaded).catch(function() {
      // Fallback if the promise is rejected
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
    });
  } else {
    // For browsers without font API support
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
  }
})();
