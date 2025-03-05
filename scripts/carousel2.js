
/**
 * TrulyInfiniteCarousel
 * 
 * A high-performance carousel implementation that:
 * - Creates infinite scrolling without DOM cloning
 * - Uses physics-based momentum scrolling
 * - Supports both touch and mouse interactions
 * - Optimizes rendering with element recycling
 */

class TrulyInfiniteCarousel {
  constructor(container, options = {}) {
    // Store container reference (string selector or DOM element)
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!this.container) {
      console.error('Carousel container not found');
      return;
    }
    
    // Default options
    this.options = {
      itemSelector: options.itemSelector || '.carousel-item',
      itemSpacing: options.itemSpacing || 30, // Gap between items in pixels
      visibleBuffer: options.visibleBuffer || 2, // Extra items to render beyond viewport
      frictionFactor: options.frictionFactor || 0.92, // Base friction (lower = more friction)
      dynamicFriction: options.dynamicFriction !== false, // Whether to adjust friction based on velocity
      enableKeyboard: options.enableKeyboard !== false, // Enable keyboard navigation
      debugMode: options.debugMode || false // Enable visual debugging
    };
    
    // Core state variables
    this.items = []; // Original items from DOM
    this.virtualItems = []; // Virtual representation of items for rendering
    this.itemCount = 0; // Number of real items
    this.itemWidth = 0; // Average item width
    this.containerWidth = 0; // Viewport width
    this.totalContentWidth = 0; // Width of all items combined
    
    // Scroll state
    this.offset = 0; // Current scroll offset (can grow infinitely)
    this.targetOffset = 0; // Target offset for smooth transitions
    this.velocity = 0; // Current scroll velocity
    this.isScrolling = false; // Whether momentum scrolling is active
    this.isDragging = false; // Whether user is currently dragging
    this.isAnimating = false; // Whether an animation is in progress
    
    // Touch/mouse state
    this.startX = 0; // Starting X position for drag
    this.startY = 0; // Starting Y position for drag
    this.lastX = 0; // Last X position for velocity calculation
    this.lastY = 0; // Last Y position for drag direction detection
    this.lastMoveTime = 0; // Last move timestamp for velocity calculation
    this.isHorizontalDrag = null; // Whether current drag is horizontal
    
    // Animation state
    this.scrollAnimationId = null; // Current animation frame ID
    this.lastFrameTime = 0; // Last animation frame timestamp
    
