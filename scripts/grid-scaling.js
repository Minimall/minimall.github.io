
// Grid scaling script - adds dynamic transform origin based on viewport position
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');
  
  // Set initial transform origins based on position in viewport
  updateTransformOrigins();
  
  // Update transform origins when window is resized
  window.addEventListener('resize', updateTransformOrigins);
  
  function updateTransformOrigins() {
    const viewportWidth = window.innerWidth;
    
    gridItems.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemCenterX = rect.left + (rect.width / 2);
      
      // Calculate distance from center of viewport (as percentage)
      const viewportCenter = viewportWidth / 2;
      const distanceFromCenter = (itemCenterX - viewportCenter) / viewportCenter;
      
      // Determine transform origin based on position
      if (distanceFromCenter < -0.5) {
        // Item is near left edge
        item.style.transformOrigin = 'left center';
      } else if (distanceFromCenter > 0.5) {
        // Item is near right edge
        item.style.transformOrigin = 'right center';
      } else {
        // Item is near center
        item.style.transformOrigin = 'center center';
      }
      
      // Add vertical component for items near top or bottom
      if (rect.top < 200) {
        // Near top of viewport
        item.style.transformOrigin = item.style.transformOrigin.replace('center', 'top');
      } else if (rect.bottom > window.innerHeight - 200) {
        // Near bottom of viewport
        item.style.transformOrigin = item.style.transformOrigin.replace('center', 'bottom');
      }
    });
  }
});
