
/**
 * MobileCarousel
 * 
 * A specialized carousel implementation optimized for mobile devices that:
 * - Creates smooth scrolling without image overlapping
 * - Uses the same physics-based momentum as desktop
 * - Optimizes image sizing and positioning for mobile viewports
 * - Prevents unwanted background images from showing
 */

class MobileCarousel {
  constructor(container, options = {}) {
    // Store container reference
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!this.container) {
      console.error('Mobile carousel container not found');
      return;
    }

    console.log("Mobile init started");
    
    // Default options with mobile-specific tuning
    this.options = {
      itemSelector: options.itemSelector || '.carousel-item',
      itemSpacing: options.itemSpacing || 20,
      visibleBuffer: options.visibleBuffer || 2,
      frictionFactor: options.frictionFactor || 0.95,
      debugMode: options.debugMode || false
    };

    // Core state variables
    this.items = []; // Original items from DOM
    this.itemCount = 0; // Number of real items
    this.itemWidth = 0; // Width of items
    this.containerWidth = 0; // Viewport width
    this.totalContentWidth = 0; // Width of all items combined

    // Scroll state
    this.offset = 0; // Current scroll offset
    this.velocity = 0; // Current scroll velocity
    this.isScrolling = false; // Whether momentum scrolling is active
    this.isDragging = false; // Whether user is currently dragging

    // Touch state
    this.startX = 0; // Starting X position for drag
    this.startY = 0; // Starting Y position for drag
    this.lastX = 0; // Last X position for velocity calculation
    this.lastY = 0; // Last Y position for drag direction detection
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
    console.log("Mobile detected");
    
    // Ensure container has necessary styling
    this.setupContainerStyles();

    // Get all items and create data
    this.collectItems();

    // Measure items and container
    this.measureDimensions();

    // Position items initially
    this.initialItemPositioning();

    // Setup event listeners
    this.bindEvents();

    // Initial rendering
    this.renderItems();

