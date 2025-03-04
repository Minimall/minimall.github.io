
/**
 * Desktop Carousel Handler for elements.html
 * A custom image viewer optimized for desktop devices only
 * with seamless infinite image streaming
 */

// Initialize carousel when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, checking for desktop");
    // Only initialize on desktop
    if (window.matchMedia('(min-width: 789px)').matches) {
        console.log("Desktop detected, waiting for grid items to load");
        
        // Wait for grid-loader.js to create grid items
        const checkGridItems = function() {
            const gridItems = document.querySelectorAll('.grid-item');
            if (gridItems.length > 0) {
                console.log("Grid items found:", gridItems.length);
                initializeDesktopCarousel();
            } else {
                console.log("Waiting for grid items...");
                setTimeout(checkGridItems, 100); // Check again in 100ms
            }
        };
        
        // Start checking for grid items
        setTimeout(checkGridItems, 300); // Give grid-loader.js a head start
    } else {
        console.log("Mobile detected, skipping desktop carousel initialization");
    }
    // We intentionally skip mobile initialization for elements.html
});

function initializeDesktopCarousel() {
    const gridItems = document.querySelectorAll('.grid-item');
    if (gridItems.length === 0) {
        console.log("No grid items found");
        return;
    }

    console.log("Found", gridItems.length, "grid items, initializing desktop carousel");

    // Create carousel instance for desktop
    const carousel = new InfiniteCarousel(gridItems);

    // Add click handlers to grid items
    gridItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            console.log("Grid item clicked:", index);
            carousel.open(index);
        });

        // Add cursor pointer to make clickable items more obvious
        item.style.cursor = 'pointer';
    });
}

class InfiniteCarousel {
    constructor(gridItems) {
        this.gridItemsArray = Array.from(gridItems);
        this.currentIndex = 0;
        this.totalItems = this.gridItemsArray.length;
        this.isOpen = false;
        this.animationInProgress = false;
        
        // Pre-load items
        this.preloadAmount = 2; // Number of items to preload in each direction
        
        // Create DOM elements
        this.createCarouselElements();
        this.setupEventListeners();
        
        console.log("Infinite carousel created with", this.totalItems, "items");
    }

    createCarouselElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'carousel-overlay';

        // Create carousel container
        this.carouselContainer = document.createElement('div');
        this.carouselContainer.className = 'carousel-container';

        // Create track container for horizontal scrolling
        this.trackContainer = document.createElement('div');
        this.trackContainer.className = 'carousel-track-container';
        this.trackContainer.style.display = 'flex';
        this.trackContainer.style.transition = 'transform 0.4s ease-out';
        this.trackContainer.style.width = '100%';
        this.trackContainer.style.height = '100%';
        this.trackContainer.style.position = 'relative';

        // Create navigation arrows
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

        // Assemble the carousel
        this.carouselContainer.appendChild(this.trackContainer);
        this.carouselContainer.appendChild(this.prevArrow);
        this.carouselContainer.appendChild(this.nextArrow);
        this.overlay.appendChild(this.carouselContainer);

