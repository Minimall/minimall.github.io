
(function() {
  // Add the fonts-loading class to hide content while fonts load
  document.documentElement.classList.add('fonts-loading');
  
  // Check if fonts were already loaded in a previous session
  if (sessionStorage.getItem('fonts-loaded')) {
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    return;
  }
  
  // Use the native FontFace API for better font loading control
  if (typeof FontFace !== 'undefined' && 'fonts' in document) {
    // We'll let Google Fonts handle the actual font loading
    // This just monitors the process
    document.fonts.ready.then(function() {
      console.log('Google fonts loaded successfully');
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
      // Cache the font loading status for future page views
      sessionStorage.setItem('fonts-loaded', 'true');
    }).catch(function(error) {
      console.warn('Error with font loading:', error);
      // Still show content with fallback fonts
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.classList.add('fonts-loaded');
    });
    
    // Set a timeout to ensure content displays even if font loading stalls
    setTimeout(function() {
      if (!document.documentElement.classList.contains('fonts-loaded')) {
        console.log('Font loading timeout - using fallbacks');
        document.documentElement.classList.remove('fonts-loading');
        document.documentElement.classList.add('fonts-loaded');
      }
    }, 2000);
  } else {
    // For browsers without FontFace API support
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
  }
})();
