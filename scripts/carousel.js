
/**
 * TrulyInfiniteCarousel
 * 
 * A carousel that provides:
 * - Truly seamless infinite scrolling with no visible jumps
 * - iOS-like physics and momentum
 * - Drag/swipe with fluid animation and inertia
 * - Responsive design
 */

class TrulyInfiniteCarousel {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    
    // Default options
    this.options = {
      slideSelector: '.carousel-item',
      autoPlay: options.autoPlay !== undefined ? options.autoPlay : false,
      autoPlaySpeed: options.autoPlaySpeed || 3000,
      showArrows: options.showArrows !== undefined ? options.showArrows : true,
      showDots: options.showDots !== undefined ? options.showDots : false,
      loop: true, // Always true for this implementation
      initialSlide: options.initialSlide || 0,
      dragThreshold: options.dragThreshold || 20,
      slideSpacing: options.slideSpacing || 20,
      centerMode: options.centerMode !== undefined ? options.centerMode : true
    };
    
    // Create necessary DOM elements if they don't exist
    this.setupDOM();
    
    // Core state variables
    this.slides = Array.from(this.container.querySelectorAll(this.options.slideSelector));
    this.slideCount = this.slides.length;
    this.currentIndex = this.options.initialSlide;
    this.containerWidth = this.container.offsetWidth;
    this.slideWidth = this.calcSlideWidth();
    
    // Initialize physics variables
    this.position = 0;
    this.targetPosition = 0;
    this.startX = 0;
    this.currentX = 0;
    this.lastX = 0;
    this.velocity = 0;
    this.isDragging = false;
    this.isAnimating = false;
    this.lastMoveTime = 0;
    this.velocityTracker = [];
    this.animationId = null;
    this.direction = 0;
    
    // Clone slides for infinite effect
    this.createVirtualSlides();
    
    // Set initial position
    this.setSlidePositions();
    
    // Bind event handlers
    this.bindEvents();
    
    // Start auto-play if enabled
    if (this.options.autoPlay) {
      this.startAutoPlay();
    }
    
    // Initialize arrows and dots
    if (this.options.showArrows) {
      this.createArrows();
    }
    
    if (this.options.showDots) {
      this.createDots();
    }
    
