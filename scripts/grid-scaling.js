
// Grid scaling script - adds dynamic transform origin and optimal scaling based on viewport
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');
  
  // Set initial transform origins and calculate optimal scaling
  updateTransformOrigins();
  adjustInitialPositioning();
  
  // Update transform origins and positions when window is resized
  window.addEventListener('resize', function() {
    updateTransformOrigins();
    adjustInitialPositioning();
  });
  
  // Add hover listeners to calculate optimal scale
  gridItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      const optimalScale = calculateOptimalScale(this);
      
      // Check if hovering would cause too much overlap
      if (checkOverlapConstraints(this, optimalScale)) {
        this.style.transform = `scale(${optimalScale})`;
      } else {
        // Reduce scale until overlap is acceptable
        let safeScale = findSafeScale(this, optimalScale);
        this.style.transform = `scale(${safeScale})`;
      }
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
    
    // Calculate how much we need to scale to reach natural size (100% of image)
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
    // This ensures images are shown at 100% of their size but still fit in viewport
    return Math.min(naturalScale, viewportConstrainedScale);
  }
  
  // Function to check if scaling would cause too much overlap
  function checkOverlapConstraints(item, scale) {
    const MAX_OVERLAP_PERCENTAGE = 0.05; // 5% max overlap allowed
    const hoveredRect = item.getBoundingClientRect();
    
    // Calculate what the bounds would be after scaling
    const scaledWidth = hoveredRect.width * scale;
    const scaledHeight = hoveredRect.height * scale;
    
    // Calculate the center point
    const centerX = hoveredRect.left + hoveredRect.width / 2;
    const centerY = hoveredRect.top + hoveredRect.height / 2;
    
    // Calculate the projected bounds after scaling
    const projectedRect = {
      left: centerX - scaledWidth / 2,
      right: centerX + scaledWidth / 2,
      top: centerY - scaledHeight / 2,
      bottom: centerY + scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight
    };
    
    // Check overlap with all other items
    for (const otherItem of document.querySelectorAll('.grid-item')) {
      if (otherItem === item) continue;
      
      const otherRect = otherItem.getBoundingClientRect();
      
      // Calculate overlap area
      const overlapX = Math.max(0, Math.min(projectedRect.right, otherRect.right) - Math.max(projectedRect.left, otherRect.left));
      const overlapY = Math.max(0, Math.min(projectedRect.bottom, otherRect.bottom) - Math.max(projectedRect.top, otherRect.top));
      const overlapArea = overlapX * overlapY;
      
      // Calculate area of the other item
      const otherArea = otherRect.width * otherRect.height;
      
      // Check if overlap exceeds threshold
      if (overlapArea > 0) {
        const overlapPercentage = overlapArea / otherArea;
        
        // Check if this item would completely cover another item
        const isCompleteOverlap = overlapArea >= (otherArea * 0.95); // 95% or more is considered complete overlap
        
        if (overlapPercentage > MAX_OVERLAP_PERCENTAGE || isCompleteOverlap) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Function to find a safe scale factor that doesn't cause too much overlap
  function findSafeScale(item, maxScale) {
    const minScale = 1.2;
    const step = 0.05;
    
    // Start from max and decrease until we find a safe scale
    for (let scale = maxScale; scale >= minScale; scale -= step) {
      if (checkOverlapConstraints(item, scale)) {
        return scale;
      }
    }
    
    // If all else fails, return minimum scale
    return minScale;
  }
  
  // Function to adjust initial grid positioning to minimize overlaps
  function adjustInitialPositioning() {
    const gridItems = Array.from(document.querySelectorAll('.grid-item'));
    let hasOverlap = true;
    let attempts = 0;
    
    // Do basic overlap check and adjustment
    while (hasOverlap && attempts < 5) {
      hasOverlap = false;
      attempts++;
      
      for (let i = 0; i < gridItems.length; i++) {
        const itemA = gridItems[i];
        const rectA = itemA.getBoundingClientRect();
        
        for (let j = i + 1; j < gridItems.length; j++) {
          const itemB = gridItems[j];
          const rectB = itemB.getBoundingClientRect();
          
          // Calculate overlap area
          const overlapX = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
          const overlapY = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
          const overlapArea = overlapX * overlapY;
          
          // Calculate area of both items
          const areaA = rectA.width * rectA.height;
          const areaB = rectB.width * rectB.height;
          
          // Calculate overlap percentage relative to each item
          const overlapPercentageA = overlapArea / areaA;
          const overlapPercentageB = overlapArea / areaB;
          
          // If overlap exceeds threshold, adjust positions
          if (overlapPercentageA > 0.05 || overlapPercentageB > 0.05) {
            hasOverlap = true;
            
            // Get current grid values
            const computedStyleA = window.getComputedStyle(itemA);
            const computedStyleB = window.getComputedStyle(itemB);
            
            // Adjust positions based on relative positions
            if (rectA.left < rectB.left) {
              // A is to the left of B, move A more left or B more right
              const currentMarginA = parseFloat(itemA.style.marginRight || '0');
              itemA.style.marginRight = (currentMarginA + 5) + 'px';
            } else {
              // B is to the left of A, move B more left or A more right
              const currentMarginB = parseFloat(itemB.style.marginRight || '0');
              itemB.style.marginRight = (currentMarginB + 5) + 'px';
            }
            
            if (rectA.top < rectB.top) {
              // A is above B, move A more up or B more down
              const currentMarginA = parseFloat(itemA.style.marginBottom || '0');
              itemA.style.marginBottom = (currentMarginA + 5) + 'px';
            } else {
              // B is above A, move B more up or A more down
              const currentMarginB = parseFloat(itemB.style.marginBottom || '0');
              itemB.style.marginBottom = (currentMarginB + 5) + 'px';
            }
          }
        }
      }
    }
  }
});
