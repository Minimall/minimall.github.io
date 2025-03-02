
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
        
        // Create image container
        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'carousel-image-container';
        
        // Append all elements
        this.carouselContainer.appendChild(this.prevArrow);
        this.carouselContainer.appendChild(this.imageContainer);
        this.carouselContainer.appendChild(this.nextArrow);
        
        this.overlay.appendChild(this.carouselContainer);
        body.appendChild(this.overlay);
    }
    
    setupEventListeners() {
        // Close when clicking overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Navigation arrow listeners
        this.prevArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPreviousImage();
        });
        
        this.nextArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNextImage();
        });
    }
    
    setGridItems(gridItems) {
        this.gridItemsArray = Array.from(gridItems);
    }
    
    open(index) {
        this.currentIndex = index;
        
        // Clear previous images
        this.imageContainer.innerHTML = '';
        
        // Get all image sources
        const imageSources = this.getImageSources();
        
        // Load current image
        this.loadImage(this.currentIndex, imageSources);
        
        // Show overlay
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);
        
        // Add keyboard navigation
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    close() {
        this.overlay.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.imageContainer.innerHTML = '';
        }, 300);
        
        // Remove keyboard navigation
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    loadImage(index, sources) {
        if (index < 0 || index >= sources.length) return;
        
        this.imageContainer.innerHTML = '';
        
        const source = sources[index];
        
        if (source.type === 'image') {
            const img = document.createElement('img');
            img.src = source.src;
            img.alt = source.alt;
            img.className = 'carousel-image';
            this.imageContainer.appendChild(img);
        } else if (source.type === 'video') {
            const video = document.createElement('video');
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.controls = true;
            video.className = 'carousel-image';
            
            const sourceEl = document.createElement('source');
            sourceEl.src = source.src;
            sourceEl.type = 'video/mp4';
            
            video.appendChild(sourceEl);
            this.imageContainer.appendChild(video);
        }
    }
    
    showNextImage() {
        const sources = this.getImageSources();
        this.currentIndex = (this.currentIndex + 1) % sources.length;
        this.loadImage(this.currentIndex, sources);
    }
    
    showPreviousImage() {
        const sources = this.getImageSources();
        this.currentIndex = (this.currentIndex - 1 + sources.length) % sources.length;
        this.loadImage(this.currentIndex, sources);
    }
    
    getImageSources() {
        const imageSources = [];
        this.gridItemsArray.forEach(item => {
            const img = item.querySelector('img');
            const video = item.querySelector('video');
            
            if (img) {
                imageSources.push({
                    type: 'image',
                    src: img.src,
                    alt: img.alt
                });
            } else if (video) {
                imageSources.push({
                    type: 'video',
                    src: video.querySelector('source').src,
                    alt: 'Video'
                });
            }
        });
        return imageSources;
    }
    
    handleKeyDown(e) {
        if (e.key === 'ArrowLeft') {
            this.showPreviousImage();
        } else if (e.key === 'ArrowRight') {
            this.showNextImage();
        } else if (e.key === 'Escape') {
            this.close();
        }
    }
}

// Export for use in main carousel.js
window.DesktopCarousel = DesktopCarousel;
