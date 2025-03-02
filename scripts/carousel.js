/**
 * Carousel for grid items on mobile
 * Enables smooth, iOS-style swiping between images in a full-screen view
 */
class GridItemCarousel {
    constructor() {
        this.currentIndex = 0;
        this.carousel = document.querySelector('.carousel');
        this.carouselDots = document.querySelector('.carousel-dots');
        this.overlay = document.querySelector('.overlay');
        this.bottomSheet = document.querySelector('.bottom-sheet');
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

        // Setup carousel
        this.setupCarousel();
        this.setupDots();

        // Show the bottom sheet
        this.bottomSheet.classList.add('open');

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
        // Hide the overlay and bottom sheet
        this.overlay.classList.remove('visible');
        this.bottomSheet.classList.remove('open');

        // Allow scrolling again
        document.body.classList.remove('no-scroll');

        this.isOpen = false;
    }
}

// Initialize carousel when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create carousel instance
    const gridCarousel = new GridItemCarousel();

    // Make it available globally for access from grid items
    window.gridCarousel = gridCarousel;

    // Set up click handlers for grid items if on mobile
    if (window.matchMedia('(max-width: 788px)').matches) {
        const setupGridItemClickHandlers = () => {
            const gridItems = document.querySelectorAll('.grid-item');
            if (gridItems.length > 0) {
                gridItems.forEach((item, index) => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (window.gridCarousel) {
                            window.gridCarousel.open(gridItems, index);
                        }
                    });
                });
            } else {
                // If grid items aren't loaded yet, try again shortly
                setTimeout(setupGridItemClickHandlers, 500);
            }
        };

        setupGridItemClickHandlers();
    }
    //Check if we're on mobile
    const isMobile = window.matchMedia('(max-width: 788px)').matches;

    //If on mobile, we'll let hover-mobile.js handle the grid carousel
    if (isMobile) {
        return; // Exit early, mobile carousel is handled by GridCarousel in hover-mobile.js
    }

    //Desktop implementation - only runs on larger screens
    // Set up click handlers for grid items
    const gridItems = document.querySelectorAll('.grid-item');

    gridItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openCarousel(index);
        });
    });

    // Create carousel elements
    const body = document.body;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'carousel-overlay';
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeCarousel();
        }
    });

    // Create carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';

    // Create navigation arrows
    const prevArrow = document.createElement('button');
    prevArrow.className = 'carousel-nav prev';
    prevArrow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
        </svg>
    `;
    prevArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        showPreviousImage();
    });

    const nextArrow = document.createElement('button');
    nextArrow.className = 'carousel-nav next';
    nextArrow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5l7 7-7 7"></path>
        </svg>
    `;
    nextArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        showNextImage();
    });

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'carousel-image-container';

    // Append all elements
    carouselContainer.appendChild(prevArrow);
    carouselContainer.appendChild(imageContainer);
    carouselContainer.appendChild(nextArrow);

    overlay.appendChild(carouselContainer);
    body.appendChild(overlay);

    // Track current image index
    let currentIndex = 0;
    let gridItemsArray = Array.from(gridItems);

    // Function to open carousel
    function openCarousel(index) {
        currentIndex = index;

        // Clear previous images
        imageContainer.innerHTML = '';

        // Get all image sources
        const imageSources = [];
        gridItemsArray.forEach(item => {
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

        // Load current image
        loadImage(currentIndex, imageSources);

        // Show overlay
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);

        // Add keyboard navigation
        document.addEventListener('keydown', handleKeyDown);
    }

    // Function to close carousel
    function closeCarousel() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            imageContainer.innerHTML = '';
        }, 300);

        // Remove keyboard navigation
        document.removeEventListener('keydown', handleKeyDown);
    }

    // Function to load image
    function loadImage(index, sources) {
        if (index < 0 || index >= sources.length) return;

        imageContainer.innerHTML = '';

        const source = sources[index];

        if (source.type === 'image') {
            const img = document.createElement('img');
            img.src = source.src;
            img.alt = source.alt;
            img.className = 'carousel-image';
            imageContainer.appendChild(img);
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
            imageContainer.appendChild(video);
        }
    }

    // Function to show next image
    function showNextImage() {
        const sources = getImageSources();
        currentIndex = (currentIndex + 1) % sources.length;
        loadImage(currentIndex, sources);
    }

    // Function to show previous image
    function showPreviousImage() {
        const sources = getImageSources();
        currentIndex = (currentIndex - 1 + sources.length) % sources.length;
        loadImage(currentIndex, sources);
    }

    // Function to get all image sources
    function getImageSources() {
        const imageSources = [];
        gridItemsArray.forEach(item => {
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

    // Handle keyboard navigation
    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        } else if (e.key === 'Escape') {
            closeCarousel();
        }
    }
});