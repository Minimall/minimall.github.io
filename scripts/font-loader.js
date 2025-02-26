
(function() {
  // Add the fonts-loading class to hide content while fonts load
  document.documentElement.classList.add('fonts-loading');
  document.documentElement.classList.remove('fonts-loaded');
  
  // Check if we can use sessionStorage to optimize reloads
  if (sessionStorage.getItem('fonts-loaded')) {
    // Fonts were loaded in a previous page visit
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    return; // Exit early - no need to load fonts again
  }
  
  // Function to mark fonts as loaded
  function markFontsLoaded() {
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    sessionStorage.setItem('fonts-loaded', 'true');
  }

  // Use modern FontFace API if available
  if (typeof FontFace !== 'undefined' && 'fonts' in document) {
    // Try to use the modern FontFace API
    try {
      // Create a test loader with Recursive font
      const recursive = new FontFace('Recursive', 
        'url(https://fonts.gstatic.com/s/recursive/v35/8vJN7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE5YaERmK-CImKsvxvU-MXGX2fSqasNfUvz2xbXfn1uEQadCCk2k.woff2)', 
        { 
          weight: '300 1000',
          display: 'block'
        }
      );
      
      // Load the font
      recursive.load().then(function(loadedFont) {
        // Add the font to the document
        document.fonts.add(loadedFont);
        
        // Wait for font to be active
        document.fonts.ready.then(function() {
          // Mark fonts as loaded
          markFontsLoaded();
        });
      }).catch(function(err) {
        console.warn('Font loading error:', err);
        // Fall back to timeout-based approach
        setTimeout(markFontsLoaded, 500);
      });
    } catch(e) {
      console.warn('Error using FontFace API:', e);
      // Fall back to timeout-based approach
      setTimeout(markFontsLoaded, 500);
    }
  } else {
    // Fallback for browsers without FontFace API
    const fontTimeoutMs = 1000; // Shorter timeout for better user experience
    
    // Create a font loading detection element
    const fontLoader = document.createElement('span');
    fontLoader.style.position = 'absolute';
    fontLoader.style.visibility = 'hidden';
    fontLoader.style.fontFamily = 'Recursive, sans-serif';
    fontLoader.style.fontSize = '24px';
    fontLoader.textContent = 'Font Loaded Test';
    document.body.appendChild(fontLoader);
    
    // Set a timeout as fallback
    setTimeout(function() {
      document.body.removeChild(fontLoader);
      markFontsLoaded();
    }, fontTimeoutMs);
  }
})();
