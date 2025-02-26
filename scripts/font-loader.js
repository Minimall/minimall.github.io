(function() {
  // Add the fonts-loading class to hide content while fonts load
  document.documentElement.classList.add('fonts-loading');

  // Use system fonts immediately to prevent FOUT
  document.documentElement.classList.add('fonts-loaded');

  // Use modern FontFace API if available
  if (typeof FontFace !== 'undefined' && 'fonts' in document) {
    try {
      // Create a font face for Recursive
      const recursive = new FontFace('Recursive', 
        'url(https://fonts.googleapis.com/css2?family=Recursive:wght,CASL,CRSV,MONO@300..1000,0..1,0..1,0..1&display=swap)',
        { 
          weight: '300 1000',
          display: 'swap'
        }
      );

      // Load the font with a timeout
      Promise.race([
        recursive.load(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Font loading timeout')), 2000))
      ]).then(function(loadedFont) {
        // Add the font to the document
        document.fonts.add(loadedFont);
        console.log('Font loaded successfully');
      }).catch(function(err) {
        console.warn('Font loading error:', err);
        // Already using system fonts fallback
      });
    } catch(e) {
      console.warn('Error using FontFace API:', e);
      // Already using system fonts fallback
    }
  }
})();