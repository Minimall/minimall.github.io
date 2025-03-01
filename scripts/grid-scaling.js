
// Grid scaling script - viewport-aware scaling mechanism
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');

  // Store original aspect ratios of all containers
  gridItems.forEach(item => {
    const rect = item.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;
    item.dataset.aspectRatio = aspectRatio;
    item.style.aspectRatio = aspectRatio;
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
        console.log(`Applying scale factor: ${scaleFactor}`);
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

  // Simplified scaling factor calculation according to clear rules
  function calculateScaleFactor(item) {
    // Get the image or video inside this container
    const media = item.querySelector('img, video');
    if (!media) {
      console.log("No media found in item");
      return 1.0; // Default scale factor
    }

    // Get current viewport dimensions with 5% margin
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportMaxWidth = viewportWidth * 0.95;  // 95% of viewport width
    const viewportMaxHeight = viewportHeight * 0.95; // 95% of viewport height

    // Get container current dimensions
    const containerRect = item.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Get natural dimensions of the image/video
    const naturalWidth = media.tagName === 'IMG' ? media.naturalWidth : media.videoWidth || containerWidth;
    const naturalHeight = media.tagName === 'IMG' ? media.naturalHeight : media.videoHeight || containerHeight;

    // If media has no dimensions yet, use a fallback scale
    if (!naturalWidth || !naturalHeight) {
      console.log("Media dimensions not available yet");
      return 2.0; // Fallback scale factor
    }

    // Create debug info object
    const debugInfo = {
      mediaSrc: media.src ? media.src.split('/').pop() : 'unknown',
      naturalWidth,
      naturalHeight,
      containerWidth,
      containerHeight,
      viewportWidth,
      viewportHeight,
      viewportMaxWidth,
      viewportMaxHeight
    };

    // 1. Determine which dimension is the largest for the image
    const isWidthLarger = naturalWidth >= naturalHeight;
    debugInfo.isWidthLarger = isWidthLarger;

    // 2. Calculate target size based on viewport
    let targetWidth, targetHeight;
    let scaleFactor;

    if (isWidthLarger) {
      // Width is the largest dimension
      if (naturalWidth > viewportMaxWidth) {
        // If image is wider than viewport, scale to 95% of viewport width
        targetWidth = viewportMaxWidth;
        targetHeight = (naturalHeight / naturalWidth) * targetWidth;
        scaleFactor = targetWidth / containerWidth;
      } else {
        // If image is smaller than viewport, display at natural size
        targetWidth = naturalWidth;
        targetHeight = naturalHeight;
        scaleFactor = targetWidth / containerWidth;
      }
    } else {
      // Height is the largest dimension
      if (naturalHeight > viewportMaxHeight) {
        // If image is taller than viewport, scale to 95% of viewport height
        targetHeight = viewportMaxHeight;
        targetWidth = (naturalWidth / naturalHeight) * targetHeight;
        scaleFactor = targetHeight / containerHeight;
      } else {
        // If image is smaller than viewport, display at natural size
        targetWidth = naturalWidth;
        targetHeight = naturalHeight;
        scaleFactor = targetHeight / containerHeight;
      }
    }

    // Add calculated values to debug info
    debugInfo.targetWidth = Math.round(targetWidth);
    debugInfo.targetHeight = Math.round(targetHeight);
    debugInfo.scaleFactor = scaleFactor.toFixed(2);
    debugInfo.finalContainerWidth = Math.round(containerWidth * scaleFactor);
    debugInfo.finalContainerHeight = Math.round(containerHeight * scaleFactor);

    // Log the calculation for debugging
    console.log(`Scaling calculation for ${debugInfo.mediaSrc}:`, debugInfo);

    return scaleFactor;
  }
});