        // Add to document
        document.body.appendChild(this.overlay);
    }

    setupEventListeners() {
        // Navigation
        this.prevArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigate(-1);
        });

        this.nextArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigate(1);
        });

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
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
                    this.navigate(-1);
                    break;
                case 'ArrowRight':
                    this.navigate(1);
                    break;
            }
        });

        // Touch events for swipe
        let startX, moveX, isDragging = false;
        const threshold = 50; // Minimum swipe distance

        this.trackContainer.addEventListener('touchstart', (e) => {
            if (!this.isOpen) return;
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        this.trackContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            moveX = e.touches[0].clientX;
            const diff = moveX - startX;
            
            // Apply a direct transform during drag for immediate feedback
            this.trackContainer.style.transform = `translateX(${diff}px)`;
        });

        this.trackContainer.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            const diff = moveX - startX;
            
            if (Math.abs(diff) > threshold) {
                // Swipe detected - navigate in the appropriate direction
                this.navigate(diff < 0 ? 1 : -1);
            } else {
                // Reset position if swipe was too small
                this.trackContainer.style.transform = 'translateX(0)';
            }
            
            isDragging = false;
        });
    }

    open(index) {
        if (this.isOpen) return;
        
        if (this.gridItemsArray.length === 0) {
            console.warn("No grid items to show in carousel");
            return;
        }

        this.isOpen = true;
        this.currentIndex = index;
        console.log("Opening carousel at index", index);

        // Prevent page scrolling
        document.body.style.overflow = 'hidden';

        // Clear track container
        this.trackContainer.innerHTML = '';

        // Load initial set of images
        this.loadImagesForInfiniteScroll();

        // Show overlay with fade-in
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);
    }

    close() {
        if (!this.isOpen) return;
        console.log("Closing carousel");

        // Fade out overlay
        this.overlay.style.opacity = '0';

        // Wait for animation to complete
        setTimeout(() => {
            // Hide overlay
            this.overlay.style.display = 'none';

            // Clear track container
            this.trackContainer.innerHTML = '';

            // Allow scrolling
            document.body.style.overflow = '';

            this.isOpen = false;
            this.animationInProgress = false;
        }, 500);
    }

    loadImagesForInfiniteScroll() {
        // Calculate indices for visible and preloaded items
        const indices = [];
        
        // Add items before current
        for (let i = this.preloadAmount; i > 0; i--) {
            indices.push(this.getWrappedIndex(this.currentIndex - i));
        }
        
        // Add current item
        indices.push(this.currentIndex);
        
        // Add items after current
        for (let i = 1; i <= this.preloadAmount; i++) {
            indices.push(this.getWrappedIndex(this.currentIndex + i));
        }
        
        // Create image containers and position them
        indices.forEach((index, position) => {
            const item = this.gridItemsArray[index];
            const container = this.createImageContainer(item, index);
            
            // Position relative to current index
            const offset = position - this.preloadAmount;
            container.style.transform = `translateX(${offset * 100}%)`;
            
            this.trackContainer.appendChild(container);
        });
        
        // Center on current item
        this.trackContainer.style.transform = 'translateX(0)';
    }

    createImageContainer(gridItem, index) {
        const container = document.createElement('div');
        container.className = 'carousel-slide';
        container.dataset.index = index;
        container.style.position = 'absolute';
        container.style.left = '0';
        container.style.top = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        
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
            
            container.appendChild(carouselImg);
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
            
            container.appendChild(carouselVideo);
        }
        
        return container;
    }

    navigate(direction) {
        if (this.animationInProgress) return;
        this.animationInProgress = true;
        
        // Update current index with wrapping
        this.currentIndex = this.getWrappedIndex(this.currentIndex + direction);
        
        console.log("Navigating to index", this.currentIndex);
        
        // Slide the track
        this.trackContainer.style.transition = 'transform 0.4s ease-out';
        this.trackContainer.style.transform = `translateX(${-direction * 100}%)`;
        
        // After animation completes, reset and load new images
        setTimeout(() => {
            // Remove transition temporarily
            this.trackContainer.style.transition = 'none';
            
            // Reset transform and update images
            this.trackContainer.style.transform = 'translateX(0)';
            
            // Clear and reload images
            this.trackContainer.innerHTML = '';
            this.loadImagesForInfiniteScroll();
            
            // Force reflow to apply new positions before re-enabling transitions
            void this.trackContainer.offsetWidth;
            
            // Re-enable transitions
            this.trackContainer.style.transition = 'transform 0.4s ease-out';
            
            this.animationInProgress = false;
        }, 400);
    }

    getWrappedIndex(index) {
        // Handle index wrapping for infinite scrolling
        return ((index % this.totalItems) + this.totalItems) % this.totalItems;
    }
}
