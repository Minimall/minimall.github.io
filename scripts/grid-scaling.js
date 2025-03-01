
// Grid scaling script - adds dynamic transform origin and optimal scaling based on viewport
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');
  
  // Set initial transform origins and calculate optimal scaling
  updateTransformOrigins();
  
  // Update transform origins when window is resized
  window.addEventListener('resize', updateTransformOrigins);
  
  // Add hover listeners to calculate optimal scale
  gridItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      const optimalScale = calculateOptimalScale(this);
      this.style.transform = `scale(${optimalScale})`;
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
  
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
  
  function calculateOptimalScale(item) {
    // Get item dimensions
    const rect = item.getBoundingClientRect();
    const itemWidth = rect.width;
    const itemHeight = rect.height;
    
    // Get the image inside the item
    const image = item.querySelector('img') || item.querySelector('video');
    if (!image) return 1;
    
    // Get the natural dimensions of the image/video
    const naturalWidth = image.naturalWidth || image.videoWidth || itemWidth;
    const naturalHeight = image.naturalHeight || image.videoHeight || itemHeight;
    
    // Calculate how much we need to scale to reach natural size
    const naturalScale = Math.max(naturalWidth / itemWidth, naturalHeight / itemHeight);
    
    // Get viewport dimensions with some padding
    const viewportWidth = window.innerWidth * 0.9; // 90% of viewport width
    const viewportHeight = window.innerHeight * 0.9; // 90% of viewport height
    
    // Calculate max scale based on viewport constraints
    const maxWidthScale = viewportWidth / itemWidth;
    const maxHeightScale = viewportHeight / itemHeight;
    
    // Choose the smallest scale that still fits in the viewport
    const viewportConstrainedScale = Math.min(maxWidthScale, maxHeightScale);
    
    // Choose the smaller of natural scale and viewport constrained scale
    // but ensure it's at least 1.2 for a noticeable effect and max 2
    return Math.min(Math.max(Math.min(naturalScale, viewportConstrainedScale), 1.2), 2);
  }
});
