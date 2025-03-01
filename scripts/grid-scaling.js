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

    // On mouse leave, first reset scale transform, then reset z-index after animation completes
    item.addEventListener('mouseleave', function() {
      // First reset the transform
      this.style.transform = '';

      // Get the transition duration from CSS
      const transitionDuration = getComputedStyle(this).transitionDuration;
      const durationMs = parseFloat(transitionDuration) * 1000 || 500;

      // Reset z-index after animation completes
      setTimeout(() => {
        if (!this.matches(':hover')) {
          this.style.zIndex = '';
        }
      }, durationMs);
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

  // Calculate consistent scale factor for an item, respecting viewport bounds
  function calculateScaleFactor(item) {
    // Get container dimensions and position
    const rect = item.getBoundingClientRect();

    // Target scale - we always want to scale to this if possible
    const targetScale = 2.0;

    // Get viewport dimensions with some padding (95% of available space)
    const viewportWidth = window.innerWidth * 0.95;
    const viewportHeight = window.innerHeight * 0.95;

    // Calculate maximum allowed scale based on viewport constraints
    const maxScaleX = viewportWidth / rect.width;
    const maxScaleY = viewportHeight / rect.height;
    const viewportConstrainedScale = Math.min(maxScaleX, maxScaleY);

    // Determine final scale - capped by viewport bounds
    // but never smaller than 1.25x (some minimal zoom effect)
    return Math.min(Math.max(1.25, targetScale), viewportConstrainedScale);
  }
});