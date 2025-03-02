
/**
 * Desktop Carousel Handler for elements.html
 * Only initializes carousel for desktop devices
 */

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on desktop
    const isMobile = window.matchMedia('(max-width: 788px)').matches;
    if (!isMobile) {
        initializeCarousel();
    }

    function initializeCarousel() {
        const gridItems = document.querySelectorAll('.grid-item');
        if (gridItems.length === 0) return;
        
        const carousel = new DesktopCarousel();
        carousel.setGridItems(gridItems);
        
        // Set up click handlers for grid items
        gridItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                carousel.open(index);
            });
        });
    }
});

/**
 * Desktop Carousel
 * A fullscreen carousel view optimized for desktop devices
 */
class DesktopCarousel {
    constructor() {
        this.currentIndex = 0;
        this.overlay = null;
        this.carouselContainer = null;
        this.imageContainer = null;
        this.prevArrow = null;
        this.nextArrow = null;
        this.gridItemsArray = [];
        
        this.createCarouselElements();
        this.setupEventListeners();
    }
    
    createCarouselElements() {
        const body = document.body;
        
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
        
        // Append elements to DOM
        this.carouselContainer.appendChild(this.imageContainer);
        this.carouselContainer.appendChild(this.prevArrow);
        this.carouselContainer.appendChild(this.nextArrow);
        this.overlay.appendChild(this.carouselContainer);
        body.appendChild(this.overlay);
    }
    
    setupEventListeners() {
        // Close carousel when clicking overlay (but not on image or navigation)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Navigation buttons
        this.prevArrow.addEventListener('click', () => this.showPrev());
        this.nextArrow.addEventListener('click', () => this.showNext());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.overlay.style.display || this.overlay.style.display === 'none') return;
            
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'ArrowLeft') {
                this.showPrev();
            } else if (e.key === 'ArrowRight') {
                this.showNext();
            }
        });
    }
    
    setGridItems(gridItems) {
        this.gridItemsArray = Array.from(gridItems);
    }
    
    open(index) {
        if (index < 0 || index >= this.gridItemsArray.length) return;
        
        this.currentIndex = index;
        this.showImage(this.currentIndex);
        
        // Display overlay with animation
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);
        
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        // Animate opacity before hiding
        this.overlay.style.opacity = '0';
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.imageContainer.innerHTML = '';
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    showImage(index) {
        // Clear current image
        this.imageContainer.innerHTML = '';
        
        // Get the grid item
        const gridItem = this.gridItemsArray[index];
        if (!gridItem) return;
        
        // Create a clone of the image or video
        let mediaElement;
        const originalImg = gridItem.querySelector('img');
        const originalVideo = gridItem.querySelector('video');
        
        if (originalImg) {
            mediaElement = document.createElement('img');
            mediaElement.src = originalImg.src;
            mediaElement.alt = originalImg.alt || 'Image';
            mediaElement.className = 'carousel-image';
        } else if (originalVideo) {
            mediaElement = document.createElement('video');
            mediaElement.autoplay = true;
            mediaElement.loop = true;
            mediaElement.muted = true;
            mediaElement.playsInline = true;
            mediaElement.className = 'carousel-image';
            
            // Clone video source
            const originalSource = originalVideo.querySelector('source');
            if (originalSource) {
                const source = document.createElement('source');
                source.src = originalSource.src;
                source.type = originalSource.type;
                mediaElement.appendChild(source);
            }
        }
        
        if (mediaElement) {
            this.imageContainer.appendChild(mediaElement);
        }
        
        // Update navigation visibility
        this.updateNavigationVisibility();
    }
    
    showNext() {
        if (this.currentIndex < this.gridItemsArray.length - 1) {
            this.currentIndex++;
            this.showImage(this.currentIndex);
        }
    }
    
    showPrev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showImage(this.currentIndex);
        }
    }
    
    updateNavigationVisibility() {
        // Show/hide prev arrow based on current index
        this.prevArrow.style.visibility = this.currentIndex > 0 ? 'visible' : 'hidden';
        
        // Show/hide next arrow based on current index
        this.nextArrow.style.visibility = 
            this.currentIndex < this.gridItemsArray.length - 1 ? 'visible' : 'hidden';
    }
}
