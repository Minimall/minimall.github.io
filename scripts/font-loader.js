
// Font loading optimization
(function() {
  // Add the fonts-loading class to hide content while fonts load
  document.documentElement.classList.add('fonts-loading');
  
  // Check if fonts were already loaded in a previous session
  if (sessionStorage.getItem('fonts-loaded')) {
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    return;
  }
  
  // Create a simple font loader
  const fontLoader = () => {
    return new Promise((resolve) => {
      // Try to load the font
      const font = new FontFace('Recursive', 'url(/fonts/Recursive-Regular.woff2) format("woff2")');
      
      font.load().then(() => {
        // Add the font to the document
        document.fonts.add(font);
        console.log('Recursive font loaded successfully');
        resolve(true);
      }).catch(err => {
        console.error('Error loading Recursive font:', err);
        // Resolve anyway to show content with fallback fonts
        resolve(false);
      });
      
      // Set a timeout of 3 seconds in case font loading hangs
      setTimeout(() => {
        console.log('Font loading timed out, using fallback fonts');
        resolve(false);
      }, 3000);
    });
  };
  
  // Load the font
  fontLoader().then(success => {
    document.documentElement.classList.remove('fonts-loading');
    document.documentElement.classList.add('fonts-loaded');
    
    if (success) {
      // Cache the font loading status
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  });
})();
