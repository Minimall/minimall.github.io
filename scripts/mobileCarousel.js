
/**
 * MobileCarousel
 * 
 * A high-performance carousel implementation specifically optimized for mobile devices:
 * - Creates infinite scrolling for touch devices
 * - Uses physics-based momentum scrolling with iOS-like behavior
 * - Optimizes rendering and touch response
 * - Prevents overlapping images and positioning issues
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
    
    // Ensure we're on a mobile device
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!this.isMobile) {
      console.log("Non-mobile device detected, but using mobile carousel anyway");
    } else {
      console.log("Mobile detected");
    }
    
    // Default options
    this.options = {
      itemSelector: options.itemSelector || '.carousel-item',
      itemSpacing: options.itemSpacing || 20, // Spacing between items
      visibleBuffer: options.visibleBuffer || 3, // Extra items to render beyond viewport
      frictionFactor: options.frictionFactor || 0.92, // Lower friction feels more like iOS
      snapToItems: options.snapToItems !== false, // Whether to snap to items after scrolling
      debugMode: options.debugMode || false // Enable visual debugging
    };

    // Core state variables
    this.items = []; // Original items from DOM
    this.virtualItems = []; // Virtual representation of items for rendering
    this.itemCount = 0; // Number of real items
    this.containerWidth = 0; // Viewport width
    this.totalContentWidth = 0; // Width of all items combined

    // Scroll state
    this.offset = 0; // Current scroll offset
    this.velocity = 0; // Current scroll velocity
    this.isScrolling = false; // Whether momentum scrolling is active
    this.isDragging = false; // Whether user is currently dragging
    this.isAutoScrolling = false; // Whether auto-scrolling is active

    // Touch state
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
    
    // Track the device orientation for responsive adjustments
    this.lastOrientation = window.orientation || window.screen.orientation.angle;
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
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

    // Log initialization
    console.log('MobileCarousel initialized', {
      itemCount: this.itemCount,
      totalContentWidth: this.totalContentWidth,
      containerWidth: this.containerWidth
    });
  }

  /**
   * Handle orientation changes
   */
  handleOrientationChange() {
    // Delay measurement to ensure the browser has updated dimensions
    setTimeout(() => {
      // Check if orientation has actually changed
      const currentOrientation = window.orientation || window.screen.orientation.angle;
      if (currentOrientation !== this.lastOrientation) {
        this.lastOrientation = currentOrientation;
        
        // Re-measure and re-render
        this.measureDimensions();
        this.renderItems();
      }
    }, 300); // Wait for browser to complete orientation change
  }

  /**
   * Set required styles on container
   */
  setupContainerStyles() {
    // Get computed styles
    const containerStyle = window.getComputedStyle(this.container);

    // Set container styles if not already set
    if (containerStyle.position === 'static') {
      this.container.style.position = 'relative';
    }
    
    if (containerStyle.overflow !== 'hidden') {
      this.container.style.overflow = 'hidden';
    }

    // Add mobile-specific container styles
    Object.assign(this.container.style, {
      overscrollBehavior: 'none', // Prevent browser bounce/refresh on pull
      WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal
      userSelect: 'none', // Prevent text selection during swipes
      width: '100%', // Use full width
      maxWidth: '100vw', // Prevent overflow
      margin: '0', // Remove margins
      padding: '0' // Remove padding
    });

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

    // Ensure track has the right styles for mobile
    Object.assign(this.track.style, {
      display: 'flex',
      flexWrap: 'nowrap',
      position: 'relative',
      height: '100%',
      width: '100%',
      willChange: 'transform', // Optimize performance
      transform: 'translateZ(0)', // Force GPU acceleration
      touchAction: 'pan-y', // Allow vertical scrolling
      userSelect: 'none',
      webkitUserSelect: 'none',
      cursor: 'grab',
      marginLeft: '0', // Ensure no extra margins
      padding: '0', // Ensure no padding
      overflow: 'visible' // Important for proper item positioning
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

    // Initialize with basic data
    this.items.forEach((item, index) => {
      // Make sure items have correct base styles
      Object.assign(item.style, {
        position: 'absolute',
        top: '0',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        willChange: 'transform', // Optimize for performance
        transform: 'translateZ(0)', // Force GPU acceleration
        WebkitTransform: 'translateZ(0)', // For older iOS Safari
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transition: 'none', // No transitions for smoother performance
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none' // We handle touch directly
      });

      // Store original index on element
      item.dataset.carouselIndex = index.toString();

      // Find image or video within the item
      const media = item.querySelector('img, video');
      if (media) {
        // Optimize media element styles for mobile
        Object.assign(media.style, {
          height: '80vh', // Control height
          width: 'auto', // Width adjusts based on aspect ratio
          maxWidth: '85vw', // Prevent overflow
          objectFit: 'contain', // Maintain aspect ratio
          pointerEvents: 'none', // Prevent unwanted touch events on images
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none', // Prevent image context menu
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transform: 'translateZ(0)', // Force GPU acceleration
          WebkitTransform: 'translateZ(0)',
          margin: '0', // Remove margins
          padding: '0' // Remove padding
        });
      }

      // Create virtual item representation
      this.virtualItems.push({
        element: item,
        index: index,
        width: 0, // Will be measured
        left: 0, // Virtual position
        x: 0, // Actual rendered position
        onScreen: false // Whether currently visible
      });
    });
  }

  /**
   * Measure dimensions of container and items
   */
  measureDimensions() {
    // Get container dimensions
    this.containerWidth = this.container.clientWidth;

    // Temporarily make all items visible for measurement
    this.items.forEach(item => {
      item.style.opacity = '1';
      item.style.display = 'flex';
      // Reset any transforms that might affect measurement
      item.style.transform = 'none';
    });

    // Calculate item widths and total content width
    let totalWidth = 0;
    const spacing = this.options.itemSpacing;

    this.virtualItems.forEach((item, i) => {
      const element = item.element;
      
      // Find the image/video inside the item
      const media = element.querySelector('img, video');
      
      // Measure the media dimensions while preserving aspect ratio
      if (media) {
        // If it's an image, we need to calculate its display width
        // based on the desired height and natural aspect ratio
        if (media.tagName === 'IMG') {
          // Use 80vh height and preserve aspect ratio
          const heightInPx = window.innerHeight * 0.8;
          
          // If image is loaded, use its natural aspect ratio
          if (media.complete && media.naturalWidth > 0 && media.naturalHeight > 0) {
            const aspectRatio = media.naturalWidth / media.naturalHeight;
            const computedWidth = heightInPx * aspectRatio;
            
            // Limit width to avoid overflow
            const maxWidth = window.innerWidth * 0.85;
            const width = Math.min(computedWidth, maxWidth);
            
            item.width = width;
          } else {
            // If image isn't loaded yet, use a default width
            item.width = window.innerWidth * 0.85;
            
            // Add a load event to measure accurately later
            media.addEventListener('load', () => {
              const aspectRatio = media.naturalWidth / media.naturalHeight;
              const heightInPx = window.innerHeight * 0.8;
              const computedWidth = heightInPx * aspectRatio;
              const maxWidth = window.innerWidth * 0.85;
              item.width = Math.min(computedWidth, maxWidth);
              
              // Update positions after image load
              this.updateItemPositions();
              this.renderItems();
            }, { once: true });
          }
        } else {
          // For videos, use similar approach
          item.width = window.innerWidth * 0.85;
        }
      } else {
        // If no media, use the measured element width
        item.width = element.offsetWidth;
      }

      // Add to total width (including spacing between items)
      totalWidth += item.width + (i < this.itemCount - 1 ? spacing : 0);
    });

    this.totalContentWidth = totalWidth;

    // Update virtual item positions based on measurements
    this.updateItemPositions();
    
    // Reset item display if they shouldn't be visible yet
    this.items.forEach(item => {
      item.style.opacity = '0';
      item.style.display = 'none';
    });

    // Log dimensions
    if (this.options.debugMode) {
      console.log('Mobile carousel dimensions:', {
        containerWidth: this.containerWidth,
        totalContentWidth: this.totalContentWidth,
        itemWidths: this.virtualItems.map(item => item.width)
      });
    }
  }

  /**
   * Update positions of all virtual items
   */
  updateItemPositions() {
    // Calculate positions based on item widths and spacing
    let currentLeft = 0;
    const spacing = this.options.itemSpacing;
    
    this.virtualItems.forEach((item, i) => {
      item.left = currentLeft;
      currentLeft += item.width + spacing;
    });
  }

  /**
   * Set up all event listeners for the carousel
   */
  bindEvents() {
    // Touch events for mobile - use passive: true for touchstart/move
    this.track.addEventListener('touchstart', this.onDragStart.bind(this), { passive: true });
    window.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onDragEnd.bind(this));
    window.addEventListener('touchcancel', this.onDragEnd.bind(this));

    // Additional event listeners for handling scroll interruptions
    document.addEventListener('scroll', this.onPageScroll.bind(this), { passive: true });
    
    // Custom event listeners for auto-scroll feature
    this.container.addEventListener('carouselInteractionStart', () => {
      this.stopAutoScrolling();
    });
    
    this.container.addEventListener('carouselInteractionEnd', () => {
      // Resume auto-scrolling after a delay
      setTimeout(() => {
        this.startAutoScrolling();
      }, 1000);
    });
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopScrolling();
      } else {
        this.startAutoScrolling();
      }
    });
    
    // Resize handling
    window.addEventListener('resize', this.onResize.bind(this));
  }

  /**
   * Handle window resize
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
    }, 250);
  }

  /**
   * Handle page scroll event - pause auto-scrolling during page scroll
   */
  onPageScroll() {
    // If user is scrolling the page, temporarily pause auto-scrolling
    if (this.isAutoScrolling) {
      this.stopAutoScrolling();
      
      // Resume after a delay if the user stops scrolling
      clearTimeout(this.scrollPauseTimer);
      this.scrollPauseTimer = setTimeout(() => {
        this.startAutoScrolling();
      }, 1000);
    }
  }

  /**
   * Handle start of touch interaction
   */
  onDragStart(e) {
    // Stop any ongoing animations
    this.stopScrolling();
    this.stopAutoScrolling();

    this.isDragging = true;
    this.isHorizontalDrag = null; // Reset drag direction detection
    
    // Dispatch custom event for integration with auto-scroll
    this.container.dispatchEvent(new CustomEvent('carouselInteractionStart'));

    // Get starting position from touch
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.lastX = this.startX;
    this.lastY = this.startY;
    this.dragStartTime = performance.now();
    this.dragDistance = 0;

    // Track drag velocity for momentum scrolling
    this.velocityTracker = {
      positions: [], // Array of [timestamp, position] entries
      addPosition(time, position) {
        // Keep only recent positions (last 100ms)
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

    // Add active class for styling
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

    // Track total distance moved (for swipe detection)
    this.dragDistance += Math.abs(deltaX);

    // Determine if horizontal or vertical movement on first significant move
    if (this.isHorizontalDrag === null) {
      const absX = Math.abs(currentX - this.startX);
      const absY = Math.abs(currentY - this.startY);

      // Need minimum movement to determine direction
      if (absX > 8 || absY > 8) {
        this.isHorizontalDrag = absX > absY;

        if (this.isHorizontalDrag) {
          this.track.classList.add('horizontal-drag');
          
          // Prevent default to avoid page scrolling during horizontal drag
          e.preventDefault();
        } else {
          this.track.classList.add('vertical-drag');
          
          // If it's a vertical drag, we should end our handling and let the page scroll
          this.isDragging = false;
          this.track.classList.remove('dragging');
          return;
        }
      }
    }

    // Only process horizontal drags
    if (this.isHorizontalDrag === true) {
      // For natural drag movement:
      // When dragging left, content should move right (negative deltaX)
      // When dragging right, content should move left (positive deltaX)
      this.offset -= deltaX;

      // Track position for velocity calculation
      this.velocityTracker.addPosition(currentTime, this.offset);

      // Update rendering
      this.renderItems();

      // Prevent default to avoid page scrolling during horizontal drag
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

    // Dispatch custom event for integration with auto-scroll
    this.container.dispatchEvent(new CustomEvent('carouselInteractionEnd'));

    // Calculate drag duration and distance
    const dragDuration = performance.now() - this.dragStartTime;

    // Determine if this was a swipe (fast, purposeful movement)
    const isSwipe = (dragDuration < 300 && this.dragDistance > 30) || 
                    (this.velocityTracker.getVelocity() > 0.5);

    // Remove classes
    this.track.classList.remove('dragging', 'horizontal-drag', 'vertical-drag');

    // Only apply momentum if this was a horizontal swipe
    if (this.isHorizontalDrag === true && isSwipe) {
      // Get velocity from tracker for momentum
      const velocity = this.velocityTracker.getVelocity();

      // Scale velocity for good feel
      const momentumMultiplier = 20; // Higher for more pronounced momentum
      const cappedVelocity = Math.sign(velocity) * 
                           Math.min(Math.abs(velocity * momentumMultiplier), 20);

      // Apply momentum
      this.startScrollWithVelocity(cappedVelocity);
    } else if (this.options.snapToItems) {
      // If not a swipe, snap to nearest item
      this.snapToNearestItem();
    }
  }

  /**
   * Snap to the nearest item
   */
  snapToNearestItem() {
    // Find the nearest item
    const normalizedOffset = this.moduloWithNegative(this.offset, this.totalContentWidth);
    
    let closestItem = null;
    let minDistance = Infinity;
    
    this.virtualItems.forEach(item => {
      // Calculate distance from item to container center
      const itemCenter = item.left + (item.width / 2);
      const containerCenter = normalizedOffset + (this.containerWidth / 2);
      const distance = Math.abs(itemCenter - containerCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
      }
    });
    
    if (closestItem) {
      // Calculate target offset to center the item
      const targetCenter = closestItem.left + (closestItem.width / 2);
      const targetOffset = targetCenter - (this.containerWidth / 2);
      
      // Determine the shortest path (considering the carousel is circular)
      let deltaOffset = targetOffset - normalizedOffset;
      
      // Consider wrapping for shorter distance
      if (Math.abs(deltaOffset) > this.totalContentWidth / 2) {
        deltaOffset = deltaOffset > 0 
          ? deltaOffset - this.totalContentWidth 
          : deltaOffset + this.totalContentWidth;
      }
      
      // Apply the change with animation
      this.offset += deltaOffset;
      
      // Use a small velocity to create a gentle snap animation
      const snapVelocity = deltaOffset * 0.05;
      this.startScrollWithVelocity(snapVelocity);
    }
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

    // Skip if too much time passed (tab was inactive)
    if (elapsed > 100) {
      this.isScrolling = false;
      return;
    }

    // Apply a deceleration that feels iOS-like
    const frictionFactor = 0.95; // Adjusted for mobile feel (higher = less friction)

    // Calculate scroll delta using current velocity
    const delta = this.velocity * elapsed;

    // Update scroll position
    if (Math.abs(delta) > 0.05) {
      this.offset += delta;
      this.renderItems();
    }

    // Apply friction to velocity
    this.velocity *= frictionFactor;

    // Stop scrolling when velocity becomes negligible
    if (Math.abs(this.velocity) < 0.001) {
      this.isScrolling = false;
      this.velocity = 0;
      
      // When momentum stops, snap to nearest item if enabled
      if (this.options.snapToItems) {
        this.snapToNearestItem();
      } else {
        // Resume auto-scrolling after momentum ends
        this.startAutoScrolling();
      }
    } else {
      // Continue animation
      this.scrollAnimationId = requestAnimationFrame(this.updateScroll.bind(this));
    }
  }

  /**
   * Start auto-scrolling
   */
  startAutoScrolling() {
    // Only start if not already scrolling and not being dragged
    if (!this.isAutoScrolling && !this.isDragging && !this.isScrolling) {
      this.isAutoScrolling = true;
      this.lastAutoScrollTime = performance.now();
      this.autoScrollAnimationId = requestAnimationFrame(this.updateAutoScroll.bind(this));
    }
  }

  /**
   * Update auto-scrolling animation
   */
  updateAutoScroll(timestamp) {
    if (!this.isAutoScrolling) return;
    
    // Calculate time since last frame
    const elapsed = timestamp - (this.lastAutoScrollTime || timestamp);
    this.lastAutoScrollTime = timestamp;
    
    // Skip if too much time passed
    if (elapsed > 100) {
      this.autoScrollAnimationId = requestAnimationFrame(this.updateAutoScroll.bind(this));
      return;
    }
    
    // Slow, steady scrolling speed
    const scrollSpeed = 0.03; // px per ms
    
    // Update offset
    this.offset += scrollSpeed * elapsed;
    
    // Render the new positions
    this.renderItems();
    
    // Continue animation
    this.autoScrollAnimationId = requestAnimationFrame(this.updateAutoScroll.bind(this));
  }

  /**
   * Stop auto-scrolling
   */
  stopAutoScrolling() {
    if (this.autoScrollAnimationId) {
      cancelAnimationFrame(this.autoScrollAnimationId);
      this.autoScrollAnimationId = null;
    }
    this.isAutoScrolling = false;
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
    
    // Also stop auto-scrolling
    this.stopAutoScrolling();
  }

  /**
   * Position items initially with proper spacing
   */
  initialItemPositioning() {
    // Hide all items first to prevent stacking during initialization
    this.virtualItems.forEach(item => {
      item.element.style.display = 'none';
      item.onScreen = false;
    });

    // Calculate initial offset to center first item in the viewport
    const containerCenter = this.containerWidth / 2;
    const firstItemCenter = this.virtualItems[0].width / 2;
    this.offset = containerCenter - firstItemCenter;

    // Immediately render items in their correct positions
    this.renderItems(false);
    
    // Start auto-scrolling
    this.startAutoScrolling();
  }

  /**
   * Render all items based on current offset
   */
  renderItems() {
    // Normalize the offset within the content width
    const normalizedOffset = this.moduloWithNegative(this.offset, this.totalContentWidth);

    // Calculate which items should be visible with a buffer
    const visibilityBuffer = this.containerWidth * 0.5;
    const visibleStart = -visibilityBuffer;
    const visibleEnd = this.containerWidth + visibilityBuffer;

    // Position each item
    this.virtualItems.forEach(item => {
      const element = item.element;
      
      // Calculate item's position with normalization for infinite carousel
      let itemOffset = item.left - normalizedOffset;
      
      // Apply wrapping for seamless infinite scrolling
      if (itemOffset > visibleEnd + item.width) {
        // When an item goes too far right, wrap it to the left
        itemOffset -= this.totalContentWidth;
      } else if (itemOffset + item.width < visibleStart) {
        // When an item goes too far left, wrap it to the right
        itemOffset += this.totalContentWidth;
      }
      
      // Determine if the item should be visible
      const isVisible = (
        itemOffset < visibleEnd &&
        itemOffset + item.width > visibleStart
      );

      // Show/hide based on visibility
      if (isVisible) {
        if (!item.onScreen) {
          // Show the element
          element.style.display = 'flex';
          element.style.opacity = '1';
          item.onScreen = true;
        }

        // Use transform for positioning (no transitions for smoothness)
        element.style.transform = `translateX(${itemOffset}px) translateZ(0)`;
        element.style.WebkitTransform = `translateX(${itemOffset}px) translateZ(0)`;
        
        // Store the current position
        item.x = itemOffset;
        
        // For iOS Safari, ensure proper z-index
        const distanceFromCenter = Math.abs(itemOffset + (item.width/2) - (this.containerWidth/2));
        element.style.zIndex = Math.round(1000 - distanceFromCenter);

        // Ensure container width matches the image width
        const mediaElement = element.querySelector('img, video');
        if (mediaElement) {
          // Make sure image fills container properly
          mediaElement.style.maxHeight = '80vh';
          mediaElement.style.height = '80vh';
          mediaElement.style.width = 'auto';
          mediaElement.style.maxWidth = '85vw';
          
          // For iOS Safari, ensure proper object fit
          mediaElement.style.objectFit = 'contain';
          
          // Set container width to match image
          element.style.width = `${item.width}px`;
        }
      } else if (item.onScreen) {
        // Hide items that are not visible
        element.style.display = 'none';
        item.onScreen = false;
      }
    });

    // Update debug display if enabled
    if (this.options.debugMode && this.debugDisplay) {
      this.updateDebugInfo();
    }
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
      zIndex: '2000',
      borderRadius: '4px',
      maxWidth: '300px',
      pointerEvents: 'none'
    });

    this.container.appendChild(this.debugDisplay);
    this.updateDebugInfo();
  }

  /**
   * Update debug information
   */
  updateDebugInfo() {
    if (!this.debugDisplay) return;

    const normalizedOffset = this.moduloWithNegative(this.offset, this.totalContentWidth);

    this.debugDisplay.innerHTML = `
      Mobile Carousel<br>
      Offset: ${Math.round(this.offset)}px<br>
      Normalized: ${Math.round(normalizedOffset)}px<br>
      Velocity: ${this.velocity.toFixed(2)}px/ms<br>
      Visible: ${this.virtualItems.filter(i => i.onScreen).length}/${this.itemCount}<br>
      Container: ${this.containerWidth}px<br>
      Content: ${Math.round(this.totalContentWidth)}px<br>
      Auto-scroll: ${this.isAutoScrolling ? 'on' : 'off'}<br>
      Dragging: ${this.isDragging ? 'yes' : 'no'}
    `;
  }

  /**
   * Destroy the carousel instance and clean up
   */
  destroy() {
    // Stop any animations
    this.stopScrolling();
    this.stopAutoScrolling();

    // Remove event listeners
    this.track.removeEventListener('touchstart', this.onDragStart);
    window.removeEventListener('touchmove', this.onDragMove);
    window.removeEventListener('touchend', this.onDragEnd);
    window.removeEventListener('touchcancel', this.onDragEnd);
    document.removeEventListener('scroll', this.onPageScroll);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);

    // Remove debug elements if they exist
    if (this.debugDisplay) {
      this.debugDisplay.remove();
    }

    // Reset item styles
    this.virtualItems.forEach(item => {
      const element = item.element;
      element.style.transform = '';
      element.style.position = '';
      element.style.display = '';
      element.style.top = '';
      element.style.height = '';
      element.style.width = '';
      
      // Reset media elements
      const media = element.querySelector('img, video');
      if (media) {
        media.style = '';
      }

      // Remove data attributes
      delete element.dataset.carouselIndex;
    });

    // Reset track styles
    this.track.style = '';
    this.track.classList.remove('dragging', 'horizontal-drag', 'vertical-drag');

    console.log('Mobile carousel destroyed');
  }
}

