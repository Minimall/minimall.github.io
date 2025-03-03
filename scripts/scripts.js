
// Initialize the footer animation with a small delay after page load
window.addEventListener('load', function() {
  console.log("Window fully loaded, initializing footer animation from scripts.js");
  
  // Use a small timeout to ensure all resources are properly loaded
  setTimeout(() => {
    const footerAnimationContainer = document.getElementById('footer-animation-container');
    if (footerAnimationContainer) {
      console.log("Footer animation container found");
      
      // Always make sure animation wrapper is visible
      const animationWrapper = document.querySelector('.animation-wrapper');
      if (animationWrapper) {
        console.log("Animation wrapper found, making visible");
        animationWrapper.classList.add('visible');
        
        // Force style recalculation
        void animationWrapper.offsetWidth;
      } else {
        console.error("Animation wrapper not found");
      }
      
      // Check if the function is available and call it directly
      if (typeof window.createGridAnimation === 'function') {
        // Wait a moment before initializing
        setTimeout(() => {
          console.log("Creating grid animation from scripts.js");
          window.createGridAnimation(footerAnimationContainer);
        }, 200);
      } else {
        console.error("createGridAnimation function not found in global scope");
        
        // Try to dynamically load the script if it wasn't loaded properly
        if (!document.querySelector('script[src="scripts/footer-animation.js"]')) {
          console.log("Attempting to load footer-animation.js dynamically");
          const script = document.createElement('script');
          script.src = "scripts/footer-animation.js";
          script.onload = () => {
            // Ensure wrapper is visible
            const animationWrapper = document.querySelector('.animation-wrapper');
            if (animationWrapper) animationWrapper.classList.add('visible');
            
            // Small delay to ensure function is available after script load
            setTimeout(() => {
              if (typeof window.createGridAnimation === 'function') {
                console.log("Running animation after dynamic script load");
                window.createGridAnimation(footerAnimationContainer);
              }
            }, 100);
          };
          document.body.appendChild(script);
        }
      }
    } else {
      console.error("Footer animation container not found");
    }
  }, 300); // Small delay to ensure everything is ready
  
  // Fallback initialization in case the first attempt fails
  setTimeout(() => {
    const footerAnimationContainer = document.getElementById('footer-animation-container');
    const animationWrapper = document.querySelector('.animation-wrapper');
    
    if (footerAnimationContainer && (!footerAnimationContainer.children.length || footerAnimationContainer.children.length < 10)) {
      console.log("Running fallback animation initialization");
      if (animationWrapper) animationWrapper.classList.add('visible');
      
      if (typeof window.createGridAnimation === 'function') {
        window.createGridAnimation(footerAnimationContainer);
      }
    }
  }, 2000);
});
