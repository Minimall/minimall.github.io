
// Grid scaling script - consistent, predictable image scaling with viewport bounds awareness
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');

  // Store original aspect ratios of all containers
  gridItems.forEach(item => {
    const rect = item.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;
    item.dataset.aspectRatio = aspectRatio;
    item.style.aspectRatio = aspectRatio;
  });

  // Ensure all images are fully loaded to get correct natural dimensions
  const images = document.querySelectorAll('.grid-item img');
  images.forEach(img => {
    if (!img.complete) {
      img.onload = function() {
        const parent = img.closest('.grid-item');
        if (parent) {
          parent.dataset.imageAspectRatio = img.naturalWidth / img.naturalHeight;
        }
      };
    } else {
      const parent = img.closest('.grid-item');
      if (parent) {
        parent.dataset.imageAspectRatio = img.naturalWidth / img.naturalHeight;
      }
    }
  });

  // Set initial transform origins
  updateTransformOrigins();
  window.addEventListener('resize', updateTransformOrigins);

  // Mouse events for grid items
  gridItems.forEach(item => {
    // On mouse enter, first change z-index, then apply scale transform
    item.addEventListener('mouseenter', function() {
      // Set z-index immediately on hover
      this.style.zIndex = '10';

      // Apply scale transform after a minimal delay to ensure z-index is applied first
      setTimeout(() => {
        const scaleFactor = calculateScaleFactor(this);
        this.style.transform = `scale(${scaleFactor})`;
      }, 5);
    });

    // On mouse leave, first reset z-index, then reset scale transform
    item.addEventListener('mouseleave', function() {
      // First reset the z-index
      this.style.zIndex = '';
      
      // Then reset the transform after a minimal delay
      setTimeout(() => {
        if (!this.matches(':hover')) {
          this.style.transform = '';
        }
      }, 5);
    });
  });

  // Calculate the optimal transform-origin based on item position relative to viewport
  function updateTransformOrigins() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    gridItems.forEach(item => {
      const rect = item.getBoundingClientRect();

      // Determine horizontal origin
      let originX = 'center';
      if (rect.left < viewportWidth * 0.25) {
        originX = 'left';
      } else if (rect.right > viewportWidth * 0.75) {
        originX = 'right';
      }

      // Determine vertical origin
      let originY = 'center';
      if (rect.top < viewportHeight * 0.25) {
        originY = 'top';
      } else if (rect.bottom > viewportHeight * 0.75) {
        originY = 'bottom';
      }

      // Set the transform origin
      item.style.transformOrigin = `${originX} ${originY}`;
    });
  }

  // Calculate consistent scale factor for an item, respecting viewport bounds and image resolution
  function calculateScaleFactor(item) {
    // Get container dimensions and position
    const rect = item.getBoundingClientRect();
    
    // Find the image inside this container if it exists
    const image = item.querySelector('img, video');
    
    // Default target scale (used when no image or for minimum scale)
    const baseTargetScale = 2.0;
    let targetScale = baseTargetScale;
    
    // For debugging
    let debugInfo = {
      containerWidth: Math.round(rect.width),
      containerHeight: Math.round(rect.height),
      naturalWidth: 0,
      naturalHeight: 0,
      resolutionScaleX: 0,
      resolutionScaleY: 0,
      resolutionScale: 0,
      viewportWidth: Math.round(window.innerWidth * 0.95),
      viewportHeight: Math.round(window.innerHeight * 0.95),
      maxScaleX: 0,
      maxScaleY: 0,
      viewportConstrainedScale: 0,
      finalScale: 0,
      finalWidth: 0,
      finalHeight: 0
    };
    
    // If we have an image, calculate scale based on its natural dimensions
    if (image) {
      // Get natural dimensions (for images) or video dimensions
      const naturalWidth = image.tagName === 'IMG' ? image.naturalWidth : image.videoWidth || 0;
      const naturalHeight = image.tagName === 'IMG' ? image.naturalHeight : image.videoHeight || 0;
      
      debugInfo.naturalWidth = naturalWidth;
      debugInfo.naturalHeight = naturalHeight;
      
      // If we have valid natural dimensions, calculate resolution-based scale
      if (naturalWidth > 0 && naturalHeight > 0) {
        // Calculate how much we could scale based on original resolution vs current size
        const resolutionScaleX = naturalWidth / rect.width;
        const resolutionScaleY = naturalHeight / rect.height;
        
        debugInfo.resolutionScaleX = resolutionScaleX.toFixed(2);
        debugInfo.resolutionScaleY = resolutionScaleY.toFixed(2);
        
        // Use the minimum of width and height to maintain aspect ratio
        const resolutionScale = Math.min(resolutionScaleX, resolutionScaleY);
        
        debugInfo.resolutionScale = resolutionScale.toFixed(2);
        
        // Cap the target scale at the resolution scale
        // (never try to scale more than the image's native resolution would allow)
        targetScale = Math.min(baseTargetScale, resolutionScale);
      }
    }
    
    // Get viewport dimensions with some padding (95% of available space)
    const viewportWidth = window.innerWidth * 0.95;
    const viewportHeight = window.innerHeight * 0.95;
    
    // Calculate maximum allowed scale based on viewport constraints
    const maxScaleX = viewportWidth / rect.width;
    const maxScaleY = viewportHeight / rect.height;
    
    debugInfo.maxScaleX = maxScaleX.toFixed(2);
    debugInfo.maxScaleY = maxScaleY.toFixed(2);
    
    const viewportConstrainedScale = Math.min(maxScaleX, maxScaleY);
    
    debugInfo.viewportConstrainedScale = viewportConstrainedScale.toFixed(2);
    
    // Determine final scale - capped by viewport bounds and image resolution
    // but never smaller than 1.25x (some minimal zoom effect)
    const finalScale = Math.min(Math.max(1.25, targetScale), viewportConstrainedScale);
    
    debugInfo.finalScale = finalScale.toFixed(2);
    debugInfo.finalWidth = Math.round(rect.width * finalScale);
    debugInfo.finalHeight = Math.round(rect.height * finalScale);
    
    // Check if this is the heateye-tote.jpg image
    if (image && image.src.includes('heateye-tote.jpg')) {
      console.log('Scaling calculation for heateye-tote.jpg:', debugInfo);
    }
    
    return finalScale;
  }
});