    // Debug mode
    if (this.options.debugMode) {
      this.setupDebugTools();
    }

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('orientationchange', this.onResize.bind(this));
  }

  /**
   * Set required styles on container
   */
  setupContainerStyles() {
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

    // Mobile-specific track styles
    Object.assign(this.track.style, {
      display: 'flex',
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
      console.warn('No carousel items found for mobile carousel');
      return;
    }

    // Store original items
    this.items = Array.from(itemElements).map((item, index) => {
      // Make sure items have correct base styles
      if (window.getComputedStyle(item).position === 'static') {
        item.style.position = 'absolute';
      }
      
      item.style.top = '0';
      item.style.height = '100%';
      item.dataset.carouselIndex = index.toString();

      // Create item data
      return {
        element: item,
        index: index,
        width: 0, // Will be measured
        left: 0, // Position
        onScreen: false // Whether currently visible
      };
    });
  }

  /**
   * Measure dimensions of container and items
   */
  measureDimensions() {
    // Get container dimensions
    this.containerWidth = this.container.clientWidth;
    
    // Calculate item widths
    const spacing = this.options.itemSpacing;
    let totalWidth = 0;

    this.items.forEach((item, i) => {
      const element = item.element;
      // Reset transforms for accurate measurement
      const prevTransform = element.style.transform;
      element.style.transform = 'none';
      element.style.display = 'block';

      // For mobile, we'll use a consistent width based on viewport
      // This ensures we have a clean scrolling effect
      const imgElement = element.querySelector('img, video');
      if (imgElement) {
        // Get natural image dimensions
        const imgWidth = imgElement.naturalWidth || imgElement.offsetWidth;
        const imgHeight = imgElement.naturalHeight || imgElement.offsetHeight;
        
        // Calculate aspect ratio
        const aspectRatio = imgWidth / imgHeight;
        
        // For mobile, we want to size based on height first (80vh)
        const targetHeight = window.innerHeight * 0.8;
        const calculatedWidth = targetHeight * aspectRatio;
        
        // Set the item width based on image aspect ratio
        item.width = calculatedWidth;
      } else {
        // Fallback width if no image found
        item.width = this.containerWidth * 0.8;
      }

      // Add to total width with spacing
      totalWidth += item.width + (i < this.itemCount - 1 ? spacing : 0);

      // Restore transform
      element.style.transform = prevTransform;
    });

    this.totalContentWidth = totalWidth;

    // Calculate positions based on measurements
    let currentLeft = 0;
    this.items.forEach((item, i) => {
      item.left = currentLeft;
      currentLeft += item.width + spacing;
    });
  }

  /**
   * Set up all event listeners
   */
  bindEvents() {
    // Touch events for mobile with passive: true for touchstart
    this.track.addEventListener('touchstart', this.onDragStart.bind(this), { passive: true });
    window.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onDragEnd.bind(this));
  }

  /**
   * Handle start of touch interaction
   */
  onDragStart(e) {
    // Stop any ongoing animations
    this.stopScrolling();

    this.isDragging = true;
    this.isHorizontalDrag = null; // Reset drag direction detection
    this.track.style.cursor = 'grabbing';

    // Dispatch custom event
    this.container.dispatchEvent(new CustomEvent('carouselInteractionStart'));

    // Get starting position from touch
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.lastX = this.startX;
    this.lastY = this.startY;
    this.dragStartTime = performance.now();

    // Track velocity
    this.velocityTracker = {
      positions: [],
      addPosition(time, position) {
        const recentTime = time - 100;
        while (this.positions.length > 0 && this.positions[0][0] < recentTime) {
          this.positions.shift();
        }
        this.positions.push([time, position]);
      },
      getVelocity() {
        if (this.positions.length < 2) return 0;
        const first = this.positions[0];
        const last = this.positions[this.positions.length - 1];
        const deltaTime = last[0] - first[0];
        if (deltaTime === 0) return 0;
        const deltaPosition = last[1] - first[1];
        return deltaPosition / deltaTime; // pixels per ms
      }
    };

    // Add active class
    this.track.classList.add('dragging');
  }

  /**
   * Handle touch movement
   */
  onDragMove(e) {
    if (!this.isDragging) return;

    // Get current position from touch
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const currentTime = performance.now();

    // Calculate deltas
    const deltaX = currentX - this.lastX;
    const deltaY = currentY - this.lastY;

    // Determine if horizontal or vertical movement on first significant move
    if (this.isHorizontalDrag === null) {
      const absX = Math.abs(currentX - this.startX);
      const absY = Math.abs(currentY - this.startY);

      // Need minimum movement to determine direction
      if (absX > 8 || absY > 8) {
        this.isHorizontalDrag = absX > absY;

        if (this.isHorizontalDrag) {
          this.track.classList.add('horizontal-drag');
        } else {
          this.track.classList.add('vertical-drag');
          
          // If it's a vertical drag, end our handling
          this.isDragging = false;
          this.track.style.cursor = 'grab';
          this.track.classList.remove('dragging');
          return;
        }
      }
    }

    // Only process horizontal drags
    if (this.isHorizontalDrag === true) {
      // For natural drag: dragging left moves content right
      this.offset -= deltaX;

      // Track position for velocity
      this.velocityTracker.addPosition(currentTime, this.offset);

      // Update rendering
      this.renderItems();

      // Prevent default for horizontal drag
      e.preventDefault();
    }

    // Update last position
    this.lastX = currentX;
    this.lastY = currentY;
  }

  /**
   * Handle end of touch interaction
   */
  onDragEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.track.style.cursor = 'grab';

    // Dispatch event
    this.container.dispatchEvent(new CustomEvent('carouselInteractionEnd'));

    // Remove classes
    this.track.classList.remove('dragging', 'horizontal-drag', 'vertical-drag');

    // Only apply momentum if this was a horizontal swipe
    if (this.isHorizontalDrag === true) {
      // Get velocity from tracker
      const velocity = this.velocityTracker.getVelocity();
      
      // Scale velocity
      const momentumMultiplier = 15;
      const cappedVelocity = Math.sign(velocity) * 
                           Math.min(Math.abs(velocity * momentumMultiplier), 15);

      // Apply momentum
      this.startScrollWithVelocity(cappedVelocity);
    }
  }

  /**
   * Handle window resize or orientation change
   */
  onResize() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);

    this.resizeTimer = setTimeout(() => {
      // Get current relative position as percentage
      const relativePosition = this.offset / this.totalContentWidth;

      // Remeasure dimensions
      this.measureDimensions();

      // Maintain relative position
      this.offset = relativePosition * this.totalContentWidth;

      // Update visual position
      this.renderItems();
    }, 250);
  }

  /**
   * Start momentum scrolling with given velocity
   */
  startScrollWithVelocity(initialVelocity) {
    // Set initial velocity (pixels per ms)
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

    // Skip if too much time passed
    if (elapsed > 200) {
      this.isScrolling = false;
      return;
    }

    // Calculate scroll delta
    const delta = this.velocity * elapsed;

    // Update scroll position
    if (Math.abs(delta) > 0.01) {
      this.offset += delta;
      this.renderItems();
    }

    // Apply friction
    this.velocity *= 0.95;

    // Stop scrolling when velocity becomes negligible
    if (Math.abs(this.velocity) < 0.001) {
      this.isScrolling = false;
      this.velocity = 0;
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
   * Position items initially with proper spacing
   */
  initialItemPositioning() {
    // Hide all items first
    this.items.forEach(item => {
      item.element.style.display = 'none';
      item.onScreen = false;
    });

    // Calculate initial offset to center first item
    const containerCenter = this.containerWidth / 2;
    const firstItemCenter = this.items[0].width / 2;
    
    // Center the first item
    this.offset = -containerCenter + firstItemCenter;

    // Render without animation
    this.renderItems(false);
  }

  /**
   * Render all items based on current offset
   */
  renderItems(animate = false) {
    // Normalize the offset within content width for infinite effect
    const normalizedOffset = ((this.offset % this.totalContentWidth) + this.totalContentWidth) % this.totalContentWidth;
    
    // Calculate visible range with buffer
    const buffer = this.containerWidth * 0.5;
    const visibleStart = -buffer;
    const visibleEnd = this.containerWidth + buffer;
    
    // Position each item
    this.items.forEach(item => {
      const element = item.element;
      
      // Calculate position with wrap-around
      let position = item.left - normalizedOffset;
      
      // Apply wrapping for infinite scrolling
      if (position < visibleStart - item.width) {
        position += this.totalContentWidth;
      } else if (position > visibleEnd) {
        position -= this.totalContentWidth;
      }
      
      // Determine if item should be visible
      const isVisible = (
        position < visibleEnd &&
        position + item.width > visibleStart
      );
      
      if (isVisible) {
        if (!item.onScreen) {
          element.style.display = 'block';
          item.onScreen = true;
        }
        
        // Position the item
        element.style.transform = `translateX(${position}px)`;
        element.style.zIndex = '1';
        
        // Set width based on calculated item width
        element.style.width = `${item.width}px`;
        
        // Optimize image display
        const imgElement = element.querySelector('img, video');
        if (imgElement) {
          imgElement.style.height = '80vh';
          imgElement.style.width = 'auto'; 
          imgElement.style.maxWidth = 'none';
          imgElement.style.objectFit = 'contain';
        }
      } else {
        if (item.onScreen) {
          element.style.display = 'none';
          item.onScreen = false;
        }
      }
    });
  }

  /**
   * Setup debugging tools
   */
  setupDebugTools() {
    this.debugDisplay = document.createElement('div');
    this.debugDisplay.className = 'carousel-mobile-debug';
    Object.assign(this.debugDisplay.style, {
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '5px',
      fontSize: '12px',
      zIndex: '100'
    });
    
    this.container.appendChild(this.debugDisplay);
    this.updateDebugInfo();
  }

  /**
   * Update debug information
   */
  updateDebugInfo() {
    if (!this.debugDisplay) return;
    
    this.debugDisplay.innerHTML = `
      Offset: ${Math.round(this.offset)}px<br>
      Velocity: ${this.velocity.toFixed(2)}px/ms<br>
      Visible: ${this.items.filter(i => i.onScreen).length}/${this.itemCount}<br>
      Container: ${this.containerWidth}px
    `;
  }

  /**
   * Destroy the carousel
   */
  destroy() {
    this.stopScrolling();
    
    this.track.removeEventListener('touchstart', this.onDragStart);
    window.removeEventListener('touchmove', this.onDragMove);
    window.removeEventListener('touchend', this.onDragEnd);
    
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    
    if (this.debugDisplay) {
      this.debugDisplay.remove();
    }
    
    // Reset items
    this.items.forEach(item => {
      const element = item.element;
      element.style.transform = '';
      element.style.position = '';
      element.style.display = '';
      element.style.top = '';
      element.style.height = '';
      delete element.dataset.carouselIndex;
    });
    
    // Reset track
    this.track.style = '';
    this.track.classList.remove('dragging', 'horizontal-drag', 'vertical-drag');
  }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Find carousel containers
    const carouselContainers = document.querySelectorAll('.carousel-container');
    
    // Initialize each with mobile carousel
    carouselContainers.forEach(container => {
      container.mobileCarousel = new MobileCarousel(container, {
        itemSelector: '.carousel-item',
        itemSpacing: 20,
        debugMode: false
      });
    });
    
    // Make globally available
    window.MobileCarousel = MobileCarousel;
  }
});