    // Initialize the carousel
    this.init();
  }
  
  /**
   * Initialize the carousel
   */
  init() {
    // Ensure container has necessary styling
    this.setupContainerStyles();
    
    // Get all items and create virtual item data
    this.collectItems();
    
    // Measure items and container
    this.measureDimensions();
    
    // Position items initially with proper spacing
    this.initialItemPositioning();
    
    // Setup event listeners
    this.bindEvents();
    
    // Initial rendering
    this.renderItems();
    
    // Debug mode
    if (this.options.debugMode) {
      this.setupDebugTools();
    }
    
    // Handle orientation change and resize
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('orientationchange', this.onResize.bind(this));
    
    // Log initialization
    console.log('TrulyInfiniteCarousel initialized', {
      itemCount: this.itemCount,
      totalContentWidth: this.totalContentWidth,
      containerWidth: this.containerWidth
    });
  }
  
  /**
   * Set required styles on container
   */
  setupContainerStyles() {
    const containerStyle = window.getComputedStyle(this.container);
    
    // Set container styles if not already set
    if (containerStyle.position === 'static') {
      this.container.style.position = 'relative';
    }
    
    if (containerStyle.overflow !== 'hidden') {
      this.container.style.overflow = 'hidden';
    }
    
    // Create a track if not present
    this.track = this.container.querySelector('.carousel-track');
    if (!this.track) {
      this.track = document.createElement('div');
      this.track.className = 'carousel-track';
      
      // Move all direct item children into the track
      const items = this.container.querySelectorAll(this.options.itemSelector);
      items.forEach(item => {
        if (item.parentNode === this.container) {
          this.track.appendChild(item);
        }
      });
      
      this.container.appendChild(this.track);
    }
    
    // Ensure track has the right styles
    Object.assign(this.track.style, {
      display: 'flex',
      flexWrap: 'nowrap',
      position: 'relative',
      height: '100%',
      willChange: 'transform',
      touchAction: 'pan-y',
      userSelect: 'none',
      webkitUserSelect: 'none',
      cursor: 'grab'
    });
  }
  
  /**
   * Collect and initialize all carousel items
   */
  collectItems() {
    // Get all item elements
    const itemElements = this.track.querySelectorAll(this.options.itemSelector);
    this.itemCount = itemElements.length;
    
    if (this.itemCount === 0) {
      console.warn('No carousel items found');
      return;
    }
    
    // Store original items and create virtual representations
    this.items = Array.from(itemElements);
    
    // Initialize with basic data, measurements will be updated later
    this.items.forEach((item, index) => {
      // Make sure items have correct base styles
      if (window.getComputedStyle(item).position === 'static') {
        item.style.position = 'absolute';
      }
      
      item.style.top = '0';
      item.style.height = '100%';
      
      // Store original index on element for reference
      item.dataset.carouselIndex = index.toString();
      
      // Create virtual item representation (logical position tracking)
      this.virtualItems.push({
        element: item,
        index: index,
        width: 0, // Will be measured
        left: 0, // Virtual position
        visibilityIndex: index, // Used for recycling
        onScreen: false, // Whether currently visible
        x: 0 // Actual rendered position
      });
    });
  }
  
  /**
   * Measure dimensions of container and items
   */
  measureDimensions() {
    // Get container dimensions
    this.containerWidth = this.container.clientWidth;
    
    // Calculate item widths and total content width
    let totalWidth = 0;
    const spacing = this.options.itemSpacing;
    
    this.virtualItems.forEach((item, i) => {
      const element = item.element;
      // Temporarily reset transforms for accurate measurement
      const prevTransform = element.style.transform;
      element.style.transform = 'none';
      element.style.display = 'block';
      
      // Measure item width
      const width = element.offsetWidth;
      item.width = width;
      
      // Add to total width (including spacing between items)
      totalWidth += width + (i < this.itemCount - 1 ? spacing : 0);
      
      // Restore transform
      element.style.transform = prevTransform;
    });
    
    this.totalContentWidth = totalWidth;
    
    // Calculate average item width as fallback
    const avgItemWidth = totalWidth / this.itemCount;
    this.itemWidth = avgItemWidth;
    
    // Update virtual item positions based on measurements
    let currentLeft = 0;
    this.virtualItems.forEach((item, i) => {
      item.left = currentLeft;
      currentLeft += item.width + spacing;
    });
    
    // Log dimensions
    if (this.options.debugMode) {
      console.log('Carousel dimensions:', {
        containerWidth: this.containerWidth,
        totalContentWidth: this.totalContentWidth,
        avgItemWidth: avgItemWidth,
        itemWidths: this.virtualItems.map(item => item.width)
      });
    }
  }
  
  /**
   * Set up all event listeners for the carousel
   */
  bindEvents() {
    // Mouse events for desktop
    this.track.addEventListener('mousedown', this.onDragStart.bind(this));
    window.addEventListener('mousemove', this.onDragMove.bind(this));
    window.addEventListener('mouseup', this.onDragEnd.bind(this));
    
    // Touch events for mobile
    this.track.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onDragEnd.bind(this));
    
    // Wheel events for scrolling with mousewheel/trackpad
    this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    
    // Keyboard navigation
    if (this.options.enableKeyboard) {
      this.container.setAttribute('tabindex', '0'); // Make focusable
      this.container.addEventListener('keydown', this.onKeyDown.bind(this));
    }
    
    // Prevent context menu during interaction
    this.track.addEventListener('contextmenu', e => {
      if (this.isDragging) {
        e.preventDefault();
      }
    });
  }
  
  /**
   * Handle start of drag/touch interaction
   */
  onDragStart(e) {
    // Stop any ongoing animations
    this.stopScrolling();
    
    this.isDragging = true;
    this.isHorizontalDrag = null; // Direction not determined yet
    this.track.style.cursor = 'grabbing';
    
    // Get starting position from mouse or touch
    const point = e.type.includes('mouse') ? e : e.touches[0];
    this.startX = point.clientX;
    this.startY = point.clientY;
    this.lastX = this.startX;
    this.lastY = this.startY;
    this.lastMoveTime = performance.now();
    
    // Add active class for styling
    this.track.classList.add('dragging');
    
    // Prevent default behavior but only for mouse events
    // (enabling this for touch events breaks scrolling on iOS)
    if (e.type.includes('mouse')) {
      e.preventDefault();
    }
  }
  
  /**
   * Handle drag/touch movement
   */
  onDragMove(e) {
    if (!this.isDragging) return;
    
    // Get current position from mouse or touch
    const point = e.type.includes('mouse') ? e : e.touches[0];
    const currentX = point.clientX;
    const currentY = point.clientY;
    
    // Calculate deltas
    const deltaX = currentX - this.lastX;
    const deltaY = currentY - this.lastY;
    
    // Detect direction if not already determined
    if (this.isHorizontalDrag === null) {
      // Use a larger threshold for more reliable direction detection
      const absX = Math.abs(currentX - this.startX);
      const absY = Math.abs(currentY - this.startY);
      
      // If we've moved enough to detect direction
      if (absX > 12 || absY > 12) { // Increased threshold
        // If movement is more horizontal than vertical, capture it
        this.isHorizontalDrag = absX > absY;
        
        // Add a class to indicate drag direction
        if (this.isHorizontalDrag) {
          this.track.classList.add('horizontal-drag');
        } else {
          this.track.classList.add('vertical-drag');
        }
      }
    }
    
    // Only process horizontal movements when determined
    if (this.isHorizontalDrag === true) {
      // Update offset with natural direction - content follows the cursor
      // This matches desktop platform conventions where dragging content makes it move with your cursor
      this.offset += deltaX * 0.9; // Slightly higher sensitivity for more responsive feel
      
      // Calculate velocity for momentum that matches drag direction
      const now = performance.now();
      const elapsed = now - this.lastMoveTime;
      if (elapsed > 0) {
        // Velocity in pixels per millisecond with direction preserved
        this.velocity = -(deltaX * 0.6) / elapsed; // Negative for correct momentum direction
      }
      
      // Update last values
      this.lastMoveTime = now;
      
      // Update visual position
      this.renderItems();
      
      // Prevent default only for horizontal drag to allow vertical scrolling
      e.preventDefault();
    }
    
    // Update last position
    this.lastX = currentX;
    this.lastY = currentY;
  }
  
  /**
   * Handle end of drag/touch interaction
   */
  onDragEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.track.style.cursor = 'grab';
    
    // Remove classes
    this.track.classList.remove('dragging', 'horizontal-drag', 'vertical-drag');
    
    // Only apply momentum if this was a horizontal drag
    if (this.isHorizontalDrag === true) {
      // Scale velocity for momentum effect with reduced intensity
      const momentumVelocity = this.velocity * -300; // Reduced momentum scaling
      
      // Limit maximum velocity to prevent excessive scrolling
      const limitedVelocity = Math.sign(momentumVelocity) * 
        Math.min(Math.abs(momentumVelocity), 150); // Cap maximum velocity
      
      // Start momentum scrolling
      this.startScrollWithVelocity(limitedVelocity);
    }
  }
  
  /**
   * Handle mouse wheel events
   */
  onWheel(e) {
    // Stop any ongoing animations
    this.stopScrolling();
    
    // Prevent default browser scrolling behavior
    e.preventDefault();
    
    // Use standard scrolling direction for desktop (negative deltaY means scroll up/left)
    // This follows the standard convention where scrolling down/right moves content left
    const scrollDelta = -(e.deltaY || e.deltaX) * 0.4; // Negative for natural scrolling direction
    this.offset += scrollDelta;
    
    // Update visual position
    this.renderItems();
    
    // Apply momentum for smoother feel
    const velocity = -scrollDelta * 0.3; // Correctly calculated momentum based on direction
    this.startScrollWithVelocity(velocity);
  }
  
  /**
   * Handle keyboard navigation
   */
  onKeyDown(e) {
    // Only handle left/right arrows
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      
      // Calculate amount to scroll (about 20% of container width)
      const scrollAmount = this.containerWidth * 0.2 * (e.key === 'ArrowLeft' ? -1 : 1);
      
      // Animate scroll
      this.scrollBy(scrollAmount, true);
    }
  }
  
  /**
   * Handle window resize or orientation change
   */
  onResize() {
    // Don't measure immediately, wait for resize to complete
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    
    this.resizeTimer = setTimeout(() => {
      // Get current relative position as percentage of total width
      const relativePosition = this.offset / this.totalContentWidth;
      
      // Remeasure dimensions
      this.measureDimensions();
      
      // Maintain relative position
      this.offset = relativePosition * this.totalContentWidth;
      
      // Update visual position
      this.renderItems();
      
      if (this.options.debugMode) {
        console.log('Carousel resized:', {
          containerWidth: this.containerWidth,
          totalContentWidth: this.totalContentWidth
        });
      }
    }, 250);
  }
  
  /**
   * Start momentum scrolling with given velocity
   */
  startScrollWithVelocity(initialVelocity) {
    // Set initial velocity (pixels per second)
    this.velocity = initialVelocity;
    
    // Start animation if not already running
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.lastFrameTime = performance.now();
      this.scrollAnimationId = requestAnimationFrame(this.updateScroll.bind(this));
    }
  }
  
  /**
   * Update scroll position during momentum scrolling
   */
  updateScroll(timestamp) {
    // Calculate time since last frame
    const elapsed = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Skip if too much time passed (tab was inactive)
    if (elapsed > 100) {
      this.isScrolling = false;
      return;
    }
    
    // Calculate how much to scroll this frame
    const delta = this.velocity * elapsed;
    
    // Update scroll position
    if (delta !== 0) {
      this.offset -= delta;
      this.renderItems();
    }
    
    // Apply dynamic friction based on velocity
    let friction = this.options.frictionFactor;
    
    // Dynamic friction: faster movement = less friction
    if (this.options.dynamicFriction) {
      const absVelocity = Math.abs(this.velocity);
      if (absVelocity > 2) {
        friction = 0.97; // Very fast
      } else if (absVelocity > 1) {
        friction = 0.95; // Fast
      } else if (absVelocity > 0.5) {
        friction = 0.92; // Medium
      } else if (absVelocity > 0.2) {
        friction = 0.88; // Slow
      } else {
        friction = 0.82; // Very slow
      }
    }
    
    // Apply friction
    this.velocity *= friction;
    
    // Stop scrolling when velocity becomes negligible
    if (Math.abs(this.velocity) < 0.01) {
      this.isScrolling = false;
    } else {
      // Continue animation
      this.scrollAnimationId = requestAnimationFrame(this.updateScroll.bind(this));
    }
  }
  
  /**
   * Stop any ongoing scrolling
   */
  stopScrolling() {
    if (this.scrollAnimationId) {
      cancelAnimationFrame(this.scrollAnimationId);
      this.scrollAnimationId = null;
    }
    this.isScrolling = false;
    this.velocity = 0;
  }
  
  /**
   * Programmatically scroll the carousel by the given amount
   */
  scrollBy(amount, animate = false) {
    if (animate) {
      // Animate the scroll
      this.velocity = 0;
      this.targetOffset = this.offset + amount;
      
      const duration = 500; // ms
      const startOffset = this.offset;
      const startTime = performance.now();
      
      const animateToTarget = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth motion
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        
        // Update current offset
        this.offset = startOffset + (amount * easeProgress);
        this.renderItems();
        
        if (progress < 1) {
          requestAnimationFrame(animateToTarget);
        }
      };
      
      requestAnimationFrame(animateToTarget);
    } else {
      // Instant scroll
      this.offset += amount;
      this.renderItems();
    }
  }
  
  /**
   * Render all items based on current offset
   * This is the core function that positions items using wrapping logic
   */
  renderItems() {
    // Normalize the offset within the content width
    // This is the key to infinite scrolling without clones
    const normalizedOffset = this.moduloWithNegative(this.offset, this.totalContentWidth);
    
    // Calculate which items should be visible with a larger buffer to prevent flickering
    const visibilityBuffer = this.options.itemSpacing * Math.max(6, this.options.visibleBuffer);
    const visibleStart = -visibilityBuffer;
    const visibleEnd = this.containerWidth + visibilityBuffer;
    
    // Sort virtualItems by index to ensure consistent rendering order
    // Using stable sort to maintain visual order during interaction
    const sortedItems = [...this.virtualItems].sort((a, b) => {
      // First sort by index to ensure stable ordering
      return a.index - b.index;
    });
    
    // Track item positions to prevent overlapping
    const usedPositions = new Map();
    
    // Position each item
    sortedItems.forEach(item => {
      const element = item.element;
      
      // Calculate item's virtual position
      let itemOffset = item.left - normalizedOffset;
      
      // More stable wrapping logic with improved collision avoidance
      const totalWidth = this.totalContentWidth;
      
      // Original position before any wrapping
      const originalOffset = itemOffset;
      
      // Apply wrapping logic more conservatively to reduce shuffling
      if (itemOffset > totalWidth - visibleStart) {
        itemOffset -= totalWidth;
      } else if (itemOffset + item.width < visibleEnd - totalWidth) {
        itemOffset += totalWidth;
      }
      
      // Store the wrapped position for collision detection
      item.wrappedPosition = itemOffset;
      
      // Determine if the item should be visible with an expanded buffer for smoother transitions
      const isVisible = (
        itemOffset < visibleEnd &&
        itemOffset + item.width > visibleStart
      );
      
      // Show/hide based on visibility and update position with smooth transitions
      if (isVisible) {
        if (!item.onScreen) {
          // Ensure elements fade in smoothly when becoming visible
          element.style.opacity = '0';
          element.style.display = 'block';
          // Force a reflow before starting transition
          void element.offsetWidth;
          element.style.opacity = '1';
          item.onScreen = true;
        }
        
        // Smooth out position changes for items near the center
        let smoothedOffset = itemOffset;
        
        // Smoother transitions for items near the viewport center
        const distanceFromCenter = Math.abs(itemOffset - (this.containerWidth / 2));
        const isNearCenter = distanceFromCenter < (this.containerWidth * 0.6);
        
        // Use transform for positioning with hardware acceleration
        // Add easing for smoother movement and reduce visual jumping
        element.style.transform = `translateX(${smoothedOffset}px) translateZ(0)`;
        
        // Dynamic z-index to ensure proper overlapping (center items on top)
        element.style.zIndex = Math.round(1000 - distanceFromCenter);
        
        // Store the current position
        item.x = smoothedOffset;
      } else {
        if (item.onScreen) {
          // Fade out items before removing them
          element.style.opacity = '0';
          setTimeout(() => {
            // Only hide if still off-screen after timeout
            if (!item.onScreen) {
              element.style.display = 'none';
            }
          }, 300);
          item.onScreen = false;
        }
      }
    });
    
    // Update debug display if enabled
    if (this.options.debugMode && this.debugDisplay) {
      this.updateDebugInfo();
    }
  }
  
  /**
   * Position items initially with proper spacing
   */
  initialItemPositioning() {
    // Calculate initial offset to center items in the viewport
    const containerCenter = this.containerWidth / 2;
    const firstItemCenter = this.virtualItems[0].width / 2;
    const initialOffset = containerCenter - firstItemCenter;
    
    // Position each item with proper spacing
    let currentOffset = initialOffset;
    this.virtualItems.forEach((item, index) => {
      item.element.style.display = 'block';
      item.element.style.transform = `translateX(${currentOffset}px) translateZ(0)`;
      item.x = currentOffset;
      item.onScreen = true;
      
      // Update offset for next item
      currentOffset += item.width + this.options.itemSpacing;
    });
    
    // Set initial offset to position first item properly
    this.offset = -initialOffset + (this.options.itemSpacing / 2);
  }
  
  /**
   * Safe modulo function that handles negative numbers correctly
   */
  moduloWithNegative(n, m) {
    return ((n % m) + m) % m;
  }
  
  /**
   * Setup debugging tools for development
   */
  setupDebugTools() {
    // Create debug display
    this.debugDisplay = document.createElement('div');
    this.debugDisplay.className = 'carousel-debug';
    Object.assign(this.debugDisplay.style, {
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '5px 10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: '100',
      borderRadius: '4px',
      maxWidth: '300px',
      pointerEvents: 'none'
    });
    
    this.container.appendChild(this.debugDisplay);
    this.updateDebugInfo();
    
    // Add visual indicators for item positions
    this.virtualItems.forEach(item => {
      const indicator = document.createElement('div');
      indicator.className = 'item-debug-indicator';
      Object.assign(indicator.style, {
        position: 'absolute',
        bottom: '5px',
        height: '3px',
        background: `hsl(${item.index * 30}, 80%, 50%)`,
        opacity: '0.8',
        zIndex: '99'
      });
      item.element.appendChild(indicator);
      item.debugIndicator = indicator;
    });
  }
  
  /**
   * Update debug information
   */
  updateDebugInfo() {
    if (!this.debugDisplay) return;
    
    const normalizedOffset = this.moduloWithNegative(this.offset, this.totalContentWidth);
    
    this.debugDisplay.innerHTML = `
      Offset: ${Math.round(this.offset)}px<br>
      Normalized: ${Math.round(normalizedOffset)}px<br>
      Velocity: ${this.velocity.toFixed(2)}px/ms<br>
      Visible: ${this.virtualItems.filter(i => i.onScreen).length}/${this.itemCount}<br>
      Container: ${this.containerWidth}px<br>
      Content: ${Math.round(this.totalContentWidth)}px
    `;
    
    // Update item indicators
    this.virtualItems.forEach(item => {
      if (item.debugIndicator && item.onScreen) {
        item.debugIndicator.style.width = `${item.width}px`;
        item.debugIndicator.style.left = '0';
        item.debugIndicator.textContent = item.index;
        item.debugIndicator.style.color = 'white';
        item.debugIndicator.style.fontSize = '10px';
        item.debugIndicator.style.textAlign = 'center';
      }
    });
  }
  
  /**
   * Go to a specific item
   */
  goToItem(index, animate = true) {
    if (index < 0 || index >= this.itemCount) {
      console.warn('Invalid item index:', index);
      return;
    }
    
    // Calculate target offset
    const targetItem = this.virtualItems[index];
    const targetOffset = targetItem.left + (targetItem.width / 2) - (this.containerWidth / 2);
    
    // Scroll to target
    const deltaOffset = targetOffset - this.offset;
    this.scrollBy(deltaOffset, animate);
  }
  
  /**
   * Destroy the carousel instance and clean up
   */
  destroy() {
    // Stop any animations
    this.stopScrolling();
    
    // Remove event listeners
    this.track.removeEventListener('mousedown', this.onDragStart);
    window.removeEventListener('mousemove', this.onDragMove);
    window.removeEventListener('mouseup', this.onDragEnd);
    
    this.track.removeEventListener('touchstart', this.onDragStart);
    window.removeEventListener('touchmove', this.onDragMove);
    window.removeEventListener('touchend', this.onDragEnd);
    
    this.container.removeEventListener('wheel', this.onWheel);
    
    if (this.options.enableKeyboard) {
      this.container.removeEventListener('keydown', this.onKeyDown);
    }
    
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    
    // Remove debug elements if they exist
    if (this.debugDisplay) {
      this.debugDisplay.remove();
    }
    
    this.virtualItems.forEach(item => {
      if (item.debugIndicator) {
        item.debugIndicator.remove();
      }
      
      // Reset item styles
      const element = item.element;
      element.style.transform = '';
      element.style.position = '';
      element.style.display = '';
      element.style.top = '';
      element.style.height = '';
      
      // Remove data attributes
      delete element.dataset.carouselIndex;
    });
    
    // Reset track styles
    this.track.style = '';
    this.track.classList.remove('dragging', 'horizontal-drag', 'vertical-drag');
    
    console.log('Carousel destroyed');
  }
}

// Initialize carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Find all carousel containers
  const carouselContainers = document.querySelectorAll('.carousel-container');
  
  // Function to initialize carousels with proper timing
  const initializeCarousels = () => {
    carouselContainers.forEach(container => {
      // Create and store the carousel instance
      const carousel = new TrulyInfiniteCarousel(container, {
        itemSelector: '.carousel-item',
        itemSpacing: 40, // Increased spacing for better separation
        visibleBuffer: 5, // Larger buffer for smoother experience
        frictionFactor: 0.92, // Better deceleration
        dynamicFriction: true, // Enable dynamic friction
        debugMode: false
      });
      
      // Store the instance on the container for external access
      container.carousel = carousel;
    });
    
    // Make the carousel class globally available
    window.TrulyInfiniteCarousel = TrulyInfiniteCarousel;
  };
  
  // Wait for images to load before initializing carousel
  // This helps ensure proper measurements
  if (document.readyState === 'complete') {
    initializeCarousels();
  } else {
    // Use both approaches for maximum compatibility
    window.addEventListener('load', initializeCarousels);
    setTimeout(initializeCarousels, 300); // Fallback if load event doesn't fire
  }
});