    // Set initial slide
    this.goToSlide(this.options.initialSlide, false);
  }
  
  setupDOM() {
    // Make sure container has position relative/absolute
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
    
    // Ensure we have a track element
    this.track = this.container.querySelector('.carousel-track');
    if (!this.track) {
      this.track = document.createElement('div');
      this.track.className = 'carousel-track';
      
      // Move all direct children into the track
      while (this.container.firstChild) {
        if (!this.container.firstChild.classList || 
            !this.container.firstChild.classList.contains('carousel-arrow') && 
            !this.container.firstChild.classList.contains('carousel-dots')) {
          this.track.appendChild(this.container.firstChild);
        } else {
          break;
        }
      }
      
      this.container.insertBefore(this.track, this.container.firstChild);
    }
    
    // Set basic styles for track
    Object.assign(this.track.style, {
      display: 'flex',
      flexWrap: 'nowrap',
      transition: 'none',
      willChange: 'transform',
      width: 'max-content'
    });
    
    // Ensure container has proper overflow
    this.container.style.overflow = 'hidden';
  }
  
  createVirtualSlides() {
    // We need at least 3 slides for the infinite effect
    if (this.slideCount < 3) {
      // Create clones to have at least 3 slides
      const clonesToAdd = 3 - this.slideCount;
      for (let i = 0; i < clonesToAdd; i++) {
        const clone = this.slides[i % this.slideCount].cloneNode(true);
        clone.classList.add('carousel-clone');
        this.track.appendChild(clone);
      }
      // Update slides array after adding clones
      this.slides = Array.from(this.container.querySelectorAll(this.options.slideSelector));
      this.slideCount = this.slides.length;
    }
    
    // Create clones for smooth infinite scrolling (add multiple copies)
    const clonesPerSide = Math.ceil(3 * (this.containerWidth / this.calcSlideWidth()));
    
    // Prepend clones (from end of original slides)
    for (let i = 0; i < clonesPerSide; i++) {
      const index = this.slideCount - 1 - (i % this.slideCount);
      const clone = this.slides[index].cloneNode(true);
      clone.classList.add('carousel-clone');
      clone.dataset.cloneIndex = index;
      clone.dataset.position = 'prepend';
      this.track.insertBefore(clone, this.track.firstChild);
    }
    
    // Append clones (from start of original slides)
    for (let i = 0; i < clonesPerSide; i++) {
      const index = i % this.slideCount;
      const clone = this.slides[index].cloneNode(true);
      clone.classList.add('carousel-clone');
      clone.dataset.cloneIndex = index;
      clone.dataset.position = 'append';
      this.track.appendChild(clone);
    }
    
    // Update virtual slides arrays
    this.virtualSlides = Array.from(this.container.querySelectorAll(this.options.slideSelector));
    this.virtualSlideCount = this.virtualSlides.length;
    this.prependCount = clonesPerSide;
    this.appendCount = clonesPerSide;
    
    // Calculate offset for original slides (after prepends)
    this.originalOffset = clonesPerSide;
  }
  
  calcSlideWidth() {
    if (this.slides.length === 0) return this.containerWidth;
    
    // Get the first slide to measure
    const slide = this.slides[0];
    const style = window.getComputedStyle(slide);
    
    // Calculate total width including margins
    const width = slide.offsetWidth +
                  parseFloat(style.marginLeft || 0) +
                  parseFloat(style.marginRight || 0);
    
    return width;
  }
  
  setSlidePositions() {
    // Calculate slide gap
    const slideGap = this.options.slideSpacing;
    
    // Calculate total width of a slide (including gap)
    const totalWidth = this.slideWidth + slideGap;
    
    // Set width and position for all slides
    this.virtualSlides.forEach((slide, index) => {
      // Set slide-specific styles
      slide.style.flexShrink = '0';
      slide.style.marginRight = `${slideGap}px`;
      slide.style.position = 'relative';
      
      // Store position for performance
      slide.dataset.position = index * totalWidth;
    });
    
    // Set track styling for better dragging
    this.track.style.cursor = 'grab';
    
    // Calculate real start position (to center the first original slide)
    if (this.options.centerMode) {
      this.centerOffset = (this.containerWidth - this.slideWidth) / 2;
    } else {
      this.centerOffset = 0;
    }
    
    // Calculate starting position
    this.startPosition = -this.prependCount * totalWidth + this.centerOffset;
    
    // Initialize position
    this.position = this.startPosition;
    this.updateTrackPosition();
  }
  
  updateTrackPosition(animate = false) {
    if (animate) {
      this.track.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    } else {
      this.track.style.transition = 'none';
    }
    
    this.track.style.transform = `translateX(${this.position}px)`;
    
    // Reset transition after animation completes
    if (animate) {
      setTimeout(() => {
        this.track.style.transition = 'none';
      }, 300);
    }
  }
  
  handleInfiniteScrolling() {
    const slideGap = this.options.slideSpacing;
    const totalWidth = this.slideWidth + slideGap;
    
    // Calculate where we are in the virtual carousel
    const normalizedPosition = this.position - this.startPosition;
    const slideMultiplier = Math.round(normalizedPosition / totalWidth);
    const virtualIndex = slideMultiplier % this.slideCount;
    
    // Calculate if we need to jump forward or backward for seamless scrolling
    // When we've scrolled too far in either direction
    
    if (slideMultiplier <= -this.prependCount + 2) {
      // We've scrolled too far backward - jump forward
      const offset = this.slideCount * totalWidth;
      this.position += offset;
      this.updateTrackPosition(false);
    } else if (slideMultiplier >= this.slideCount + 2) {
      // We've scrolled too far forward - jump backward
      const offset = this.slideCount * totalWidth;
      this.position -= offset;
      this.updateTrackPosition(false);
    }
    
    // Calculate the actual index (0 to slideCount-1)
    const wrappedIndex = ((virtualIndex % this.slideCount) + this.slideCount) % this.slideCount;
    
    // Update currentIndex if it changed
    if (wrappedIndex !== this.currentIndex) {
      this.currentIndex = wrappedIndex;
      this.updateActiveDot();
    }
  }
  
  bindEvents() {
    // Mouse events
    this.track.addEventListener('mousedown', this.onDragStart.bind(this));
    window.addEventListener('mousemove', this.onDragMove.bind(this));
    window.addEventListener('mouseup', this.onDragEnd.bind(this));
    
    // Touch events for mobile
    this.track.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onDragEnd.bind(this));
    
    // Prevent context menu on long press
    this.track.addEventListener('contextmenu', e => {
      if (this.isDragging) {
        e.preventDefault();
      }
    });
    
    // Window resize event
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Track transiton end for infinite scroll jumps
    this.track.addEventListener('transitionend', () => {
      this.isAnimating = false;
    });
  }
  
  onDragStart(e) {
    // Don't capture if any animation is in progress
    if (this.isAnimating) return;
    
    // Stop existing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Store initial position for drag calculations
    this.isDragging = true;
    this.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    this.currentX = this.startX;
    this.lastX = this.startX;
    this.lastMoveTime = Date.now();
    this.track.style.transition = 'none';
    this.track.style.cursor = 'grabbing';
    this.velocityTracker = [];
    
    // Stop auto-play during interaction
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    
    // Prevent page scrolling on mobile
    if (e.cancelable) {
      e.preventDefault();
    }
  }
  
  onDragMove(e) {
    if (!this.isDragging) return;
    
    // Update current position
    this.currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    
    // Calculate distance moved
    const deltaX = this.currentX - this.lastX;
    this.lastX = this.currentX;
    
    // Update position
    this.position += deltaX;
    this.updateTrackPosition();
    
    // Track velocity for momentum scrolling
    const now = Date.now();
    const elapsed = now - this.lastMoveTime;
    this.lastMoveTime = now;
    
    if (elapsed > 0) {
      // Calculate velocity (px/ms)
      const velocity = deltaX / elapsed;
      
      // Add to velocity tracker (keeping last 5 samples)
      this.velocityTracker.push(velocity);
      if (this.velocityTracker.length > 5) {
        this.velocityTracker.shift();
      }
    }
    
    // Always prevent page scrolling when dragging
    if (e.cancelable) {
      e.preventDefault();
    }
  }
  
  onDragEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.track.style.cursor = 'grab';
    
    // Calculate final velocity (weighted average of last few samples)
    let finalVelocity = 0;
    if (this.velocityTracker.length > 0) {
      let weight = 0;
      let sum = 0;
      
      // Weight recent velocities more heavily
      for (let i = 0; i < this.velocityTracker.length; i++) {
        const sampleWeight = i + 1;
        sum += this.velocityTracker[i] * sampleWeight;
        weight += sampleWeight;
      }
      
      finalVelocity = sum / weight;
    }
    
    // Apply momentum with deceleration
    if (Math.abs(finalVelocity) > 0.1) {
      this.applyMomentum(finalVelocity);
    } else {
      // No significant momentum, just snap to closest slide
      this.snapToNearestSlide();
    }
    
    // Restart auto-play if enabled
    if (this.options.autoPlay) {
      this.startAutoPlay();
    }
  }
  
  applyMomentum(initialVelocity) {
    // Scale the velocity for better feel
    const scaledVelocity = initialVelocity * 100;
    let velocity = scaledVelocity;
    let lastTimestamp = null;
    let position = this.position;
    
    const animate = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        this.animationId = requestAnimationFrame(animate);
        return;
      }
      
      // Calculate time delta
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Apply friction (deceleration)
      velocity *= Math.pow(0.95, delta / 16); // Normalized for 60fps
      
      // Update position based on velocity
      position += velocity * delta;
      
      // Apply position
      this.position = position;
      this.updateTrackPosition();
      
      // Check for infinite scroll conditions
      this.handleInfiniteScrolling();
      
      // Continue animation until velocity is minimal
      if (Math.abs(velocity) > 0.1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        // When slowed down enough, snap to nearest slide
        this.snapToNearestSlide();
      }
    };
    
    // Start animation
    this.animationId = requestAnimationFrame(animate);
  }
  
  snapToNearestSlide() {
    const slideGap = this.options.slideSpacing;
    const totalWidth = this.slideWidth + slideGap;
    
    // Calculate the offset from startPosition
    const relativeOffset = this.position - this.startPosition;
    
    // Find nearest slide index
    const slideIndex = Math.round(relativeOffset / totalWidth);
    
    // Calculate target position
    const targetPosition = this.startPosition + (slideIndex * totalWidth);
    
    // Animate to target position
    this.animateToPosition(targetPosition, () => {
      // Update current index after snapping
      const normalizedIndex = ((slideIndex % this.slideCount) + this.slideCount) % this.slideCount;
      this.currentIndex = normalizedIndex;
      this.updateActiveDot();
      
      // Handle infinite scrolling after animation completes
      this.handleInfiniteScrolling();
    });
  }
  
  animateToPosition(targetPosition, callback) {
    this.isAnimating = true;
    
    const startPosition = this.position;
    const distance = targetPosition - startPosition;
    const duration = Math.min(500, 100 + Math.abs(distance));
    const startTime = performance.now();
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use cubic ease-out for natural motion
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Calculate new position
      this.position = startPosition + (distance * easeOut);
      this.updateTrackPosition();
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.position = targetPosition; // Ensure we end at exact position
        this.updateTrackPosition();
        this.isAnimating = false;
        this.animationId = null;
        
        if (callback) callback();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  goToSlide(index, animate = true) {
    // Make sure index is within bounds
    index = ((index % this.slideCount) + this.slideCount) % this.slideCount;
    
    // Calculate target position
    const slideGap = this.options.slideSpacing;
    const totalWidth = this.slideWidth + slideGap;
    const targetPosition = this.startPosition + (index * totalWidth);
    
    // Update current index
    this.currentIndex = index;
    this.updateActiveDot();
    
    // Move to position
    if (animate) {
      this.animateToPosition(targetPosition);
    } else {
      this.position = targetPosition;
      this.updateTrackPosition();
      this.handleInfiniteScrolling();
    }
  }
  
  next() {
    this.goToSlide(this.currentIndex + 1);
  }
  
  prev() {
    this.goToSlide(this.currentIndex - 1);
  }
  
  onResize() {
    // Recalculate dimensions
    this.containerWidth = this.container.offsetWidth;
    this.slideWidth = this.calcSlideWidth();
    
    // Update slide positions
    this.setSlidePositions();
    
    // Go to current slide (reposition correctly)
    this.goToSlide(this.currentIndex, false);
  }
  
  createArrows() {
    // Create previous arrow
    this.prevArrow = document.createElement('button');
    this.prevArrow.className = 'carousel-arrow carousel-prev';
    this.prevArrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>';
    this.prevArrow.addEventListener('click', () => this.prev());
    
    // Create next arrow
    this.nextArrow = document.createElement('button');
    this.nextArrow.className = 'carousel-arrow carousel-next';
    this.nextArrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>';
    this.nextArrow.addEventListener('click', () => this.next());
    
    // Add arrows to container
    this.container.appendChild(this.prevArrow);
    this.container.appendChild(this.nextArrow);
  }
  
  createDots() {
    // Create dots container
    this.dotsContainer = document.createElement('div');
    this.dotsContainer.className = 'carousel-dots';
    
    // Create dots for each slide
    for (let i = 0; i < this.slideCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => this.goToSlide(i));
      this.dotsContainer.appendChild(dot);
    }
    
    // Add dots to container
    this.container.appendChild(this.dotsContainer);
    
    // Set initial active dot
    this.updateActiveDot();
  }
  
  updateActiveDot() {
    if (!this.options.showDots || !this.dotsContainer) return;
    
    // Remove active class from all dots
    const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Add active class to current dot
    if (dots[this.currentIndex]) {
      dots[this.currentIndex].classList.add('active');
    }
  }
  
  startAutoPlay() {
    // Clear any existing interval
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    
    // Set up new interval
    this.autoPlayInterval = setInterval(() => {
      this.next();
    }, this.options.autoPlaySpeed);
  }
  
  destroy() {
    // Clean up all event listeners
    this.track.removeEventListener('mousedown', this.onDragStart);
    window.removeEventListener('mousemove', this.onDragMove);
    window.removeEventListener('mouseup', this.onDragEnd);
    
    this.track.removeEventListener('touchstart', this.onDragStart);
    window.removeEventListener('touchmove', this.onDragMove);
    window.removeEventListener('touchend', this.onDragEnd);
    
    window.removeEventListener('resize', this.onResize);
    
    // Stop any ongoing animations
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Stop auto-play
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    
    // Remove all cloned slides
    const clones = this.track.querySelectorAll('.carousel-clone');
    clones.forEach(clone => clone.remove());
    
    // Remove navigation elements
    if (this.prevArrow) this.prevArrow.remove();
    if (this.nextArrow) this.nextArrow.remove();
    if (this.dotsContainer) this.dotsContainer.remove();
    
    // Reset track styles
    this.track.style = '';
  }
}

// Initialize carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Find all carousel containers
  const carouselContainers = document.querySelectorAll('.carousel-container');
  
  // Initialize each carousel
  carouselContainers.forEach(container => {
    // Store the carousel instance in a data attribute for future reference
    container.carousel = new TrulyInfiniteCarousel(container, {
      slideSelector: '.carousel-item',
      autoPlay: false,
      showArrows: false,
      showDots: false,
      slideSpacing: 20,
      centerMode: true
    });
  });
  
  // Expose carousel class globally for manual initialization
  window.TrulyInfiniteCarousel = TrulyInfiniteCarousel;
});
