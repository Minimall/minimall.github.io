
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

    // On mouse leave, first reset transform, then reset z-index
    item.addEventListener('mouseleave', function() {
      // First reset the transform
      this.style.transform = '';

      // Then reset the z-index after a minimal delay
      setTimeout(() => {
        if (!this.matches(':hover')) {
          this.style.zIndex = '';
        }
      }, 300); // Delay to ensure transition completes
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

  // Calculate scale factor based on the new approach
  function calculateScaleFactor(item) {
    // Get the image or video inside this container
    const media = item.querySelector('img, video');
    
    // Get viewport dimensions with 95% constraint
    const viewportMaxWidth = window.innerWidth * 0.95;
    const viewportMaxHeight = window.innerHeight * 0.95;
    
    // Default scale if no media is found (fallback)
    let scaleFactor = 1.25;
    
    // Debug info
    let debugInfo = {
      containerWidth: Math.round(item.getBoundingClientRect().width),
      containerHeight: Math.round(item.getBoundingClientRect().height),
      viewportMaxWidth: Math.round(viewportMaxWidth),
      viewportMaxHeight: Math.round(viewportMaxHeight),
      naturalWidth: 0,
      naturalHeight: 0,
      isWidthLarger: false,
      scaleToViewport: 0,
      finalScaleFactor: 0,
      finalWidth: 0,
      finalHeight: 0
    };
    
    if (media) {
      // Get natural dimensions (for images) or video dimensions
      const naturalWidth = media.tagName === 'IMG' ? media.naturalWidth : media.videoWidth || 0;
      const naturalHeight = media.tagName === 'IMG' ? media.naturalHeight : media.videoHeight || 0;
      
      debugInfo.naturalWidth = naturalWidth;
      debugInfo.naturalHeight = naturalHeight;
      
      if (naturalWidth > 0 && naturalHeight > 0) {
        // Determine which dimension is larger in the image
        const isWidthLarger = naturalWidth >= naturalHeight;
        debugInfo.isWidthLarger = isWidthLarger;
        
        // Calculate direct scale from container to 95% of viewport
        if (isWidthLarger) {
          // Width is the larger dimension, so we need to scale width to 95% of viewport width
          scaleFactor = viewportMaxWidth / naturalWidth;
        } else {
          // Height is the larger dimension, so we need to scale height to 95% of viewport height
          scaleFactor = viewportMaxHeight / naturalHeight;
        }
        
        debugInfo.scaleToViewport = scaleFactor.toFixed(3);
        
        // Apply a minimum scale factor of 1.25 (some minimal zoom effect)
        scaleFactor = Math.max(1.25, scaleFactor);
        
        // Calculate final dimensions
        debugInfo.finalScaleFactor = scaleFactor.toFixed(3);
        debugInfo.finalWidth = Math.round(naturalWidth * scaleFactor);
        debugInfo.finalHeight = Math.round(naturalHeight * scaleFactor);
      }
    }
    
    // Debug output for the specific image
    if (media && media.src && media.src.includes('heateye-tote.jpg')) {
      console.log('New scaling calculation for heateye-tote.jpg:', debugInfo);
    }
    
    return scaleFactor;
  }
});
