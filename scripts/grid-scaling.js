// Grid scaling script - simple viewport-aware scaling mechanism
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

  // Simple scaling factor calculation according to new rules
  function calculateScaleFactor(item) {
    // Get the image or video inside this container
    const media = item.querySelector('img, video');

    // Default scale if no media is found (fallback)
    let scaleFactor = 1.0;

    // Get current viewport dimensions with 5% margin
    const viewportMaxWidth = window.innerWidth * 0.95;
    const viewportMaxHeight = window.innerHeight * 0.95;

    // Debug info object
    let debugInfo = {
      containerWidth: Math.round(item.getBoundingClientRect().width),
      containerHeight: Math.round(item.getBoundingClientRect().height),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      viewportMaxWidth: Math.round(viewportMaxWidth),
      viewportMaxHeight: Math.round(viewportMaxHeight)
    };

    if (media) {
      // 1. Get natural dimensions of the image
      const naturalWidth = media.tagName === 'IMG' ? media.naturalWidth : media.videoWidth || 0;
      const naturalHeight = media.tagName === 'IMG' ? media.naturalHeight : media.videoHeight || 0;

      // Add to debug info
      debugInfo.naturalWidth = naturalWidth;
      debugInfo.naturalHeight = naturalHeight;

      if (naturalWidth > 0 && naturalHeight > 0) {
        // 2. Determine which dimension is bigger
        const isWidthLarger = naturalWidth >= naturalHeight;
        debugInfo.isWidthLarger = isWidthLarger;

        // 3. Check if the largest dimension is bigger than the viewport
        if (isWidthLarger) {
          // Width is the larger dimension
          if (naturalWidth > viewportMaxWidth) {
            // 3.2 If larger than viewport, scale down to 95% of viewport width
            scaleFactor = viewportMaxWidth / naturalWidth;
          } else {
            // 3.1 If smaller than viewport, show at natural size (or scale up just enough)
            // Calculate how much we need to scale to reach natural size
            const containerRect = item.getBoundingClientRect();
            scaleFactor = naturalWidth / containerRect.width;
          }
        } else {
          // Height is the larger dimension
          if (naturalHeight > viewportMaxHeight) {
            // 3.2 If larger than viewport, scale down to 95% of viewport height
            scaleFactor = viewportMaxHeight / naturalHeight;
          } else {
            // 3.1 If smaller than viewport, show at natural size (or scale up just enough)
            // Calculate how much we need to scale to reach natural size
            const containerRect = item.getBoundingClientRect();
            scaleFactor = naturalHeight / containerRect.height;
          }
        }

        // Update debug info
        debugInfo.scaleFactor = scaleFactor.toFixed(3);
        debugInfo.finalWidth = Math.round(debugInfo.containerWidth * scaleFactor);
        debugInfo.finalHeight = Math.round(debugInfo.containerHeight * scaleFactor);
      }
    }

    // Debug output for specific test images
    if (media && media.src) {
      const filename = media.src.split('/').pop();
      if (filename === 'heateye-tote.jpg' || filename === 'heateye-graphics.jpg') {
        console.log(`New scaling calculation for ${filename}:`, debugInfo);
      }
    }

    return scaleFactor;
  }
});