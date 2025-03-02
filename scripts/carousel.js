/**
 * Desktop Carousel Handler for elements.html
 * A custom image viewer optimized for desktop devices only
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
    const carousel = new DesktopCarousel();

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

class DesktopCarousel {
    constructor() {
        this.currentIndex = 0;
        this.overlay = null;
        this.carouselContainer = null;
        this.imageContainer = null;
        this.prevArrow = null;
        this.nextArrow = null;
        this.gridItemsArray = [];
        this.isOpen = false;

        this.createCarouselElements();
        this.setupEventListeners();
        this.updateGridItems();

        console.log("Desktop carousel created");
    }

    createCarouselElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'carousel-overlay';

        // Create carousel container
        this.carouselContainer = document.createElement('div');
        this.carouselContainer.className = 'carousel-container';

        // Create image container
        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'carousel-image-container';

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
        this.carouselContainer.appendChild(this.imageContainer);
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
    }

    updateGridItems() {
        // Get all grid items
        const items = document.querySelectorAll('.grid-item');
        this.gridItemsArray = Array.from(items);
        console.log("Updated grid items array with", this.gridItemsArray.length, "items");
    }

    open(index) {
        if (this.isOpen) return;

        // Make sure we have the latest grid items
        this.updateGridItems();

        if (this.gridItemsArray.length === 0) {
            console.warn("No grid items to show in carousel");
            return;
        }

        this.isOpen = true;
        this.currentIndex = index;
        console.log("Opening carousel at index", index);

        // Prevent page scrolling
        document.body.style.overflow = 'hidden';

        // Show overlay with fade-in
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);

        // Load current image
        this.loadCurrentImage();
    }

    close() {
        if (!this.isOpen) return;
        console.log("Closing carousel");

        // Fade out
        this.overlay.style.opacity = '0';

        // Wait for animation to complete
        setTimeout(() => {
            // Hide overlay
            this.overlay.style.display = 'none';

            // Clear image container
            this.imageContainer.innerHTML = '';

            // Allow scrolling
            document.body.style.overflow = '';

            this.isOpen = false;
        }, 300);
    }

    navigate(direction) {
        // Calculate new index with wrapping
        const totalItems = this.gridItemsArray.length;
        let newIndex = this.currentIndex + direction;

        // Wrap around if needed
        if (newIndex < 0) newIndex = totalItems - 1;
        if (newIndex >= totalItems) newIndex = 0;

        console.log("Navigating from", this.currentIndex, "to", newIndex);
        this.currentIndex = newIndex;
        this.loadCurrentImage();
    }

    loadCurrentImage() {
        const currentItem = this.gridItemsArray[this.currentIndex];
        if (!currentItem) {
            console.error("No item found at index", this.currentIndex);
            return;
        }

        // Clear previous content
        this.imageContainer.innerHTML = '';

        // Check if the grid item contains an image or video
        const img = currentItem.querySelector('img');
        const video = currentItem.querySelector('video');

        if (img) {
            console.log("Loading image:", img.src);
            // Create a new image to show in carousel
            const carouselImg = document.createElement('img');
            carouselImg.className = 'carousel-image';
            carouselImg.src = img.src;
            carouselImg.alt = img.alt || 'Image';

            // Ensure the image is loaded before showing
            carouselImg.onload = () => {
                console.log('Carousel image loaded');
            };

            carouselImg.onerror = (e) => {
                console.error('Error loading carousel image:', e);
            };

            this.imageContainer.appendChild(carouselImg);
        } else if (video) {
            console.log("Loading video");
            // Create a new video to show in carousel
            const carouselVideo = document.createElement('video');
            carouselVideo.className = 'carousel-image';
            carouselVideo.controls = true;
            carouselVideo.autoplay = true;
            carouselVideo.loop = true;
            carouselVideo.muted = true;
            carouselVideo.playsInline = true;

            // Copy all source elements
            const sources = video.querySelectorAll('source');
            sources.forEach(source => {
                const newSource = document.createElement('source');
                newSource.src = source.src;
                newSource.type = source.type;
                carouselVideo.appendChild(newSource);
            });

            this.imageContainer.appendChild(carouselVideo);
        } else {
            console.warn('No media found in grid item at index', this.currentIndex);
        }
    }
}