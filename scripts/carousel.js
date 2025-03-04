
/**
 * Infinite Image Carousel with iOS-style Physics
 * Features:
 * - Momentum-based swiping with natural deceleration
 * - Seamless infinite scrolling
 * - Elastic boundaries when reaching ends
 * - Touch and mouse support
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check for desktop or mobile - our approach works for both
    setTimeout(() => {
        const gridItems = document.querySelectorAll('.grid-item');
        if (gridItems.length > 0) {
            console.log("Grid items found:", gridItems.length);
            initializeCarousel(gridItems);
        } else {
            console.log("No grid items found");
        }
    }, 300); // Allow time for grid items to load
});

function initializeCarousel(gridItems) {
    const carousel = new FluidCarousel(gridItems);
    
    // Add click handlers to grid items
    gridItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            carousel.open(index);
        });
        item.style.cursor = 'pointer';
    });
}

class FluidCarousel {
    constructor(gridItems) {
        this.gridItems = Array.from(gridItems);
        this.totalItems = this.gridItems.length;
        this.currentIndex = 0;
        this.isOpen = false;
        
        // Physics parameters
        this.velocity = 0;
        this.position = 0;
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.isDragging = false;
        this.isScrolling = false;
        this.scrollDirection = null;
        this.timestamps = [];
        this.positions = [];
        this.friction = 0.95; // Higher value = less friction
        this.springConstant = 0.2; // For elastic bounce
        this.animationId = null;
        this.slidesLoaded = new Set();
        
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
        this.track.style.width = '100%';
        this.track.style.height = '100%';
        this.track.style.position = 'relative';
        this.track.style.overflow = 'hidden';
        
        // Create navigation arrows with iOS-style design
        this.prevArrow = document.createElement('button');
        this.prevArrow.className = 'carousel-nav prev';
        this.prevArrow.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
            </svg>
        `;
        
        this.nextArrow = document.createElement('button');
        this.nextArrow.className = 'carousel-nav next';
        this.nextArrow.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
            </svg>
        `;
        
        // Create dots indicator container (optional - can be shown/hidden)
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'carousel-dots';
        this.dotsContainer.style.position = 'absolute';
        this.dotsContainer.style.bottom = '20px';
        this.dotsContainer.style.left = '0';
        this.dotsContainer.style.right = '0';
        this.dotsContainer.style.display = 'flex';
        this.dotsContainer.style.justifyContent = 'center';
        this.dotsContainer.style.gap = '8px';
        
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
        // Arrow navigation
        this.prevArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.snapToIndex(this.currentIndex - 1);
        });
        
        this.nextArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.snapToIndex(this.currentIndex + 1);
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
                    this.snapToIndex(this.currentIndex - 1);
                    break;
                case 'ArrowRight':
                    this.snapToIndex(this.currentIndex + 1);
                    break;
            }
        });
        
        // Touch events with physics
        this.setupDragEvents();
    }
    
    setupDragEvents() {
        // Handle both mouse and touch events
        this.track.addEventListener('mousedown', this.handleDragStart.bind(this));
        this.track.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: false });
        
        window.addEventListener('mousemove', this.handleDragMove.bind(this));
        window.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
        
        window.addEventListener('mouseup', this.handleDragEnd.bind(this));
        window.addEventListener('touchend', this.handleDragEnd.bind(this));
        
        // Prevent context menu during drag
        this.track.addEventListener('contextmenu', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });
    }
    
    handleDragStart(e) {
        if (!this.isOpen) return;
        
        this.isDragging = true;
        this.velocity = 0;
        
        // Stop any ongoing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Get starting position
        const point = e.touches ? e.touches[0] : e;
        this.startX = point.clientX;
        this.startY = point.clientY;
        this.lastX = this.startX;
        this.scrollDirection = null;
        this.isScrolling = false;
        
        // Reset history for velocity calculation
        this.timestamps = [Date.now()];
        this.positions = [this.startX];
        
        // Improve responsiveness by adding grabbing cursor
        this.track.style.cursor = 'grabbing';
        
        // Prevent default to avoid text selection
        e.preventDefault();
    }
    
    handleDragMove(e) {
        if (!this.isDragging || !this.isOpen) return;
        
        const point = e.touches ? e.touches[0] : e;
        const currentX = point.clientX;
        const currentY = point.clientY;
        
        // Determine scroll direction on first move
        if (this.scrollDirection === null) {
            const deltaX = Math.abs(currentX - this.startX);
            const deltaY = Math.abs(currentY - this.startY);
            
            // If vertical scrolling is dominant, exit drag mode
            if (deltaY > deltaX && deltaY > 10) {
                this.isDragging = false;
                this.isScrolling = true;
                return;
            }
            
            // If horizontal scrolling is dominant, prevent page scrolling
            if (deltaX > deltaY && deltaX > 10) {
                this.scrollDirection = 'horizontal';
                e.preventDefault();
            }
        }
        
        // Only process horizontal movements
        if (this.scrollDirection === 'horizontal') {
            // Calculate drag distance
            const deltaX = currentX - this.lastX;
            
            // Update carousel position with resistance at edges
            this.position += deltaX;
            
            // Apply the transform
            this.updatePosition();
            
            // Record position and timestamp for velocity calculation
            this.timestamps.push(Date.now());
            this.positions.push(currentX);
            
            // Only keep last 5 points for velocity calculation
            if (this.timestamps.length > 5) {
                this.timestamps.shift();
                this.positions.shift();
            }
            
            this.lastX = currentX;
            
            // Always prevent default for horizontal scrolling
            e.preventDefault();
        }
    }
    
    handleDragEnd() {
        if (!this.isDragging || !this.isOpen) return;
        
        this.isDragging = false;
        this.track.style.cursor = 'grab';
        
        // Calculate velocity based on recent movement history
        if (this.timestamps.length > 1) {
            const lastIndex = this.timestamps.length - 1;
            const timeElapsed = this.timestamps[lastIndex] - this.timestamps[0];
            const distance = this.positions[lastIndex] - this.positions[0];
            
            // Calculate pixels per millisecond
            if (timeElapsed > 0) {
                this.velocity = distance / timeElapsed * 15; // Scale factor for better feel
            }
        }
        
        // Start deceleration animation
        this.startDecelerationAnimation();
    }
    
    startDecelerationAnimation() {
        const containerWidth = this.container.clientWidth;
        const slideWidth = containerWidth;
        
        // Function to handle physics-based animation
        const animate = () => {
            // Apply friction to velocity
            this.velocity *= this.friction;
            
            // Apply velocity to position
            this.position += this.velocity;
            
            // Calculate current index based on position
            const normalizedPosition = -this.position / slideWidth;
            const estimatedIndex = Math.round(normalizedPosition);
            
            // Apply spring force if past the edges
            if (this.totalItems > 0) {
                const minPos = -slideWidth * (this.totalItems - 1);
                const maxPos = 0;
                
                if (this.position > maxPos) {
                    // Spring force when past start
                    const overscroll = this.position - maxPos;
                    this.velocity -= overscroll * this.springConstant;
                } else if (this.position < minPos) {
                    // Spring force when past end
                    const overscroll = minPos - this.position;
                    this.velocity += overscroll * this.springConstant;
                }
            }
            
            // Update the visual position
            this.updatePosition();
            
            // Determine if animation should continue
            const isSlowEnough = Math.abs(this.velocity) < 0.5;
            const isCloseToSnap = Math.abs(this.position / slideWidth - Math.round(this.position / slideWidth)) < 0.01;
            
            if (isSlowEnough && isCloseToSnap) {
                // Snap to the nearest slide
                this.snapToIndex(Math.round(-this.position / slideWidth));
                return;
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        // Start the animation
        this.animationId = requestAnimationFrame(animate);
    }
    
    snapToIndex(index) {
        // Ensure index is within bounds and wrap around for infinite scrolling
        if (this.totalItems > 0) {
            index = ((index % this.totalItems) + this.totalItems) % this.totalItems;
        } else {
            index = 0;
        }
        
        const containerWidth = this.container.clientWidth;
        const targetPosition = -index * containerWidth;
        
        // Cancel any ongoing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Animate to the target position
        this.animateToPosition(targetPosition, () => {
            this.currentIndex = index;
            this.updateDots();
            this.ensureImagesLoaded();
        });
    }
    
    animateToPosition(targetPosition, callback) {
        const startPosition = this.position;
        const distance = targetPosition - startPosition;
        const duration = 350; // milliseconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic function: 1 - (1 - t)^3
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            this.position = startPosition + distance * easedProgress;
            this.updatePosition();
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.position = targetPosition; // Ensure we end exactly at target
                this.updatePosition();
                this.animationId = null;
                if (callback) callback();
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    updatePosition() {
        if (this.track) {
            this.track.style.transform = `translateX(${this.position}px)`;
        }
    }
    
    open(index) {
        if (this.isOpen) return;
        
        if (this.totalItems === 0) {
            console.warn("No images to show in carousel");
            return;
        }
        
        this.isOpen = true;
        this.currentIndex = index;
        console.log("Opening carousel at index", index);
        
        // Prevent page scrolling
        document.body.style.overflow = 'hidden';
        
        // Clear track container
        this.track.innerHTML = '';
        this.dotsContainer.innerHTML = '';
        
        // Initialize position
        this.position = -index * this.container.clientWidth;
        
        // Load initial set of images
        this.loadImagesForView();
        this.updateDots();
        
        // Show overlay with fade-in
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);
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
        
        // Wait for animation to complete
        setTimeout(() => {
            // Hide overlay
            this.overlay.style.display = 'none';
            
            // Clear track container
            this.track.innerHTML = '';
            this.dotsContainer.innerHTML = '';
            
            // Allow scrolling
            document.body.style.overflow = '';
            
            this.isOpen = false;
            this.slidesLoaded.clear();
        }, 400);
    }
    
    loadImagesForView() {
        // Calculate indices for visible and buffer items
        const indices = [];
        const bufferSize = 2; // Number of items to preload in each direction
        
        // Add current item and buffer items
        for (let i = -bufferSize; i <= bufferSize; i++) {
            const index = this.getWrappedIndex(this.currentIndex + i);
            indices.push(index);
        }
        
        // Create slides for each index if not already loaded
        indices.forEach(index => {
            if (!this.slidesLoaded.has(index)) {
                this.createSlide(index);
                this.slidesLoaded.add(index);
            }
        });
        
        // Position all slides correctly
        this.updateSlidesPosition();
    }
    
    ensureImagesLoaded() {
        // Load images for the current view and buffer
        this.loadImagesForView();
        
        // Cleanup slides that are far from current view to save memory
        const bufferSize = 4; // Larger cleanup buffer
        const minKeepIndex = this.getWrappedIndex(this.currentIndex - bufferSize);
        const maxKeepIndex = this.getWrappedIndex(this.currentIndex + bufferSize);
        
        // Only clean up if we have many slides loaded
        if (this.slidesLoaded.size > bufferSize * 2 + 5) {
            const slidesToRemove = [];
            
            this.slidesLoaded.forEach(index => {
                // Check if slide is outside our keep range
                // This is tricky with wrapped indices, so we use distance calculation
                let distance = Math.min(
                    (index - this.currentIndex + this.totalItems) % this.totalItems,
                    (this.currentIndex - index + this.totalItems) % this.totalItems
                );
                
                if (distance > bufferSize) {
                    slidesToRemove.push(index);
                    const slide = this.track.querySelector(`.carousel-slide[data-index="${index}"]`);
                    if (slide) slide.remove();
                }
            });
            
            // Update our tracking of loaded slides
            slidesToRemove.forEach(index => this.slidesLoaded.delete(index));
        }
    }
    
    updateSlidesPosition() {
        const containerWidth = this.container.clientWidth;
        
        // Position all slides based on their index
        const slides = this.track.querySelectorAll('.carousel-slide');
        slides.forEach(slide => {
            const index = parseInt(slide.dataset.index, 10);
            slide.style.transform = `translateX(${index * containerWidth}px)`;
        });
    }
    
    createSlide(index) {
        const gridItem = this.gridItems[index];
        const slideWidth = this.container.clientWidth;
        
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.dataset.index = index;
        slide.style.position = 'absolute';
        slide.style.left = '0';
        slide.style.top = '0';
        slide.style.width = '100%';
        slide.style.height = '100%';
        slide.style.display = 'flex';
        slide.style.alignItems = 'center';
        slide.style.justifyContent = 'center';
        slide.style.transform = `translateX(${index * slideWidth}px)`;
        
        // Check if the grid item contains an image or video
        const img = gridItem.querySelector('img');
        const video = gridItem.querySelector('video');
        
        if (img) {
            const carouselImg = document.createElement('img');
            carouselImg.className = 'carousel-image';
            carouselImg.src = img.src;
            carouselImg.alt = img.alt || 'Image';
            carouselImg.style.maxWidth = '90%';
            carouselImg.style.maxHeight = '90%';
            carouselImg.style.objectFit = 'contain';
            
            slide.appendChild(carouselImg);
        } else if (video) {
            const carouselVideo = document.createElement('video');
            carouselVideo.className = 'carousel-image';
            carouselVideo.controls = true;
            carouselVideo.autoplay = true;
            carouselVideo.loop = true;
            carouselVideo.muted = true; 
            carouselVideo.playsInline = true;
            carouselVideo.style.maxWidth = '90%';
            carouselVideo.style.maxHeight = '90%';
            carouselVideo.style.objectFit = 'contain';
            
            // Copy all source elements
            const sources = video.querySelectorAll('source');
            sources.forEach(source => {
                const newSource = document.createElement('source');
                newSource.src = source.src;
                newSource.type = source.type;
                carouselVideo.appendChild(newSource);
            });
            
            slide.appendChild(carouselVideo);
        }
        
        this.track.appendChild(slide);
    }
    
    updateDots() {
        // Clear existing dots
        this.dotsContainer.innerHTML = '';
        
        // Create a dot for each item
        for (let i = 0; i < this.totalItems; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === this.currentIndex ? ' active' : '');
            dot.style.width = '8px';
            dot.style.height = '8px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = i === this.currentIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)';
            dot.style.transition = 'all 0.3s ease';
            
            // Add click handler to jump to this item
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.snapToIndex(i);
            });
            
            this.dotsContainer.appendChild(dot);
        }
        
        // Only show dots if we have multiple items
        this.dotsContainer.style.display = this.totalItems > 1 ? 'flex' : 'none';
    }
    
    getWrappedIndex(index) {
        // Handle index wrapping for infinite scrolling
        return ((index % this.totalItems) + this.totalItems) % this.totalItems;
    }
    
    // Handle window resize to adjust slide positions
    handleResize() {
        const slideWidth = this.container.clientWidth;
        this.position = -this.currentIndex * slideWidth;
        this.updatePosition();
        this.updateSlidesPosition();
    }
}

// Add window resize handler
window.addEventListener('resize', () => {
    // Find any active carousel instance
    const overlay = document.querySelector('.carousel-overlay');
    if (overlay && overlay.style.display !== 'none') {
        const carouselInstance = window.currentCarouselInstance;
        if (carouselInstance) {
            carouselInstance.handleResize();
        }
    }
});
