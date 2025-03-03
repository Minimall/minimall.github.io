
// Initialize the footer animation when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
  const footerAnimationContainer = document.getElementById('footer-animation-container');
  if (footerAnimationContainer) {
    // Make sure animation wrapper is visible
    const animationWrapper = document.querySelector('.animation-wrapper');
    if (animationWrapper) {
      animationWrapper.classList.add('visible');
    }
    
    // Initialize the grid animation
    if (typeof createGridAnimation === 'function') {
      createGridAnimation(footerAnimationContainer);
    } else {
      console.error('createGridAnimation function not found');
    }
  } else {
    console.error('Footer animation container not found');
  }
});
