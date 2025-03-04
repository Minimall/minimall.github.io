
/**
 * InfiniteImageCarousel
 * 
 * Features:
 * - Truly infinite image scrolling with no visible "end"
 * - iOS-style physics with momentum scrolling
 * - Dynamic image preloading for seamless experience
 * - Touch and mouse gesture support
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize carousel with a slight delay to ensure DOM is fully rendered
  setTimeout(() => {
    const gridItems = document.querySelectorAll('.grid-item');
    if (gridItems.length > 0) {
      console.log("Grid items found:", gridItems.length);
      initializeCarousel(gridItems);
    } else {
      console.log("No grid items found");
    }
  }, 300);
});

function initializeCarousel(gridItems) {
  const carousel = new InfiniteCarousel(gridItems);
  
  // Store the carousel instance in window for future reference
  window.currentCarouselInstance = carousel;
  
  // Add click handlers to grid items
  gridItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      carousel.open(index);
    });
    item.style.cursor = 'pointer';
  });
}

class InfiniteCarousel {
  constructor(gridItems) {
    this.gridItems = Array.from(gridItems);
    this.totalItems = this.gridItems.length;
    this.currentIndex = 0;
    this.isOpen = false;
    
    // Physics parameters - calibrated for iOS-like feel
    this.velocity = 0;
    this.position = 0;
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastTimestamp = 0;
    this.isDragging = false;
    this.isScrolling = false;
    this.scrollDirection = null;
    this.friction = 0.95; // Higher value = less friction
    this.springConstant = 0.08; // For elastic bounce (lower = more elasticity)
    this.animationId = null;
    this.visibleSlides = new Set();
    this.clonedIndices = new Map(); // Track cloned slides for infinite effect
    
    // Create DOM elements
    this.createCarouselElements();
    this.setupEventListeners();
  }
  
  createCarouselElements() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'carousel-overlay';
    
    // Create carousel container
    this.container = document.createElement('div');
    this.container.className = 'carousel-container';
    
    // Create track container for horizontal scrolling
    this.track = document.createElement('div');
    this.track.className = 'carousel-track-container';
    
    // Create navigation arrows with iOS-style design
    this.prevArrow = document.createElement('button');
    this.prevArrow.className = 'carousel-nav prev';
    this.prevArrow.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M19 12H5"></path>
        <path d="M12 19l-7-7 7-7"></path>
      </svg>
    `;
    
    this.nextArrow = document.createElement('button');
    this.nextArrow.className = 'carousel-nav next';
    this.nextArrow.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M5 12h14"></path>
        <path d="M12 5l7 7-7 7"></path>
      </svg>
    `;
    
    // Create dots indicator container
    this.dotsContainer = document.createElement('div');
    this.dotsContainer.className = 'carousel-dots';
    
    // Assemble the carousel
    this.container.appendChild(this.track);
    this.container.appendChild(this.prevArrow);
    this.container.appendChild(this.nextArrow);
    this.container.appendChild(this.dotsContainer);
    this.overlay.appendChild(this.container);
    
    // Add to document
    document.body.appendChild(this.overlay);
  }
  
  setupEventListeners() {
    // Navigation buttons
    this.prevArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigateTo(this.currentIndex - 1, true);
    });
    
    this.nextArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigateTo(this.currentIndex + 1, true);
    });
    
    // Close on overlay click (if not dragging)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay && !this.isDragging) {
        this.close();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.navigateTo(this.currentIndex - 1, true);
          break;
        case 'ArrowRight':
          this.navigateTo(this.currentIndex + 1, true);
          break;
      }
    });
    
    // Touch and mouse events
    this.setupDragEvents();
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle visibility change to pause/resume auto-loading
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAutoLoading();
      } else if (this.isOpen) {
        this.resumeAutoLoading();
      }
    });
  }
  
  setupDragEvents() {
    // Handle touch events
    this.track.addEventListener('mousedown', this.handleDragStart.bind(this));
    this.track.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: false });
    
    window.addEventListener('mousemove', this.handleDragMove.bind(this));
    window.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
    
    window.addEventListener('mouseup', this.handleDragEnd.bind(this));
    window.addEventListener('touchend', this.handleDragEnd.bind(this));
    
    // Prevent context menu on long press
    this.track.addEventListener('contextmenu', (e) => {
      if (this.isDragging) {
        e.preventDefault();
      }
    });
  }
  
  handleDragStart(e) {
    if (!this.isOpen) return;
    
    this.isDragging = true;
    this.track.classList.add('dragging');
    this.velocity = 0;
    
    // Cancel any ongoing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Get starting position and time
    const point = e.touches ? e.touches[0] : e;
    this.startX = point.clientX;
    this.startY = point.clientY;
    this.lastX = this.startX;
    this.lastTimestamp = Date.now();
    this.scrollDirection = null;
    this.isScrolling = false;
    
    // Track velocity data
    this.velocityHistory = [];
    
    // Improve visual feedback
    this.track.style.cursor = 'grabbing';
    
    e.preventDefault();
  }
  
  handleDragMove(e) {
    if (!this.isDragging || !this.isOpen) return;
    
    const point = e.touches ? e.touches[0] : e;
    const currentX = point.clientX;
    const currentY = point.clientY;
    const timestamp = Date.now();
    
    // Determine scroll direction on first move
    if (this.scrollDirection === null) {
      const deltaX = Math.abs(currentX - this.startX);
      const deltaY = Math.abs(currentY - this.startY);
      
      // Set a threshold to determine the intended direction
      if (deltaY > deltaX && deltaY > 10) {
        this.isDragging = false;
        this.isScrolling = true;
        this.track.classList.remove('dragging');
        return;
      }
      
      if (deltaX > 10) {
        this.scrollDirection = 'horizontal';
        e.preventDefault();
      }
    }
    
    // Only process horizontal movements
    if (this.scrollDirection === 'horizontal') {
      // Calculate drag distance and time
      const deltaX = currentX - this.lastX;
      const deltaTime = timestamp - this.lastTimestamp;
      
      if (deltaTime > 0) {
        // Record velocity samples for more accurate physics
        this.velocityHistory.push({
          velocity: deltaX / deltaTime,
          timestamp: timestamp
        });
        
        // Keep only recent samples for velocity calculation
        if (this.velocityHistory.length > 5) {
          this.velocityHistory.shift();
        }
      }
      
      // Apply movement with edge resistance
      this.position += deltaX;
      this.updateTrackPosition();
      
      this.lastX = currentX;
      this.lastTimestamp = timestamp;
      
      // Ensure we're loading the right slides as we drag
      this.ensureProperSlides();
      
      e.preventDefault();
    }
  }
  
  handleDragEnd() {
    if (!this.isDragging || !this.isOpen) return;
    
    this.isDragging = false;
    this.track.classList.remove('dragging');
    this.track.style.cursor = 'grab';
    
    // Calculate final velocity based on recent movement history
    if (this.velocityHistory.length > 0) {
      // Weight recent movements more heavily
      let totalWeight = 0;
      let weightedVelocity = 0;
      
      // Use weighted average of last few velocity samples
      for (let i = 0; i < this.velocityHistory.length; i++) {
        const weight = i + 1;
        weightedVelocity += this.velocityHistory[i].velocity * weight;
        totalWeight += weight;
      }
      
      this.velocity = (weightedVelocity / totalWeight) * 20; // Amplify for better feel
    } else {
      this.velocity = 0;
    }
    
    // Start deceleration animation
    this.startDecelerationAnimation();
  }
  
  startDecelerationAnimation() {
    const slideWidth = this.getSlideWidth();
    let lastTimestamp = null;
    
    const animate = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        this.animationId = requestAnimationFrame(animate);
        return;
      }
      
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Apply friction to velocity (time-based)
      const timeScale = elapsed / 16.6667; // Normalize for 60fps
      this.velocity *= Math.pow(this.friction, timeScale);
      
      // Apply velocity to position
      this.position += this.velocity * timeScale;
      
      // Calculate virtual position for snapping
      const virtualPosition = this.position % (this.totalItems * slideWidth);
      const normalizedPosition = -virtualPosition / slideWidth;
      
      // Handle extremely slow velocity - snap to nearest slide
      if (Math.abs(this.velocity) < 0.5) {
        const nearestIndex = Math.round(-this.position / slideWidth) % this.totalItems;
        const actualIndex = (nearestIndex + this.totalItems) % this.totalItems;
        
        this.navigateTo(actualIndex, true);
        return;
      }
      
      // Update visual position
      this.updateTrackPosition();
      
      // Ensure we're loading the right slides during deceleration
      this.ensureProperSlides();
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    // Start the animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animationId = requestAnimationFrame(animate);
  }
  
  navigateTo(targetIndex, animate = false) {
    // Wrap around for infinite scrolling
    targetIndex = ((targetIndex % this.totalItems) + this.totalItems) % this.totalItems;
    
    const slideWidth = this.getSlideWidth();
    const targetPosition = -targetIndex * slideWidth;
    
    // Determine shortest path (wrapping around if needed)
    let currentVirtualIndex = Math.round(-this.position / slideWidth);
    let shortestPathTarget = targetIndex;
    
    // Calculate if wrapping around is shorter
    if (Math.abs(currentVirtualIndex - targetIndex) > this.totalItems / 2) {
      if (currentVirtualIndex > targetIndex) {
        shortestPathTarget = targetIndex + this.totalItems;
      } else {
        shortestPathTarget = targetIndex - this.totalItems;
      }
    }
    
    const finalTargetPosition = -shortestPathTarget * slideWidth;
    
    // Cancel any ongoing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (animate) {
      this.animateToPosition(finalTargetPosition, () => {
        // After animation, normalize position to prevent floating point issues
        this.position = -targetIndex * slideWidth;
        this.currentIndex = targetIndex;
        this.updateDots();
        this.ensureProperSlides();
      });
    } else {
      this.position = finalTargetPosition;
      this.currentIndex = targetIndex;
      this.updateTrackPosition();
      this.updateDots();
      this.ensureProperSlides();
    }
  }
  
  animateToPosition(targetPosition, callback) {
    const startPosition = this.position;
    const distance = targetPosition - startPosition;
    const duration = Math.min(500, 300 + Math.abs(distance) / 2); // Dynamic duration based on distance
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use cubic easing for natural motion
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      this.position = startPosition + distance * easedProgress;
      this.updateTrackPosition();
      
      // Always ensure proper slides during animation
      this.ensureProperSlides();
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.position = targetPosition;
        this.updateTrackPosition();
        this.animationId = null;
        if (callback) callback();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  updateTrackPosition() {
    if (this.track) {
      // Apply transform with will-change for performance
      this.track.style.transform = `translateX(${this.position}px)`;
      
      // Update current index based on position
      const slideWidth = this.getSlideWidth();
      const absolutePosition = Math.abs(this.position);
      const nearestIndex = Math.round(absolutePosition / slideWidth) % this.totalItems;
      
      if (nearestIndex !== this.currentIndex) {
        this.currentIndex = nearestIndex;
        this.updateDots();
      }
    }
  }
  
  open(index) {
    if (this.isOpen || this.totalItems === 0) return;
    
    this.isOpen = true;
    this.currentIndex = index;
    
    // Prevent page scrolling
    document.body.style.overflow = 'hidden';
    
    // Clear the track and prepare for slides
    this.track.innerHTML = '';
    this.dotsContainer.innerHTML = '';
    this.visibleSlides = new Set();
    this.clonedIndices = new Map();
    
    // Initialize position to selected index
    const slideWidth = this.getSlideWidth();
    this.position = -index * slideWidth;
    
    // Create initial slides (visible + buffer)
    this.initialSlideLoad();
    this.updateDots();
    
    // Show overlay with fade-in
    this.overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });
  }
  
  close() {
    if (!this.isOpen) return;
    
    // Stop any ongoing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Fade out overlay
    this.overlay.style.opacity = '0';
    
    // Clean up after animation finishes
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.track.innerHTML = '';
      this.dotsContainer.innerHTML = '';
      this.visibleSlides.clear();
      this.clonedIndices.clear();
      
      // Re-enable scrolling
      document.body.style.overflow = '';
      
      this.isOpen = false;
    }, 300);
  }
  
  initialSlideLoad() {
    // Load visible slides and buffer slides
    const visibleRange = 1; // Slides visible on each side of current
    const bufferRange = 2;  // Additional buffer slides beyond visible range
    
    for (let offset = -visibleRange - bufferRange; offset <= visibleRange + bufferRange; offset++) {
      // Get the actual index with wrapping
      const virtualIndex = this.currentIndex + offset;
      const actualIndex = ((virtualIndex % this.totalItems) + this.totalItems) % this.totalItems;
      
      // Create the slide
      this.createSlide(actualIndex, virtualIndex);
      
      // Track which slides are loaded
      this.visibleSlides.add(virtualIndex);
    }
  }
  
  ensureProperSlides() {
    if (!this.isOpen) return;
    
    const slideWidth = this.getSlideWidth();
    
    // Calculate which virtual indices should be visible based on position
    const centerVirtualIndex = Math.round(-this.position / slideWidth);
    const visibleRange = 1; // Slides visible on each side of current
    const bufferRange = 2;  // Additional buffer slides beyond visible range
    
    const minVirtualIndex = centerVirtualIndex - visibleRange - bufferRange;
    const maxVirtualIndex = centerVirtualIndex + visibleRange + bufferRange;
    
    // Create set of virtual indices that should be visible
    const targetVisibleSlides = new Set();
    for (let virtualIndex = minVirtualIndex; virtualIndex <= maxVirtualIndex; virtualIndex++) {
      targetVisibleSlides.add(virtualIndex);
    }
    
    // Remove slides that should no longer be visible
    const slidesToRemove = [];
    this.visibleSlides.forEach(virtualIndex => {
      if (!targetVisibleSlides.has(virtualIndex)) {
        slidesToRemove.push(virtualIndex);
        
        // Remove the slide from DOM
        const slide = this.track.querySelector(`.carousel-slide[data-virtual-index="${virtualIndex}"]`);
        if (slide) slide.remove();
        
        // Clean up cloned index tracking if needed
        if (this.clonedIndices.has(virtualIndex)) {
          this.clonedIndices.delete(virtualIndex);
        }
      }
    });
    
    // Update tracking of visible slides
    slidesToRemove.forEach(virtualIndex => {
      this.visibleSlides.delete(virtualIndex);
    });
    
    // Add slides that should be visible but aren't yet
    targetVisibleSlides.forEach(virtualIndex => {
      if (!this.visibleSlides.has(virtualIndex)) {
        // Get the actual index with proper wrapping
        const actualIndex = ((virtualIndex % this.totalItems) + this.totalItems) % this.totalItems;
        
        // Create the slide
        this.createSlide(actualIndex, virtualIndex);
        
        // Track that it's now visible
        this.visibleSlides.add(virtualIndex);
      }
    });
  }
  
  createSlide(actualIndex, virtualIndex) {
    const slideWidth = this.getSlideWidth();
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.dataset.actualIndex = actualIndex;
    slide.dataset.virtualIndex = virtualIndex;
    
    // Position slide based on virtual index
    slide.style.transform = `translateX(${virtualIndex * slideWidth}px)`;
    
    // Set up the grid item content (image or video)
    const gridItem = this.gridItems[actualIndex];
    const img = gridItem.querySelector('img');
    const video = gridItem.querySelector('video');
    
    if (img) {
      const slideImg = document.createElement('img');
      slideImg.className = 'carousel-image';
      slideImg.src = img.src;
      slideImg.alt = img.alt || 'Image';
      slide.appendChild(slideImg);
    } else if (video) {
      const slideVideo = document.createElement('video');
      slideVideo.className = 'carousel-image';
      slideVideo.controls = true;
      slideVideo.autoplay = true;
      slideVideo.loop = true;
      slideVideo.muted = true;
      slideVideo.playsInline = true;
      
      // Copy all source elements
      const sources = video.querySelectorAll('source');
      sources.forEach(source => {
        const newSource = document.createElement('source');
        newSource.src = source.src;
        newSource.type = source.type;
        slideVideo.appendChild(newSource);
      });
      
      slide.appendChild(slideVideo);
    }
    
    // Add to track
    this.track.appendChild(slide);
    
    // Track the mapping from virtual to actual index
    this.clonedIndices.set(virtualIndex, actualIndex);
    
    return slide;
  }
  
  updateDots() {
    if (!this.isOpen) return;
    
    // Clear existing dots
    this.dotsContainer.innerHTML = '';
    
    // Only show dots if we have enough items
    if (this.totalItems <= 1) {
      this.dotsContainer.style.display = 'none';
      return;
    }
    
    this.dotsContainer.style.display = 'flex';
    
    // Create a dot for each item
    for (let i = 0; i < this.totalItems; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === this.currentIndex ? ' active' : '');
      
      // Add click handler
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateTo(i, true);
      });
      
      this.dotsContainer.appendChild(dot);
    }
  }
  
  getSlideWidth() {
    return this.container.clientWidth;
  }
  
  handleResize() {
    if (!this.isOpen) return;
    
    const slideWidth = this.getSlideWidth();
    
    // Update all slide positions
    const slides = this.track.querySelectorAll('.carousel-slide');
    slides.forEach(slide => {
      const virtualIndex = parseInt(slide.dataset.virtualIndex, 10);
      slide.style.transform = `translateX(${virtualIndex * slideWidth}px)`;
    });
    
    // Reset position to current index
    this.position = -this.currentIndex * slideWidth;
    this.updateTrackPosition();
  }
  
  pauseAutoLoading() {
    // Pause any resource-intensive operations when tab is hidden
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  resumeAutoLoading() {
    // Resume operations when tab becomes visible
    if (this.isOpen) {
      this.ensureProperSlides();
    }
  }
}

// Add window resize handler
window.addEventListener('resize', () => {
  if (window.currentCarouselInstance) {
    window.currentCarouselInstance.handleResize();
  }
});
