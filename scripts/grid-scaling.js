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

  // Calculate consistent scale factor for an item, respecting viewport bounds and image resolution
  function calculateScaleFactor(item) {
    // Get container dimensions and position
    const rect = item.getBoundingClientRect();

    // Find the image inside this container if it exists
    const image = item.querySelector('img, video');

    // For debugging
    let debugInfo = {
      containerWidth: Math.round(rect.width),
      containerHeight: Math.round(rect.height),
      naturalWidth: 0,
      naturalHeight: 0,
      viewportWidth: Math.round(window.innerWidth * 0.95),
      viewportHeight: Math.round(window.innerHeight * 0.95),
      scaleFactor: 0,
      finalWidth: 0,
      finalHeight: 0
    };

    // Get viewport dimensions with 95% padding
    const viewportWidth = window.innerWidth * 0.95;
    const viewportHeight = window.innerHeight * 0.95;

    // Default scale if no image is found
    let scaleFactor = 1.5;

    // If we have an image, calculate scale based on its natural dimensions
    if (image) {
      // Get natural dimensions (for images) or video dimensions
      const naturalWidth = image.tagName === 'IMG' ? image.naturalWidth : image.videoWidth || 0;
      const naturalHeight = image.tagName === 'IMG' ? image.naturalHeight : image.videoHeight || 0;

      debugInfo.naturalWidth = naturalWidth;
      debugInfo.naturalHeight = naturalHeight;

      // If we have valid natural dimensions, calculate optimal scale
      if (naturalWidth > 0 && naturalHeight > 0) {
        // Determine which dimension is larger in the image
        const isWidthLarger = naturalWidth >= naturalHeight;

        // Calculate scale factor based on the larger dimension to fill 95% of viewport
        if (isWidthLarger) {
          // Width is the larger dimension, so scale to 95% of viewport width
          scaleFactor = viewportWidth / naturalWidth;
        } else {
          // Height is the larger dimension, so scale to 95% of viewport height
          scaleFactor = viewportHeight / naturalHeight;
        }

        // Apply a minimum scale factor of 1.25 (some minimal zoom effect)
        scaleFactor = Math.max(1.25, scaleFactor);

        debugInfo.scaleFactor = scaleFactor.toFixed(2);
        debugInfo.finalWidth = Math.round(naturalWidth * scaleFactor);
        debugInfo.finalHeight = Math.round(naturalHeight * scaleFactor);
      }
    }

    // Check if this is the heateye-tote.jpg image for debugging
    if (image && image.src.includes('heateye-tote.jpg')) {
      console.log('New scaling calculation for heateye-tote.jpg:', debugInfo);
    }

    return scaleFactor;
  }
});