
// Initialize the footer animation when the page is fully loaded
window.addEventListener('load', function() {
  console.log("Window loaded, initializing footer animation");
  const footerAnimationContainer = document.getElementById('footer-animation-container');
  if (footerAnimationContainer) {
    console.log("Footer animation container found");
    
    // Make sure animation wrapper is visible
    const animationWrapper = document.querySelector('.animation-wrapper');
    if (animationWrapper) {
      console.log("Animation wrapper found, making visible");
      animationWrapper.classList.add('visible');
    } else {
      console.error("Animation wrapper not found");
    }
    
    // Check if the function is available
    if (typeof window.createGridAnimation === 'function') {
      console.log("Creating grid animation");
      window.createGridAnimation(footerAnimationContainer);
    } else {
      console.error("createGridAnimation function not found in global scope");
    }
  } else {
    console.error("Footer animation container not found");
  }
});
