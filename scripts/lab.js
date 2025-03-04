
// FlowCarousel class for the Lab page
class FlowCarousel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      autoScroll: options.autoScroll || false,
      autoScrollSpeed: options.autoScrollSpeed || 0.5, // pixels per frame
      draggable: options.draggable !== undefined ? options.draggable : true,
      itemWidth: options.itemWidth || null, // if null, use natural width
      loop: options.loop !== undefined ? options.loop : true,
      showArrows: options.showArrows !== undefined ? options.showArrows : false
    };
    
    this.track = container.querySelector('.carousel-track');
    this.items = container.querySelectorAll('.carousel-item');
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;
    this.animationId = null;
    this.autoScrollDirection = 1;
    
    this.init();
  }
  
  init() {
    // Set up event listeners for dragging if enabled
    if (this.options.draggable) {
      this.setupDragging();
    }
    
    // Set up arrows if enabled
    if (this.options.showArrows) {
      this.setupArrows();
    }
    
    // Set fixed width for items if specified
    if (this.options.itemWidth) {
      this.items.forEach(item => {
        item.style.width = `${this.options.itemWidth}px`;
      });
    }
    
    // Start auto-scroll if enabled
    if (this.options.autoScroll) {
      this.startAutoScroll();
    }
    
    // Clone items for infinite loop if loop option is enabled
    if (this.options.loop) {
      this.setupInfiniteLoop();
    }
  }
  
  setupDragging() {
    // Mouse events
    this.track.addEventListener('mousedown', (e) => this.startDragging(e));
    window.addEventListener('mousemove', (e) => this.drag(e));
    window.addEventListener('mouseup', () => this.stopDragging());
    
    // Touch events
    this.track.addEventListener('touchstart', (e) => this.startDragging(e));
    window.addEventListener('touchmove', (e) => this.drag(e));
    window.addEventListener('touchend', () => this.stopDragging());
    
    // Prevent context menu while dragging
    this.track.addEventListener('contextmenu', (e) => {
      if (this.isDragging) e.preventDefault();
    });
  }
  
  startDragging(e) {
    this.isDragging = true;
    this.container.classList.add('dragging');
    
    // Get starting position based on mouse or touch
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    this.startX = clientX - this.track.offsetLeft;
    this.scrollLeft = this.track.scrollLeft;
    
    // Pause auto-scroll while dragging
    if (this.options.autoScroll) {
      this.pauseAutoScroll();
    }
  }
  
  drag(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    
    // Calculate new position based on mouse or touch
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const x = clientX - this.track.offsetLeft;
    const walk = (x - this.startX) * 2; // Adjust drag speed
    
    // Move the track
    this.track.style.transform = `translateX(${walk}px)`;
  }
  
  stopDragging() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.container.classList.remove('dragging');
    
    // Get current transform value
    const transformValue = window.getComputedStyle(this.track).getPropertyValue('transform');
    const matrix = new DOMMatrix(transformValue);
    const currentTranslateX = matrix.m41;
    
    // Snap back if out of bounds
    if (this.options.loop) {
      this.handleLoopBoundaries(currentTranslateX);
    } else {
      this.handleStandardBoundaries(currentTranslateX);
    }
    
    // Resume auto-scroll after dragging
    if (this.options.autoScroll) {
      this.resumeAutoScroll();
    }
  }
  
  handleLoopBoundaries(currentTranslateX) {
    // Implement logic for looping carousel boundaries
    // This is a simplified version; a real implementation would need
    // to calculate based on actual item positions and widths
    const trackWidth = this.getTotalWidth();
    const containerWidth = this.container.offsetWidth;
    
    if (currentTranslateX > 0) {
      // Scrolled too far left, jump to end
      this.track.style.transition = 'none';
      this.track.style.transform = `translateX(${-trackWidth + containerWidth}px)`;
      setTimeout(() => {
        this.track.style.transition = 'transform 0.3s ease-out';
      }, 10);
    } else if (Math.abs(currentTranslateX) > trackWidth - containerWidth) {
      // Scrolled too far right, jump to beginning
      this.track.style.transition = 'none';
      this.track.style.transform = `translateX(0px)`;
      setTimeout(() => {
        this.track.style.transition = 'transform 0.3s ease-out';
      }, 10);
    }
  }
  
  handleStandardBoundaries(currentTranslateX) {
    // Implement logic for standard carousel boundaries
    if (currentTranslateX > 0) {
      // Scrolled too far left
      this.track.style.transition = 'transform 0.5s ease-out';
      this.track.style.transform = `translateX(0px)`;
    } else {
      const trackWidth = this.getTotalWidth();
      const containerWidth = this.container.offsetWidth;
      
      if (Math.abs(currentTranslateX) > trackWidth - containerWidth) {
        // Scrolled too far right
        this.track.style.transition = 'transform 0.5s ease-out';
        this.track.style.transform = `translateX(${-trackWidth + containerWidth}px)`;
      }
    }
  }
  
  setupArrows() {
    // Create and add previous arrow
    const prevArrow = document.createElement('div');
    prevArrow.className = 'carousel-arrow prev';
    prevArrow.innerHTML = '<img src="icons/arrow-left.svg" alt="Previous">';
    prevArrow.addEventListener('click', () => this.navigate(-1));
    
    // Create and add next arrow
    const nextArrow = document.createElement('div');
    nextArrow.className = 'carousel-arrow next';
    nextArrow.innerHTML = '<img src="icons/arrow-right.svg" alt="Next">';
    nextArrow.addEventListener('click', () => this.navigate(1));
    
    // Add arrows to container
    this.container.appendChild(prevArrow);
    this.container.appendChild(nextArrow);
  }
  
  navigate(direction) {
    // Calculate new position based on direction and item width
    const transformValue = window.getComputedStyle(this.track).getPropertyValue('transform');
    const matrix = new DOMMatrix(transformValue);
    const currentTranslateX = matrix.m41;
    
    // Use average item width if itemWidth is not set
    const itemWidth = this.options.itemWidth || this.getAverageItemWidth();
    const moveAmount = itemWidth + 20; // Add some spacing
    
    // Calculate new position
    const newPosition = currentTranslateX - (direction * moveAmount);
    
    // Apply new position with animation
    this.track.style.transition = 'transform 0.3s ease-out';
    this.track.style.transform = `translateX(${newPosition}px)`;
    
    // Handle boundaries
    setTimeout(() => {
      if (this.options.loop) {
        this.handleLoopBoundaries(newPosition);
      } else {
        this.handleStandardBoundaries(newPosition);
      }
    }, 300);
  }
  
  getAverageItemWidth() {
    // Calculate average width of carousel items
    let totalWidth = 0;
    this.items.forEach(item => {
      totalWidth += item.offsetWidth;
    });
    return totalWidth / this.items.length;
  }
  
  getTotalWidth() {
    // Calculate total width of carousel track
    let totalWidth = 0;
    this.items.forEach(item => {
      const style = window.getComputedStyle(item);
      const width = item.offsetWidth;
      const marginLeft = parseFloat(style.marginLeft || 0);
      const marginRight = parseFloat(style.marginRight || 0);
      totalWidth += width + marginLeft + marginRight;
    });
    return totalWidth;
  }
  
  setupInfiniteLoop() {
    // Clone first and last items for infinite loop effect
    const firstItemClone = this.items[0].cloneNode(true);
    const lastItemClone = this.items[this.items.length - 1].cloneNode(true);
    
    // Add clones to track
    this.track.appendChild(firstItemClone);
    this.track.insertBefore(lastItemClone, this.track.firstChild);
  }
  
  startAutoScroll() {
    // Stop any existing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Auto-scroll animation function
    const animate = () => {
      // Get current transform
      const transformValue = window.getComputedStyle(this.track).getPropertyValue('transform');
      const matrix = new DOMMatrix(transformValue);
      const currentTranslateX = matrix.m41;
      
      // Calculate boundaries
      const trackWidth = this.getTotalWidth();
      const containerWidth = this.container.offsetWidth;
      
      // Update position based on auto-scroll speed
      const newPosition = currentTranslateX - (this.options.autoScrollSpeed * this.autoScrollDirection);
      
      // Apply new position
      this.track.style.transition = 'none';
      this.track.style.transform = `translateX(${newPosition}px)`;
      
      // Loop if enabled
      if (this.options.loop) {
        // If we've scrolled past the first or last item, reset position
        if (Math.abs(newPosition) > trackWidth - containerWidth) {
          // Reached the end, start from beginning
          this.track.style.transform = `translateX(0px)`;
        }
      } else {
        // Change direction when reaching boundaries
        if (newPosition > 0 || Math.abs(newPosition) > trackWidth - containerWidth) {
          this.autoScrollDirection *= -1;
        }
      }
      
      // Continue animation
      this.animationId = requestAnimationFrame(animate);
    };
    
    // Start animation
    this.animationId = requestAnimationFrame(animate);
  }
  
  pauseAutoScroll() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  resumeAutoScroll() {
    if (this.options.autoScroll) {
      this.startAutoScroll();
    }
  }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const carouselContainer = document.querySelector('.carousel-container');
  if (!carouselContainer) return;
  
  // Create track element if it doesn't exist
  let track = carouselContainer.querySelector('.carousel-track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'carousel-track';
    
    // Move all direct children into the track
    while (carouselContainer.firstChild) {
      if (!carouselContainer.firstChild.classList || !carouselContainer.firstChild.classList.contains('carousel-arrow')) {
        track.appendChild(carouselContainer.firstChild);
      } else {
        break;
      }
    }
    
    carouselContainer.insertBefore(track, carouselContainer.firstChild);
  }
  
  // Initialize carousel with very slow auto-scroll
  const carousel = new FlowCarousel(carouselContainer, {
    autoScroll: true,
    autoScrollSpeed: 0.15, // Even slower movement for better flow
    itemWidth: null, // Allow natural width based on content
    draggable: true,
    loop: true,
    showArrows: false
  });
  
  // Set proper styling for track to ensure items are in a horizontal line
  track.style.display = 'flex';
  track.style.gap = '2em';
  track.style.padding = '0 2em';
  track.style.flexWrap = 'nowrap';
  track.style.width = 'max-content';
  
  // Fix item positioning to be in a straight line
  const items = carouselContainer.querySelectorAll('.carousel-item');
  items.forEach(item => {
    // Ensure each item has proper positioning
    item.style.position = 'relative';
    item.style.flexShrink = '0';
    
    // Ensure items display at full height with auto width
    const media = item.querySelector('img, video');
    if (media) {
      media.style.height = '80vh';
      media.style.width = 'auto';
      media.style.borderRadius = '8px';
      media.style.position = 'relative';
    }
  });
});
