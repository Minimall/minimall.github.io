// Mobile-specific functionality for image viewing with iOS-style animations
class BottomSheet {
    constructor() {
        this.overlay = document.querySelector('.overlay');
        this.isOpen = false;
        this.centeredContainer = null;
        this.activeSwiper = null;

        // Early return if overlay doesn't exist
        if (!this.overlay) {
            console.log('BottomSheet elements not found in DOM');
            return;
        }

        this.setupTriggers();

        // Initialize global rotation counter if not exists
        if (typeof window.rotationCounter === 'undefined') {
            window.rotationCounter = 0;
        }

        this.overlay.addEventListener('click', () => this.close());
    }

    setupTriggers() {
        // Safety check - if overlay doesn't exist, don't set up triggers
        if (!this.overlay) return;

        document.querySelectorAll('[data-images]').forEach(element => {
            element.addEventListener('click', (e) => {
                if (window.matchMedia('(max-width: 788px)').matches) {
                    e.preventDefault();
                    const images = element.dataset.images?.split(',') || [];
                    if (images.length > 0) {
                        this.showImageGallery(images);
                    }
                }
            });
        });
    }

    showImageGallery(images, startIndex = 0) {
        if (this.isOpen) return;
        this.isOpen = true;

        // Store current scroll position without changing the page position
        this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        // Get rotation with slight randomness for natural feel
        const baseRotation = ((window.rotationCounter % 2 === 0) ? 1.5 : -1.5);
        const randomOffset = (Math.random() * 0.5) - 0.25; // Random value between -0.25 and 0.25
        const rotation = baseRotation + randomOffset;
        window.rotationCounter++;

        // Create overlay and prevent scrolling
        document.body.classList.add('no-scroll');
        this.overlay.classList.add('visible');

        // Create centered container for our gallery
        const centeredContainer = document.createElement('div');
        centeredContainer.className = 'centered-image-container';
        document.body.appendChild(centeredContainer);

        // Create the swiper container
        const swiperContainer = document.createElement('div');
        swiperContainer.className = 'ios-swiper';
        centeredContainer.appendChild(swiperContainer);

        // Create dots container
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'carousel-dots sticky-dots';
        centeredContainer.appendChild(dotsContainer);

        // Create swiper instance with optional startIndex
        const swiper = new IOSStyleSwiper(swiperContainer, images, rotation, dotsContainer, startIndex);
        this.activeSwiper = swiper;

        // Add tap handler to close when tapping anywhere (except on active image and dots)
        centeredContainer.addEventListener('click', (e) => {
            // Check if the click is directly on the container or overlay elements
            // but not on the active image or dots
            const isOnImage = e.target.closest('.ios-swiper-image.active');
            const isOnDot = e.target.closest('.dot');
            
            if (!isOnImage && !isOnDot) {
                this.close();
            }
        });

        this.centeredContainer = centeredContainer;
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        document.body.classList.remove('no-scroll');

        // Begin smooth animated closing sequence
        if (this.activeSwiper) {
            this.activeSwiper.animateClose(() => {
                // After image animation completes, fade out overlay
                this.overlay.classList.remove('visible');

                // Remove container after all animations complete
                setTimeout(() => {
                    if (this.centeredContainer) {
                        this.centeredContainer.remove();
                        this.centeredContainer = null;
                    }
                    this.activeSwiper = null;
                }, 300);
            });
        } else {
            // Fallback if swiper isn't available
            this.overlay.classList.remove('visible');
            if (this.centeredContainer) {
                this.centeredContainer.remove();
                this.centeredContainer = null;
            }
        }
    }
}

// iOS-style swiper with spring physics and momentum
class IOSStyleSwiper {
    constructor(container, imageUrls, rotation, dotsContainer, startIndex = 0) {
        this.container = container;
        this.imageUrls = imageUrls;
        this.rotation = rotation;
        this.dotsContainer = dotsContainer;
        this.currentIndex = startIndex;
        this.imageElements = [];
        this.panStartX = 0;
        this.currentX = 0;
        this.startTime = 0;
        this.isAnimating = false;
        this.isSwiping = false;
        this.containerWidth = this.container.clientWidth || window.innerWidth;

        this.setupImages();
        this.setupDots();
        this.setupTouchEvents();
        this.animateInitialImage();
    }

