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
        this.enableLooping = false; // Will be set to true for elements.html

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

        // Determine if we should allow full movement or add resistance
        let allowMovement = true;

        // If looping is not enabled, add resistance at edges
        if (!this.enableLooping) {
            allowMovement = !(
                (this.currentIndex === 0 && deltaX > 0) || 
                (this.currentIndex === this.imageElements.length - 1 && deltaX < 0)
            );
        }

        // Calculate effective delta with resistance at edges if needed
        const effectiveDelta = allowMovement 
            ? deltaX 
            : deltaX * 0.2; // Add resistance at edges when not looping

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
        const totalImages = this.imageElements.length;

        if (Math.abs(velocity) > minVelocityToSlide || Math.abs(deltaX) > minDistanceToSlide) {
            // Direction is based on delta
            const goNext = deltaX < 0;

            // Calculate target index with looping
            let targetIndex;
            if (goNext) {
                targetIndex = this.currentIndex + 1;
                if (targetIndex >= totalImages) targetIndex = 0; // Loop to first image
            } else {
                targetIndex = this.currentIndex - 1;
                if (targetIndex < 0) targetIndex = totalImages - 1; // Loop to last image
            }

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
        const totalImages = this.imageElements.length;
        if (totalImages <= 1) return;

        this.imageElements.forEach((img, index) => {
            if (index === this.currentIndex) {
                // Current image follows finger with rotation
                const rotationAdjustment = deltaX * 0.02; // Slight rotation based on movement
                img.style.transform = `translateX(${deltaX}px) rotate(${this.rotation + rotationAdjustment}deg) scale(1)`;
            } else if ((index === this.currentIndex - 1 || (this.currentIndex === 0 && index === totalImages - 1)) && deltaX > 0) {
                // Previous image slides in from left (with looping support)
                const progress = Math.min(1, deltaX / this.containerWidth);
                const slideInX = -this.containerWidth + (deltaX * 1.1); // Slightly faster than finger
                const scale = 0.8 + (progress * 0.2);
                const opacity = Math.min(1, progress * 1.2);
                img.style.transform = `translateX(${slideInX}px) rotate(${this.rotation}deg) scale(${scale})`;
                img.style.opacity = opacity.toString();
            } else if ((index === this.currentIndex + 1 || (this.currentIndex === totalImages - 1 && index === 0)) && deltaX < 0) {
                // Next image slides in from right (with looping support)
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
        if (index === this.currentIndex) return;
        if (index < 0 || index >= this.imageElements.length) {
            // Handle out of bounds indexes for looping
            index = index < 0 ? this.imageElements.length - 1 : 0;
        }

        this.isAnimating = true;

        // For looping animation, we need to determine if we're going from
        // first to last or last to first for special case handling
        const totalImages = this.imageElements.length;
        const isLoopingForward = this.currentIndex === totalImages - 1 && index === 0;
        const isLoopingBackward = this.currentIndex === 0 && index === totalImages - 1;

        // Standard case: determine direction based on index comparison
        let goingRight = index > this.currentIndex;

        // Special cases for looping
        if (isLoopingForward) goingRight = true;
        if (isLoopingBackward) goingRight = false;

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
    console.log("Mobile init started");
    // Global rotation counter for image animations
    if (typeof window.rotationCounter === 'undefined') {
        window.rotationCounter = 0;
    }

    // Initialize BottomSheet for mobile devices
    if (window.matchMedia('(max-width: 788px)').matches) {
        console.log("Mobile detected");

        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
        }

        // Create and initialize bottom sheet
        const bottomSheet = new BottomSheet();

        // Make sure bottomSheet.overlay is set
        if (bottomSheet && !bottomSheet.overlay) {
            bottomSheet.overlay = overlay;
        }

        // Initialize grid carousel for elements.html
        const gridItems = document.querySelectorAll('.grid-item');
        if (gridItems.length > 0) {
            console.log("Grid items found:", gridItems.length);
            // Initialize immediately to set up click handlers
            window.gridCarousel = new GridCarousel(gridItems, bottomSheet);

            // Make sure grid items are clickable
            gridItems.forEach((item, index) => {
                try {
                    item.style.cursor = 'pointer';
                    item.style.webkitTapHighlightColor = 'transparent';

                    // Force remove any existing listeners by cloning
                    const newItem = item.cloneNode(true);
                    item.parentNode.replaceChild(newItem, item);

                    // Add click event directly with error handling
                    newItem.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Grid item clicked:", index);
                        try {
                            if (window.gridCarousel) {
                                window.gridCarousel.showGridCarousel(index);
                            } else {
                                console.error("Grid carousel not initialized");
                            }
                        } catch (err) {
                            console.error("Error showing grid carousel:", err);
                        }
                    }, false);
                } catch (err) {
                    console.error("Error setting up grid item:", err);
                }
            });
        }
    }
});

// GridCarousel for elements.html on mobile
class GridCarousel {
    constructor(gridItems, bottomSheet = null) {
        this.gridItems = Array.from(gridItems);
        this.overlay = document.querySelector('.overlay');

        // Use provided bottomSheet or create a new one
        this.bottomSheet = bottomSheet || new BottomSheet();

        // If overlay doesn't exist, create it
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'overlay';
            document.body.appendChild(this.overlay);
        }

