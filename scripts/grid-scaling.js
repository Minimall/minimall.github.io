
// Grid scaling script - adds dynamic transform origin and optimal scaling based on viewport
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');

  // Store original aspect ratios of all containers to maintain them during scaling
  gridItems.forEach(item => {
    const rect = item.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;
    item.dataset.aspectRatio = aspectRatio;
    // Apply the aspect ratio directly to ensure it's maintained
    item.style.aspectRatio = aspectRatio;
  });

  // Ensure all images are fully loaded to get correct natural dimensions
  const images = document.querySelectorAll('.grid-item img');
  images.forEach(img => {
    if (!img.complete) {
      img.onload = function() {
        console.log(`Image loaded: ${img.src}, natural size: ${img.naturalWidth}x${img.naturalHeight}`);
        // Store image aspect ratio
        const parent = img.closest('.grid-item');
        if (parent) {
          parent.dataset.imageAspectRatio = img.naturalWidth / img.naturalHeight;
        }
      };
    } else {
      console.log(`Image already loaded: ${img.src}, natural size: ${img.naturalWidth}x${img.naturalHeight}`);
      // Store image aspect ratio
      const parent = img.closest('.grid-item');
      if (parent) {
        parent.dataset.imageAspectRatio = img.naturalWidth / img.naturalHeight;
      }
    }
  });

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
      // Set z-index immediately on hover, before the animation starts
      this.style.zIndex = '10';
      
      // Very slight delay to ensure z-index is applied first before animation
      setTimeout(() => {
        const optimalScale = calculateOptimalScale(this);
  
        // Check if hovering would cause too much overlap
        if (checkOverlapConstraints(this, optimalScale)) {
          this.style.transform = `scale(${optimalScale})`;
        } else {
          // Reduce scale until overlap is acceptable
          let safeScale = findSafeScale(this, optimalScale);
          this.style.transform = `scale(${safeScale})`;
        }
      }, 5); // Very minimal delay to ensure proper sequence
    });

    item.addEventListener('mouseleave', function() {
      // Reset transform first, then z-index after animation completes
      this.style.transform = '';

      // Only reset z-index after animation completes
      const transitionDuration = getComputedStyle(this).transitionDuration;
      const durationMs = parseFloat(transitionDuration) * 1000 || 500; // Default to 500ms if can't parse
      
      setTimeout(() => {
        // Only reset if not hovered again
        if (!this.matches(':hover')) {
          this.style.zIndex = '';
        }
      }, durationMs); 
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
    // Get the container dimensions
    const containerRect = item.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Get the image inside the container
    const image = item.querySelector('img') || item.querySelector('video');
    if (!image) return 1;

    // Get the natural dimensions of the image/video
    // Force image to load completely to get correct dimensions
    if (image.complete) {
      // Image is already loaded
      const naturalWidth = image.naturalWidth || image.videoWidth || containerWidth;
      const naturalHeight = image.naturalHeight || image.videoHeight || containerHeight;

      // Calculate how much we need to scale the CONTAINER to show the image at its natural size
      // while preserving the container's aspect ratio
      const containerAspectRatio = parseFloat(item.dataset.aspectRatio) || (containerWidth / containerHeight);
      const imageAspectRatio = parseFloat(item.dataset.imageAspectRatio) || (naturalWidth / naturalHeight);

      // Determine if the container or image aspect ratio is the limiting factor
      let naturalScale;
      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider relative to its height than the container
        naturalScale = naturalWidth / containerWidth;
      } else {
        // Image is taller relative to its width than the container
        naturalScale = naturalHeight / containerHeight;
      }

      // Get viewport dimensions with some padding (90% of available space)
      const viewportWidth = window.innerWidth * 0.9;
      const viewportHeight = window.innerHeight * 0.9;

      // Calculate max scale based on viewport constraints while preserving aspect ratio
      const maxWidthScale = viewportWidth / containerWidth;
      const maxHeightScale = viewportHeight / containerHeight;

      // Choose the smallest scale that still fits in the viewport
      const viewportConstrainedScale = Math.min(maxWidthScale, maxHeightScale);

      // Choose the smaller of natural scale and viewport constrained scale
      // Ensures container scales to show image at full resolution while fitting in viewport
      // But never scale less than 1.5x to ensure we see more detail
      return Math.min(Math.max(naturalScale, 1.5), viewportConstrainedScale);
    } else {
      // If image isn't fully loaded yet, use a fallback large scale
      return Math.min(3, window.innerHeight / containerHeight);
    }
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