    setupImages() {
        // Create wrapper for better positioning
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'ios-swiper-wrapper';
        this.container.appendChild(this.wrapper);

        // Set container style for proper layout
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '70vh';
        this.container.style.overflow = 'hidden';

        // Set wrapper style
        this.wrapper.style.display = 'flex';
        this.wrapper.style.height = '100%';
        this.wrapper.style.width = '100%';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.alignItems = 'center';
        this.wrapper.style.justifyContent = 'center';

        // Create all image elements
        this.imageUrls.forEach((url, index) => {
            const img = document.createElement('img');
            img.className = 'ios-swiper-image';
            const imgPath = `/images/${url}`;

            // Set image type
            if (url.endsWith('.webp')) {
                img.type = 'image/webp';
            } else if (url.endsWith('.avif')) {
                img.type = 'image/avif';
            }

            img.src = imgPath;
            img.setAttribute('data-index', index);
            img.style.setProperty('--rotation', `${this.rotation}deg`);

            // Initial state - scaled down and hidden
            img.style.opacity = '0';
            img.style.transform = 'rotate(0deg) scale(0)';
            img.style.position = 'absolute';
            img.style.maxWidth = '90%';
            img.style.maxHeight = '90%';
            img.style.transition = 'transform 0s, opacity 0s';
            img.style.willChange = 'transform, opacity';
            img.style.transformOrigin = 'center center';
            img.style.pointerEvents = 'none';

            this.wrapper.appendChild(img);
            this.imageElements.push(img);
        });
    }

