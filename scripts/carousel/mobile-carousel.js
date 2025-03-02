
/**
 * Mobile Carousel for grid items
 * Enables smooth, iOS-style swiping between images in a full-screen view for mobile devices
 */
class GridItemCarousel {
    constructor() {
        this.currentIndex = 0;
        this.carousel = document.createElement('div');
        this.carousel.className = 'carousel';
        this.carouselDots = document.createElement('div');
        this.carouselDots.className = 'carousel-dots';
        this.overlay = document.querySelector('.overlay');
        this.items = [];
        this.itemsData = [];
        this.isOpen = false;

        // Close when clicking overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
    }

    open(items, startIndex = 0) {
        if (!items || items.length === 0) return;

        this.isOpen = true;
        this.items = items;
        this.currentIndex = startIndex;

        // Create itemsData array
        this.itemsData = Array.from(items).map(item => {
            const img = item.querySelector('img');
            const video = item.querySelector('video');

            if (img) {
                return {
                    type: 'image',
                    src: img.src,
                    alt: img.alt || 'Grid image'
                };
            } else if (video) {
                const source = video.querySelector('source');
                return {
                    type: 'video',
                    src: source ? source.src : '',
                    type: source ? source.type : 'video/mp4'
                };
            }

            return null;
        }).filter(item => item !== null);

        // Show the overlay
        document.body.classList.add('no-scroll');
        this.overlay.classList.add('visible');

        // Create centered container for our gallery
        const centeredContainer = document.createElement('div');
        centeredContainer.className = 'centered-image-container';
        document.body.appendChild(centeredContainer);
        
        // Add the carousel and dots to the container
        centeredContainer.appendChild(this.carousel);
        centeredContainer.appendChild(this.carouselDots);
        
        // Store the container for cleanup
        this.centeredContainer = centeredContainer;

        // Setup carousel
        this.setupCarousel();
        this.setupDots();

        // Go to the start index
        this.goToSlide(startIndex);
    }

    setupCarousel() {
        if (!this.carousel) return;

        this.carousel.innerHTML = '';

        this.itemsData.forEach((item, index) => {
            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.alt;
                img.classList.add('carousel-item');
                img.setAttribute('data-index', index);
                this.carousel.appendChild(img);
            } else if (item.type === 'video') {
                const video = document.createElement('video');
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.classList.add('carousel-item');
                video.setAttribute('data-index', index);

                const source = document.createElement('source');
                source.src = item.src;
                source.type = item.type;

                video.appendChild(source);
                this.carousel.appendChild(video);
            }
        });

        // Add swipe event listeners
        this.addSwipeEvents();
    }

    setupDots() {
        if (!this.carouselDots) return;

        this.carouselDots.innerHTML = '';

        // Don't show dots for single item
        if (this.itemsData.length <= 1) {
            this.carouselDots.style.display = 'none';
            return;
        }

        this.carouselDots.style.display = 'flex';

        this.itemsData.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === this.currentIndex) {
                dot.classList.add('active');
            }

            // Add click event to dot
            dot.addEventListener('click', () => {
                this.goToSlide(index);
            });

            this.carouselDots.appendChild(dot);
        });
    }

    addSwipeEvents() {
        if (!this.carousel) return;

        let touchStartX = 0;
        let touchEndX = 0;

        // Touch events
        this.carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        this.carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, {passive: true});

        // Mouse events (for testing on desktop)
        let mouseDown = false;
        this.carousel.addEventListener('mousedown', (e) => {
            mouseDown = true;
            touchStartX = e.screenX;
        });

        this.carousel.addEventListener('mouseup', (e) => {
            if (mouseDown) {
                touchEndX = e.screenX;
                this.handleSwipe(touchStartX, touchEndX);
                mouseDown = false;
            }
        });
    }

    handleSwipe(startX, endX) {
        const threshold = 50; // Minimum distance for a swipe

        if (startX - endX > threshold) {
            // Swipe Left -> Next slide
            this.next();
        } else if (endX - startX > threshold) {
            // Swipe Right -> Previous slide
            this.prev();
        }
    }

    goToSlide(index) {
        if (index < 0) {
            index = this.itemsData.length - 1; // Loop to last slide
        } else if (index >= this.itemsData.length) {
            index = 0; // Loop to first slide
        }

        this.currentIndex = index;

        // Update carousel items
        const items = this.carousel.querySelectorAll('.carousel-item');
        items.forEach((item, i) => {
            item.style.display = i === index ? 'block' : 'none';

            // Auto-play videos if visible
            if (i === index && item.tagName === 'VIDEO') {
                item.play();
            } else if (item.tagName === 'VIDEO') {
                item.pause();
            }
        });

        // Update dots
        const dots = this.carouselDots.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    next() {
        this.goToSlide(this.currentIndex + 1);
    }

    prev() {
        this.goToSlide(this.currentIndex - 1);
    }

    close() {
        // Hide the overlay
        this.overlay.classList.remove('visible');

        // Remove the centered container if it exists
        if (this.centeredContainer) {
            this.centeredContainer.remove();
        }

        // Allow scrolling again
        document.body.classList.remove('no-scroll');

        this.isOpen = false;
    }
}

// Export for use in main carousel.js
window.GridItemCarousel = GridItemCarousel;
