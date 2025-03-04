
/**
 * Flow Carousel
 * A horizontally flowing carousel with drag functionality
 */
class FlowCarousel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      autoScroll: true,
      autoScrollSpeed: 1, // pixels per frame
      itemWidth: null, // Will be calculated
      ...options
    };
    
    this.track = container.querySelector('.carousel-track');
    this.items = Array.from(container.querySelectorAll('.carousel-item'));
    this.itemCount = this.items.length;
    this.currentIndex = 0;
    
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;
    this.animationFrame = null;
    this.autoScrollPaused = false;
    
    // Navigation elements
    this.prevButton = container.querySelector('.flow-nav.prev');
    this.nextButton = container.querySelector('.flow-nav.next');
    this.progressDots = null;
    
    this.init();
  }
  
  init() {
    // Set initial sizes and positions
    this.calculateSizes();
    
    // Create progress indicators
    this.createProgressDots();
    
    // Add event listeners
    this.addEventListeners();
    
    // Start auto-scroll if enabled
    if (this.options.autoScroll) {
      this.startAutoScroll();
    }
    
    // Set the initial position
    this.goToItem(0, false);
    
    // Add resize listener
    window.addEventListener('resize', this.debounce(() => {
      this.calculateSizes();
      this.goToItem(this.currentIndex, false);
    }, 200));
  }
  
  calculateSizes() {
    // Calculate item width - use the first item's width including margins
    const firstItem = this.items[0];
    const itemStyle = window.getComputedStyle(firstItem);
    const marginLeft = parseFloat(itemStyle.marginLeft) || 0;
    const marginRight = parseFloat(itemStyle.marginRight) || 0;
    
    // Use natural width or force a percentage of viewport
    if (this.options.itemWidth) {
      this.itemWidth = this.options.itemWidth;
    } else {
      this.itemWidth = firstItem.offsetWidth + marginLeft + marginRight;
    }
    
    // Set the track width
    const totalWidth = this.itemWidth * this.itemCount;
    this.track.style.width = `${totalWidth}px`;
    
    // Ensure each item has the same width
    this.items.forEach(item => {
      item.style.width = `${this.itemWidth}px`;
    });
    
    // Calculate the maximum scroll position
    this.maxScroll = totalWidth - this.container.clientWidth;
  }
  
  createProgressDots() {
    // Create or clear existing progress container
    let progressContainer = this.container.querySelector('.carousel-progress');
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.className = 'carousel-progress';
      this.container.appendChild(progressContainer);
    } else {
      progressContainer.innerHTML = '';
    }
    
    // Create dot for each item
    for (let i = 0; i < this.itemCount; i++) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => this.goToItem(i));
      progressContainer.appendChild(dot);
    }
    
    this.progressDots = Array.from(progressContainer.querySelectorAll('.progress-dot'));
  }
  
  addEventListeners() {
    // Mouse events
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Touch events
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
  }
  
  onMouseDown(e) {
    this.isDragging = true;
    this.container.classList.add('grabbing');
    this.startX = e.pageX - this.container.offsetLeft;
    this.scrollLeft = this.getCurrentScrollPosition();
    this.pauseAutoScroll();
  }
  
  onMouseMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const x = e.pageX - this.container.offsetLeft;
    const walk = (x - this.startX) * 2; // Drag speed multiplier
    const newPosition = this.scrollLeft - walk;
    this.setScrollPosition(newPosition);
  }
  
  onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.container.classList.remove('grabbing');
    this.snapToClosestItem();
    this.resumeAutoScroll();
  }
  
  onTouchStart(e) {
    this.isDragging = true;
    this.startX = e.touches[0].pageX - this.container.offsetLeft;
    this.scrollLeft = this.getCurrentScrollPosition();
    this.pauseAutoScroll();
  }
  
  onTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault(); // Prevent page scrolling
    const x = e.touches[0].pageX - this.container.offsetLeft;
    const walk = (x - this.startX) * 2;
    const newPosition = this.scrollLeft - walk;
    this.setScrollPosition(newPosition);
  }
  
  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.snapToClosestItem();
    this.resumeAutoScroll();
  }
  
  getCurrentScrollPosition() {
    const transform = window.getComputedStyle(this.track).getPropertyValue('transform');
    const matrix = new DOMMatrix(transform);
    return -matrix.m41; // Get the x translation value
  }
  
  setScrollPosition(position) {
    // Constrain to valid range
    position = Math.max(0, Math.min(position, this.maxScroll));
    this.track.style.transform = `translateX(${-position}px)`;
    
    // Update the current index based on position
    const newIndex = Math.round(position / this.itemWidth);
    if (newIndex !== this.currentIndex) {
      this.updateCurrentIndex(newIndex);
    }
  }
  
  snapToClosestItem() {
    const currentPosition = this.getCurrentScrollPosition();
    const itemIndex = Math.round(currentPosition / this.itemWidth);
    this.goToItem(itemIndex);
  }
  
  goToItem(index, animate = true) {
    // Constrain index to valid range
    index = Math.max(0, Math.min(index, this.itemCount - 1));
    
    // Calculate position
    const position = index * this.itemWidth;
    
    // Update tracking
    this.currentIndex = index;
    this.updateProgressDots();
    
    // Apply transform with or without animation
    if (animate) {
      this.track.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      setTimeout(() => {
        this.track.style.transition = '';
      }, 500);
    } else {
      this.track.style.transition = 'none';
    }
    
    this.track.style.transform = `translateX(${-position}px)`;
  }
  
  updateProgressDots() {
    if (!this.progressDots) return;
    
    this.progressDots.forEach((dot, i) => {
      if (i === this.currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
  
  updateCurrentIndex(index) {
    this.currentIndex = index;
    this.updateProgressDots();
  }
  
  startAutoScroll() {
    if (this.animationFrame) return;
    
    const scroll = () => {
      if (!this.autoScrollPaused && !this.isDragging) {
        const currentPosition = this.getCurrentScrollPosition();
        // Changed direction to right-to-left (negative value moves content right)
        let newPosition = currentPosition + this.options.autoScrollSpeed;
        
        // Loop handling: when we reach the end, loop back to start
        if (newPosition >= this.maxScroll) {
          newPosition = 0;
        }
        
        this.setScrollPosition(newPosition);
      }
      this.animationFrame = requestAnimationFrame(scroll);
    };
    
    this.animationFrame = requestAnimationFrame(scroll);
  }
  
  pauseAutoScroll() {
    this.autoScrollPaused = true;
  }
  
  resumeAutoScroll() {
    this.autoScrollPaused = false;
  }
  
  stopAutoScroll() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we have flow carousel container
  const carouselContainer = document.querySelector('.flow-carousel');
  if (!carouselContainer) return;
  
  // Get all images from the lab folder
  const labImages = [
    { type: 'image', src: 'images/lab/2-week-sprint.avif', alt: '2 Week Sprint' },
    { type: 'image', src: 'images/lab/design-skillset.avif', alt: 'Design Skillset' },
    { type: 'image', src: 'images/lab/healthcare.avif', alt: 'Healthcare' },
    { type: 'image', src: 'images/lab/innomatix.avif', alt: 'Innomatix' },
    { type: 'video', src: 'videos/wombi-reel.mp4', alt: 'Wombi Reel' }
  ];
  
  // Create carousel track and items
  const track = document.createElement('div');
  track.className = 'carousel-track';
  
  // Add items to track
  labImages.forEach(item => {
    const carouselItem = document.createElement('div');
    carouselItem.className = 'carousel-item';
    
    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.loading = 'lazy';
      carouselItem.appendChild(img);
    } else if (item.type === 'video') {
      const video = document.createElement('video');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.src = item.src;
      carouselItem.appendChild(video);
    }
    
    track.appendChild(carouselItem);
  });
  
  // Add track to container
  carouselContainer.appendChild(track);
  
  // Navigation arrows have been removed as per requirements
  
  // Initialize carousel with very slow auto-scroll
  const carousel = new FlowCarousel(carouselContainer, {
    autoScroll: true,
    autoScrollSpeed: 0.2, // Reduced speed for slower movement
    itemWidth: null // Allow natural width based on content
  });
  
  // Fix item positioning to be in a straight line
  const items = carouselContainer.querySelectorAll('.carousel-item');
  items.forEach(item => {
    // Ensure items display at full height with auto width
    const media = item.querySelector('img, video');
    if (media) {
      media.style.height = '80vh';
      media.style.width = 'auto';
      // Make sure the media loads to full size
      if (media.complete) {
        // If already loaded
        carousel.calculateSizes();
      } else {
        // If still loading
        media.onload = () => carousel.calculateSizes();
      }
    }
  });
  
  // Add some additional styling to ensure the carousel fills the viewport
  carouselContainer.style.width = '100vw';
  carouselContainer.style.left = '0';
  carouselContainer.style.right = '0';
  carouselContainer.style.position = 'relative';
  carouselContainer.style.marginLeft = 'calc(-50vw + 50%)';
  carouselContainer.style.marginRight = 'calc(-50vw + 50%)';
  track.style.display = 'flex';
  track.style.width = 'max-content';
  
  // Connect with scroll-color.js
  // The flow-carousel-section should be detected by the existing scroll-color.js
});