    setupDots() {
        // Don't show dots for a single image
        if (this.imageUrls.length <= 1) {
            this.dotsContainer.style.display = 'none';
            return;
        }

        this.dotsContainer.innerHTML = '';

        // Create dot for each image
        this.imageUrls.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'dot' + (index === 0 ? ' active' : '');
            dot.addEventListener('click', () => {
                this.goToSlide(index);
            });
            this.dotsContainer.appendChild(dot);
        });
    }

    animateInitialImage() {
        // Delayed to ensure overlay is visible first
        setTimeout(() => {
            const img = this.imageElements[this.currentIndex];
            if (!img) return;

            // Apply smooth transition for initial appearance
            img.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease';
            img.style.opacity = '1';
            img.style.transform = `rotate(${this.rotation}deg) scale(1)`;
            img.classList.add('active');
            
            // Update dots to match initial image
            this.updateDots();
        }, 100);
    }

    setupTouchEvents() {
        // Touch start
        this.container.addEventListener('touchstart', (e) => {
            if (this.isAnimating) return;
            this.handleTouchStart(e.touches[0].clientX);
        }, { passive: true });

        // Mouse down (for testing on desktop)
        this.container.addEventListener('mousedown', (e) => {
            if (this.isAnimating) return;
            this.handleTouchStart(e.clientX);

            // Add mouse move/up listeners
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        });

        // Touch move
        this.container.addEventListener('touchmove', (e) => {
            if (!this.isSwiping) return;
            this.handleTouchMove(e.touches[0].clientX);
        }, { passive: true });

        // Touch end
        this.container.addEventListener('touchend', () => {
            if (!this.isSwiping) return;
            this.handleTouchEnd();
        });

        // Mouse move
        this.handleMouseMove = (e) => {
            if (!this.isSwiping) return;
            this.handleTouchMove(e.clientX);
        };

        // Mouse up
        this.handleMouseUp = () => {
            if (!this.isSwiping) return;
            this.handleTouchEnd();

            // Remove mouse listeners
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        };
    }

    handleTouchStart(clientX) {
        this.isSwiping = true;
        this.panStartX = clientX;
        this.currentX = clientX;
        this.startTime = Date.now();

        // Stop any ongoing CSS transitions
        this.imageElements.forEach(img => {
            img.style.transition = 'none';
        });
    }

    handleTouchMove(clientX) {
        if (!this.isSwiping) return;

        this.currentX = clientX;
        const deltaX = this.currentX - this.panStartX;

        // Should we allow movement in this direction?
        const allowMovement = !(
            (this.currentIndex === 0 && deltaX > 0) || 
            (this.currentIndex === this.imageElements.length - 1 && deltaX < 0)
        );

        // Calculate effective delta with resistance at edges
        const effectiveDelta = allowMovement 
            ? deltaX 
            : deltaX * 0.2; // Add resistance at edges

        this.updateImagesPosition(effectiveDelta);
    }

    handleTouchEnd() {
        if (!this.isSwiping) return;
        this.isSwiping = false;

        const deltaX = this.currentX - this.panStartX;
        const duration = Date.now() - this.startTime;
        const velocity = deltaX / duration; // pixels per ms

        // Determine if we should change slide based on velocity and distance
        const minVelocityToSlide = 0.5; // pixels per ms
        const minDistanceToSlide = this.containerWidth * 0.3; // 30% of container width

        if (Math.abs(velocity) > minVelocityToSlide || Math.abs(deltaX) > minDistanceToSlide) {
            // Direction is based on delta
            const goNext = deltaX < 0;

            // Calculate target index
            const targetIndex = goNext 
                ? Math.min(this.imageElements.length - 1, this.currentIndex + 1)
                : Math.max(0, this.currentIndex - 1);

            // Only change if different
            if (targetIndex !== this.currentIndex) {
                this.goToSlide(targetIndex, Math.abs(velocity));
            } else {
                // Snap back to current slide
                this.resetPosition();
            }
        } else {
            // Small movement, snap back
            this.resetPosition();
        }
    }

    updateImagesPosition(deltaX) {
        this.imageElements.forEach((img, index) => {
            if (index === this.currentIndex) {
                // Current image follows finger with rotation
                const rotationAdjustment = deltaX * 0.02; // Slight rotation based on movement
                img.style.transform = `translateX(${deltaX}px) rotate(${this.rotation + rotationAdjustment}deg) scale(1)`;
            } else if (index === this.currentIndex - 1 && deltaX > 0) {
                // Previous image slides in from left
                const progress = Math.min(1, deltaX / this.containerWidth);
                const slideInX = -this.containerWidth + (deltaX * 1.1); // Slightly faster than finger
                const scale = 0.8 + (progress * 0.2);
                const opacity = Math.min(1, progress * 1.2);
                img.style.transform = `translateX(${slideInX}px) rotate(${this.rotation}deg) scale(${scale})`;
                img.style.opacity = opacity.toString();
            } else if (index === this.currentIndex + 1 && deltaX < 0) {
                // Next image slides in from right
                const progress = Math.min(1, Math.abs(deltaX) / this.containerWidth);
                const slideInX = this.containerWidth + (deltaX * 1.1); // Slightly faster than finger
                const scale = 0.8 + (progress * 0.2);
                const opacity = Math.min(1, progress * 1.2);
                img.style.transform = `translateX(${slideInX}px) rotate(${this.rotation}deg) scale(${scale})`;
                img.style.opacity = opacity.toString();
            } else {
                // Hide other images
                img.style.opacity = '0';
                img.style.transform = `translateX(${index < this.currentIndex ? -this.containerWidth : this.containerWidth}px) rotate(0deg) scale(0.8)`;
            }
        });
    }

    resetPosition() {
        this.isAnimating = true;

        // Apply spring-like animation for current image
        const currentImg = this.imageElements[this.currentIndex];
        if (currentImg) {
            currentImg.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease';
            currentImg.style.opacity = '1';
            currentImg.style.transform = `rotate(${this.rotation}deg) scale(1)`;
        }

        // Hide other images with animation
        this.imageElements.forEach((img, index) => {
            if (index !== this.currentIndex) {
                img.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease';
                img.style.opacity = '0';
                img.style.transform = `translateX(${index < this.currentIndex ? -this.containerWidth : this.containerWidth}px) rotate(0deg) scale(0.8)`;
            }
        });

        // Reset after animation completes
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }

    goToSlide(index, velocity = 0) {
        if (index < 0 || index >= this.imageElements.length || index === this.currentIndex) return;

        this.isAnimating = true;

        // Determine direction for nicer animation
        const goingRight = index > this.currentIndex;

        // Calculate spring tension based on velocity
        const baseDuration = 0.5; // base duration in seconds
        const velocityFactor = Math.min(0.3, velocity * 0.1); // cap the velocity influence
        const duration = Math.max(0.3, baseDuration - velocityFactor); // faster for higher velocity, min 0.3s

        // Move current image out
        const currentImg = this.imageElements[this.currentIndex];
        if (currentImg) {
            currentImg.style.transition = `transform ${duration}s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease`;
            currentImg.style.opacity = '0';
            currentImg.style.transform = `translateX(${goingRight ? -this.containerWidth : this.containerWidth}px) rotate(${this.rotation}deg) scale(0.8)`;
            currentImg.classList.remove('active');
        }

        // Move new image in
        const newImg = this.imageElements[index];
        if (newImg) {
            // Start position
            newImg.style.transition = 'none';
            newImg.style.opacity = '0';
            newImg.style.transform = `translateX(${goingRight ? this.containerWidth : -this.containerWidth}px) rotate(${this.rotation}deg) scale(0.8)`;

            // Force reflow to ensure the starting position is applied
            void newImg.offsetWidth;

            // Animate to center
            newImg.style.transition = `transform ${duration}s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease`;
            newImg.style.opacity = '1';
            newImg.style.transform = `rotate(${this.rotation}deg) scale(1)`;
            newImg.classList.add('active');
        }

        // Update index and dots
        this.currentIndex = index;
        this.updateDots();

        // Reset after animation completes
        setTimeout(() => {
            this.isAnimating = false;
        }, duration * 1000);
    }

    updateDots() {
        // Update dots to match current index
        const dots = this.dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    animateClose(callback) {
        // Find the currently visible/active image
        const activeImage = this.imageElements.find(img => img.classList.contains('active')) || this.imageElements[this.currentIndex];

        if (activeImage) {
            // Animate the active image to close
            activeImage.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease';
            activeImage.style.transform = 'rotate(0deg) scale(0)';
            activeImage.style.opacity = '0';

            // Hide all other images immediately
            this.imageElements.forEach(img => {
                if (img !== activeImage) {
                    img.style.transition = 'opacity 0.25s ease';
                    img.style.opacity = '0';
                }
            });

            // Execute callback after animation completes
            setTimeout(callback, 500);
        } else {
            // Fallback if no active image is found
            this.imageElements.forEach(img => {
                img.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease';
                img.style.transform = 'rotate(0deg) scale(0)';
                img.style.opacity = '0';
            });

            setTimeout(callback, 500);
        }
    }
}