// Initialize mobile carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Find all carousel containers
    const carouselContainers = document.querySelectorAll('.carousel-container');
    
    // Function to initialize carousels with proper timing
    const initializeCarousels = () => {
      carouselContainers.forEach(container => {
        // Create and store the carousel instance
        const carousel = new MobileCarousel(container, {
          itemSelector: '.carousel-item',
          itemSpacing: 20,
          visibleBuffer: 4,
          snapToItems: true,
          debugMode: false
        });

        // Store the instance on the container for external access
        container.carousel = carousel;
      });

      // Make the carousel class globally available
      window.MobileCarousel = MobileCarousel;
    };

    // Preload images for accurate sizing
    const preloadImages = () => {
      const allImages = document.querySelectorAll('.carousel-item img');
      let loadedCount = 0;

      // If no images, initialize immediately
      if (allImages.length === 0) {
        initializeCarousels();
        return;
      }

      // Load each image and track progress
      allImages.forEach(img => {
        // If image is already loaded or has no src
        if (img.complete || !img.src) {
          loadedCount++;
          if (loadedCount === allImages.length) {
            initializeCarousels();
          }
        } else {
          // Add load event listener
          img.addEventListener('load', () => {
            loadedCount++;
            if (loadedCount === allImages.length) {
              initializeCarousels();
            }
          });

          // Handle error case
          img.addEventListener('error', () => {
            loadedCount++;
            if (loadedCount === allImages.length) {
              initializeCarousels();
            }
          });
        }
      });

      // Shorter fallback timeout on mobile
      setTimeout(initializeCarousels, 300);
    };

    // Start preloading if document is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      preloadImages();
    } else {
      // Wait for initial DOM ready before starting image preload
      document.addEventListener('DOMContentLoaded', preloadImages);
    }
  }
});