        // Make sure bottomSheet.overlay is set properly
        if (this.bottomSheet && !this.bottomSheet.overlay) {
            this.bottomSheet.overlay = this.overlay;
        }

        console.log("GridCarousel initialized with", this.gridItems.length, "items");
    }

    // We now handle this directly in the document.DOMContentLoaded
    // to avoid issues with event binding

    showGridCarousel(startIndex) {
        console.log('Showing grid carousel for index:', startIndex);

        // Debug the elements we're working with
        console.log('Bottom sheet available:', !!this.bottomSheet);
        console.log('Grid items count:', this.gridItems.length);

        // Prepare image sources from grid items
        const images = this.gridItems.map((item, index) => {
            console.log(`Processing grid item ${index}`);
            const img = item.querySelector('img');
            const video = item.querySelector('video');

            if (img) {
                console.log(`Item ${index} has image:`, img.src);
                // Extract just the filename from the full path
                const fullPath = img.src;
                let filename;

                // Fix for URL path, make sure we're getting a valid filename
                try {
                    const url = new URL(fullPath);
                    const pathParts = url.pathname.split('/');
                    filename = pathParts[pathParts.length - 1];

                    // Skip me.avif images
                    if (filename === 'me.avif') {
                        console.log('Skipping me.avif image');
                        return null;
                    }

                    // Check if image is from the drafts directory
                    if (url.pathname.includes('/drafts/')) {
                        filename = 'drafts/' + filename;
                    }
                } catch (e) {
                    // Fallback to simple substring if URL parsing fails
                    console.log('URL parsing failed, using substring method');
                    filename = fullPath.substring(fullPath.lastIndexOf('/') + 1);

                    // Skip me.avif images
                    if (filename === 'me.avif') {
                        console.log('Skipping me.avif image');
                        return null;
                    }

                    // Check if path contains drafts
                    if (fullPath.includes('/drafts/')) {
                        filename = 'drafts/' + filename;
                    }
                }

                console.log(`Extracted filename: ${filename}`);
                return filename;
            } else if (video) {
                console.log(`Item ${index} has video`);
                // For videos, use a special identifier to mark this as a video slide
                const videoSource = video.querySelector('source');
                if (videoSource) {
                    // Create a special filename marker for videos
                    console.log('Found video source:', videoSource.src);
                    // Extract just the filename for videos
                    const videoPath = videoSource.src;
                    let videoFilename = videoPath.substring(videoPath.lastIndexOf('/') + 1);

                    // Use a placeholder image instead of a video (videos will be skipped)
                    return null;
                }
                // Skip if no source is found
                return null;
            }

            console.log(`Item ${index} has no media`);
            return null;
        }).filter(src => src !== null);

        console.log('Collected image sources:', images);

        // Check if we're on elements.html to enable looping
        const isElementsPage = window.location.pathname.includes('elements.html');

        // Use the BottomSheet to show the carousel
        if (isElementsPage) {
            // For elements.html, we want to use looped carousel
            this.showLoopedImageGallery(images, startIndex);
        } else {
            // For other pages, use the regular gallery
            this.bottomSheet.showImageGallery(images, startIndex);
        }
    }

    // Modified method specifically for elements.html to enable looping
    showLoopedImageGallery(images, startIndex) {
        // Check if we have a valid bottomSheet and it's not already open
        if (!this.bottomSheet || this.bottomSheet.isOpen) return;
        this.bottomSheet.isOpen = true;

        // Store current scroll position without changing the page position
        this.bottomSheet.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        // Get rotation with slight randomness for natural feel
        const baseRotation = ((window.rotationCounter % 2 === 0) ? 1.5 : -1.5);
        const randomOffset = (Math.random() * 0.5) - 0.25; // Random value between -0.25 and 0.25
        const rotation = baseRotation + randomOffset;
        window.rotationCounter++;

        // Create overlay and prevent scrolling
        document.body.classList.add('no-scroll');

        // Make sure overlay exists before trying to use it
        if (!this.bottomSheet.overlay) {
            this.bottomSheet.overlay = document.querySelector('.overlay');
            // If overlay still doesn't exist, create it
            if (!this.bottomSheet.overlay) {
                this.bottomSheet.overlay = document.createElement('div');
                this.bottomSheet.overlay.className = 'overlay';
                document.body.appendChild(this.bottomSheet.overlay);
            }
        }

        this.bottomSheet.overlay.classList.add('visible');

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

        // Create swiper instance with optional startIndex and enable looping
        const swiper = new IOSStyleSwiper(swiperContainer, images, rotation, dotsContainer, startIndex);
        swiper.enableLooping = true; // Enable looping for elements.html
        this.bottomSheet.activeSwiper = swiper;

        // Add tap handler to close when tapping anywhere (except on active image and dots)
        centeredContainer.addEventListener('click', (e) => {
            // Check if the click is directly on the container or overlay elements
            // but not on the active image or dots
            const isOnImage = e.target.closest('.ios-swiper-image.active');
            const isOnDot = e.target.closest('.dot');

            if (!isOnImage && !isOnDot) {
                this.bottomSheet.close();
            }
        });

        this.bottomSheet.centeredContainer = centeredContainer;
    }
}

// Export functionality
window.hoverMobile = {
    BottomSheet,
    GridCarousel
};