// Initialize mobile functionality
document.addEventListener("DOMContentLoaded", () => {
    // Global rotation counter for image animations
    if (typeof window.rotationCounter === 'undefined') {
        window.rotationCounter = 0;
    }

    // Initialize BottomSheet for mobile devices
    if (window.matchMedia('(max-width: 788px)').matches) {
        new BottomSheet();
        
        // Initialize grid carousel for elements.html
        const gridItems = document.querySelectorAll('.grid-item');
        if (gridItems.length > 0) {
            new GridCarousel(gridItems);
        }
    }
});

// GridCarousel for elements.html on mobile
class GridCarousel {
    constructor(gridItems) {
        this.gridItems = Array.from(gridItems);
        this.overlay = document.querySelector('.overlay');
        this.bottomSheet = new BottomSheet(); // Reuse the BottomSheet class
        
        // If overlay doesn't exist, create it
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'overlay';
            document.body.appendChild(this.overlay);
        }
        
        this.setupGridItems();
    }
    
    setupGridItems() {
        this.gridItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                if (window.matchMedia('(max-width: 788px)').matches) {
                    this.showGridCarousel(index);
                }
            });
        });
    }
    
    showGridCarousel(startIndex) {
        // Prepare image sources from grid items
        const images = this.gridItems.map(item => {
            const img = item.querySelector('img');
            const video = item.querySelector('video');
            
            if (img) {
                // Get relative path from src
                const srcPath = img.src.split('/').slice(-1)[0];
                return srcPath;
            } else if (video) {
                // For videos, use a placeholder or thumbnail
                const srcPath = video.poster || 'video-placeholder.jpg';
                return srcPath;
            }
            
            return null;
        }).filter(src => src !== null);
        
        // Use the BottomSheet to show the carousel
        this.bottomSheet.showImageGallery(images, startIndex);
    }
}

// Export functionality
window.hoverMobile = {
    BottomSheet,
    GridCarousel
};