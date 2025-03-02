// Mobile-specific functionality for image viewing
class BottomSheet {
    constructor() {
        this.sheet = document.querySelector('.bottom-sheet');
        this.overlay = document.querySelector('.overlay');

        // Early return if elements don't exist
        if (!this.sheet || !this.overlay) {
            console.log('BottomSheet elements not found in DOM');
            return;
        }

        this.carousel = this.sheet.querySelector('.carousel');
        this.currentImageIndex = 0;
        this.setupGestures();
        this.setupTriggers();
        this.totalImages = 0;
        this.viewMode = 'drawer'; // 'drawer' or 'fullscreen'

        this.overlay.addEventListener('click', () => this.close());
    }

    setupGestures() {
        // Safety check - if sheet doesn't exist, don't set up gestures
        if (!this.sheet) return;

        let startY = 0;
        let startX = 0;
        this.isClosing = false;
        let isSwiping = false;

        const onStart = (e) => {
            this.isClosing = false;
            isSwiping = false;
            startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            document.addEventListener(e.type === 'mousedown' ? 'mousemove' : 'touchmove', onMove, { passive: false });
            document.addEventListener(e.type === 'mousedown' ? 'mouseup' : 'touchend', onEnd);
        };

        const onMove = (e) => {
            e.preventDefault(); // Prevent scrolling during swipe
            const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
            const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const diffY = currentY - startY;
            const diffX = currentX - startX;

            // Determine if the swipe is more horizontal or vertical
            if (Math.abs(diffX) > Math.abs(diffY) && this.totalImages > 1) {
                // Horizontal swipe for carousel
                isSwiping = true;
                if (Math.abs(diffX) > 30) { // Lower threshold for better response
                    if (diffX > 0 && this.currentImageIndex > 0) {
                        this.showImage(this.currentImageIndex - 1);
                        startX = currentX; // Reset for continuous swiping
                    } else if (diffX < 0 && this.currentImageIndex < this.totalImages - 1) {
                        this.showImage(this.currentImageIndex + 1);
                        startX = currentX; // Reset for continuous swiping
                    }
                }
            } else if (diffY > 70 && !this.isClosing && !isSwiping) {
                // Vertical swipe to close
                this.isClosing = true;
                this.close();
            }
        };

        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchend', onEnd);
        };

        this.sheet.addEventListener('mousedown', onStart);
        this.sheet.addEventListener('touchstart', onStart, { passive: false }); // Changed to non-passive for preventDefault
    }

    setupTriggers() {
        // Safety check - if sheet or overlay don't exist, don't set up triggers
        if (!this.sheet || !this.overlay) return;

        document.querySelectorAll('[data-images]').forEach(element => {
            element.addEventListener('click', (e) => {
                if (window.matchMedia('(max-width: 788px)').matches) {
                    e.preventDefault();
                    const images = element.dataset.images?.split(',') || [];
                    if (images.length > 0) {
                        // Show image directly in center of screen
                        this.showCenteredImage(images[0]);
                    }
                }
            });
        });
    }

    showCenteredImage(image) {
        // Get rotation similar to desktop but half the amount
        const rotation = ((window.rotationCounter % 2 === 0) ? 1.5 : -1.5);
        window.rotationCounter++;

        // Store current scroll position without changing the page position
        this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        // Create overlay and prevent scrolling without changing page position
        this.overlay.classList.add('visible');
        document.body.classList.add('no-scroll');

        // Get all images if this is part of an image set
        let images = [];
        let currentIndex = 0;

        // Check if image is from a set (data-images attribute)
        const triggerElements = document.querySelectorAll('[data-images]');
        for (const element of triggerElements) {
            const elementImages = element.dataset.images?.split(',') || [];
            if (elementImages.includes(image)) {
                images = elementImages;
                currentIndex = elementImages.indexOf(image);
                break;
            }
        }

        // If no set was found, use just this image
        if (images.length === 0) {
            images = [image];
        }

        // Create centered container
        const centeredContainer = document.createElement('div');
        centeredContainer.className = 'centered-image-container';
        document.body.appendChild(centeredContainer);

        // Create the image container to hold all images
        const imageContainer = document.createElement('div');
        imageContainer.className = 'carousel';
        centeredContainer.appendChild(imageContainer);

        // Add all images to the container
        images.forEach((img, index) => {
            const imgElement = document.createElement('img');
            const imgPath = `/images/${img}`;
            if (img.endsWith('.webp')) {
                imgElement.type = 'image/webp';
            } else if (img.endsWith('.avif')) {
                imgElement.type = 'image/avif';
            }
            imgElement.src = imgPath;
            imgElement.className = 'centered-image';
            
            // Set the rotation as a CSS variable
            imgElement.style.setProperty('--rotation', `${rotation}deg`);
            
            if (index !== currentIndex) {
                imgElement.style.transform = `translateX(${(index - currentIndex) * 100}%)`;
            }

            imageContainer.appendChild(imgElement);
        });

        // Setup dots for navigation if multiple images
        if (images.length > 1) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'carousel-dots sticky-dots';
            centeredContainer.appendChild(dotsContainer);

            for (let i = 0; i < images.length; i++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                if (i === currentIndex) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    this.showImageInContainer(imageContainer, i, currentIndex);
                    currentIndex = i;
                    dotsContainer.querySelectorAll('.dot').forEach((dot, idx) => {
                        dot.classList.toggle('active', idx === i);
                    });
                });
                dotsContainer.appendChild(dot);
            }
        }

        // Apply consistent animation for all images (single or multiple)
        const allImages = imageContainer.querySelectorAll('img');
        
        // Start with all images ready but hidden
        allImages.forEach(img => {
            img.style.opacity = '0';
            img.style.transform = 'rotate(0deg) scale(0)';
        });
        
        // Trigger animation for the current image with a slight delay after overlay appears
        setTimeout(() => {
            // Only animate the current image
            const currentImg = allImages[currentIndex];
            currentImg.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
            currentImg.style.transform = `rotate(${rotation}deg) scale(1)`;
            currentImg.style.opacity = '1';
            currentImg.classList.add('active');
        }, 200); // Consistent delay matching the overlay appearance timing

        // Add swipe gestures
        this.setupCenteredImageSwipe(imageContainer, centeredContainer, images, currentIndex);

        // Add tap handler to close
        centeredContainer.addEventListener('click', () => {
            this.closeCenteredImage(centeredContainer);
        });

        this.overlay.addEventListener('click', () => {
            this.closeCenteredImage(centeredContainer);
        });
        this.centeredContainer = centeredContainer; //Store for later removal
    }

    showImageInContainer(container, newIndex, oldIndex) {
        const images = container.querySelectorAll('img');
        const rotation = parseFloat(images[0].style.getPropertyValue('--rotation') || '1.5deg');

        // Ensure container is set up for proper centering
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.height = '100%';
        container.style.overflow = 'hidden'; // Ensure images don't overflow

        // Set up a wrapper for the images to ensure proper horizontal centering
        if (!container.querySelector('.image-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';
            wrapper.style.position = 'relative';

            // Move all images into the wrapper
            while (container.firstChild) {
                wrapper.appendChild(container.firstChild);
            }
            container.appendChild(wrapper);
        }

        // First hide the previously active image with scale animation
        const oldActiveImg = images[oldIndex];
        if (oldActiveImg && oldActiveImg.classList.contains('active')) {
            oldActiveImg.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
            oldActiveImg.style.transform = 'rotate(0deg) scale(0)';
            oldActiveImg.style.opacity = '0';
            oldActiveImg.classList.remove('active');
        }

        // Short timeout to animate images sequentially
        setTimeout(() => {
            images.forEach((img, i) => {
                // Prepare for animation
                img.style.position = 'absolute';
                img.style.margin = '0 auto';
                img.style.left = '0';
                img.style.right = '0';
                img.style.maxWidth = '90%';
                
                // Apply transitions with consistent animation
                if (i === newIndex) {
                    img.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
                    img.style.transform = `rotate(${rotation}deg) scale(1)`;
                    img.style.opacity = '1';
                    img.style.zIndex = '2';
                    img.classList.add('active');
                } else {
                    // Position non-active images for swiping
                    const direction = i < newIndex ? -1 : 1;
                    img.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
                    img.style.transform = `translateX(${direction * 100}%) rotate(0deg) scale(0)`;
                    img.style.opacity = '0';
                    img.style.zIndex = '1';
                    img.classList.remove('active');
                }
            });
        }, 100); // Small delay to ensure sequential animation
    }

    setupCenteredImageSwipe(container, centeredContainer, images, startIndex) {
        if (images.length <= 1) return;

        let currentIndex = startIndex;
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;
        let animationFrame = null;
        
        // Get all image elements
        const imageElements = container.querySelectorAll('img');
        const containerWidth = container.clientWidth;
        
        // Set initial positions
        imageElements.forEach((img, i) => {
            const translateX = (i - currentIndex) * 100;
            img.style.transform = `translateX(${translateX}%)`;
            img.style.transition = 'none';
        });

        const updateDotsIndicator = (index) => {
            const dots = centeredContainer.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        const animateImages = (progress) => {
            imageElements.forEach((img, i) => {
                const basePosition = (i - currentIndex) * 100;
                const offset = progress;
                
                // Preserve the existing rotation while only changing the translateX
                // If image is active (visible), maintain its scale=1, otherwise use the default scale
                if (img.classList.contains('active')) {
                    img.style.transform = `translateX(${basePosition + offset}%)`;
                } else {
                    img.style.transform = `translateX(${basePosition + offset}%)`;
                }
            });
        };

        const snapToClosest = (velocity) => {
            const progress = (currentX - startX) / containerWidth * 100;
            const threshold = 20; // % of screen width
            const velocityThreshold = 0.5; // Pixels per millisecond
            
            let targetIndex = currentIndex;
            
            // Determine direction based on velocity and progress
            if (Math.abs(velocity) > velocityThreshold) {
                // Fast swipe - use velocity direction
                targetIndex = velocity < 0 ? currentIndex + 1 : currentIndex - 1;
            } else if (Math.abs(progress) > threshold) {
                // Slow swipe but past threshold - use progress direction
                targetIndex = progress > 0 ? currentIndex - 1 : currentIndex + 1;
            }
            
            // Ensure target is within bounds
            targetIndex = Math.max(0, Math.min(images.length - 1, targetIndex));
            
            // If target changed, animate to it
            if (targetIndex !== currentIndex) {
                animateToIndex(targetIndex);
            } else {
                // Otherwise snap back to current
                resetPositions();
            }
        };
        
        const resetPositions = () => {
            imageElements.forEach((img, i) => {
                img.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
                img.style.transform = `translateX(${(i - currentIndex) * 100}%)`;
            });
        };
        
        const animateToIndex = (targetIndex) => {
            // Get rotation from CSS variable
            const rotation = parseFloat(imageElements[0].style.getPropertyValue('--rotation') || '1.5deg');
            
            // Apply spring-like animation
            imageElements.forEach((img, i) => {
                img.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
                if (i === targetIndex) {
                    img.style.transform = `translateX(0) rotate(${rotation}deg) scale(1)`;
                    img.style.opacity = '1';
                } else {
                    const direction = i < targetIndex ? -1 : 1;
                    img.style.transform = `translateX(${direction * 100}%) rotate(0deg) scale(0)`;
                    img.style.opacity = '0';
                }
            });
            
            // Update currentIndex and dots
            currentIndex = targetIndex;
            updateDotsIndicator(currentIndex);
        };

        const onStart = (e) => {
            // Cancel any ongoing animations
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            
            isDragging = true;
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            currentX = startX;
            startTime = Date.now();
            
            // Remove transitions for direct manipulation
            imageElements.forEach(img => {
                img.style.transition = 'none';
            });
            
            document.addEventListener(e.type === 'mousedown' ? 'mousemove' : 'touchmove', onMove, { passive: false });
            document.addEventListener(e.type === 'mousedown' ? 'mouseup' : 'touchend', onEnd);
        };

        const onMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const diffX = currentX - startX;
            
            // Calculate how far we've moved as a percentage of container width
            const progressPercent = diffX / containerWidth * 100;
            
            // Apply resistance at edges
            let effectiveProgress = progressPercent;
            if ((currentIndex === 0 && progressPercent > 0) || 
                (currentIndex === images.length - 1 && progressPercent < 0)) {
                effectiveProgress = progressPercent * 0.3; // Stronger resistance at edges
            }
            
            animateImages(effectiveProgress);
        };

        const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            const distance = currentX - startX;
            
            // Calculate velocity in pixels per millisecond
            const velocity = distance / duration;
            
            // Snap to the closest index based on position and velocity
            snapToClosest(velocity);
            
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchend', onEnd);
        };

        container.addEventListener('mousedown', onStart);
        container.addEventListener('touchstart', onStart, { passive: false });
    }

    closeCenteredImage(container) {
        const images = container.querySelectorAll('.centered-image');
        
        // Get the currently active image
        const activeImage = container.querySelector('.centered-image.active');
        
        if (activeImage) {
            // First start the image closing animation (reverse of opening)
            activeImage.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
            activeImage.style.transform = 'rotate(0deg) scale(0)';
            activeImage.style.opacity = '0';
            
            // Remove active class and add closing for CSS transitions
            activeImage.classList.remove('active');
            activeImage.classList.add('closing');
            
            // Make sure all other images also fade out properly
            images.forEach(img => {
                if (img !== activeImage) {
                    img.style.opacity = '0';
                    img.classList.add('closing');
                }
            });
        } else {
            // Fallback if no active image found
            images.forEach(img => {
                img.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
                img.style.transform = 'rotate(0deg) scale(0)';
                img.style.opacity = '0';
                img.classList.add('closing');
            });
        }
        
        // Let image animation complete fully before starting overlay fade
        setTimeout(() => {
            this.overlay.classList.remove('visible');
            document.body.classList.remove('no-scroll');
        }, 400); // Wait for image animation to be nearly complete before starting overlay fade
        
        // Match the transition duration of the images plus delay
        setTimeout(() => {
            container.remove();
        }, 800); // Increased to account for full animation cycle
    }

    showImage(index) {
        if (index < 0 || index >= this.totalImages) return;

        this.currentImageIndex = index;
        const images = this.carousel.querySelectorAll('img');
        
        // Get rotation from the first image or use default
        const firstImg = images[0];
        const rotation = firstImg ? parseFloat(firstImg.style.getPropertyValue('--rotation') || '1.5deg') : 1.5;

        images.forEach((img, i) => {
            img.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
            if (i === index) {
                img.style.transform = `translateX(0) rotate(${rotation}deg) scale(1)`;
                img.style.opacity = '1';
                img.classList.add('active');
            } else {
                const direction = i < index ? -1 : 1;
                img.style.transform = `translateX(${direction * 100}%) rotate(0deg) scale(0)`;
                img.style.opacity = '0';
                img.classList.remove('active');
            }
        });

        // Update dots only if they exist and there are multiple images
        if (this.totalImages > 1) {
            const dots = document.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
    }

    setupDots(count) {
        // Only set up dots if there are multiple images
        if (count <= 1) {
            const dotsContainer = document.querySelector('.carousel-dots');
            if (dotsContainer) dotsContainer.innerHTML = '';
            return;
        }

        const dotsContainer = document.querySelector('.carousel-dots');
        dotsContainer.innerHTML = '';
        dotsContainer.classList.add('sticky-dots');

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.showImage(i));
            dotsContainer.appendChild(dot);
        }
    }

    open() {
        this.sheet.classList.add('open');
        this.overlay.classList.add('visible');
    }

    close() {
        document.body.classList.remove('no-scroll');
        this.overlay.classList.remove('visible');

        // Fade out images before removing
        if (this.centeredContainer) {
            const images = this.centeredContainer.querySelectorAll('.centered-image');
            images.forEach(img => {
                img.style.opacity = '0';
                img.style.transform = 'rotate(0deg)';
            });
        }

        // Use setTimeout to match the transition duration
        setTimeout(() => {
            if (this.bottomSheet) {
                this.bottomSheet.classList.remove('open');
            }

            if (this.centeredContainer) {
                document.body.removeChild(this.centeredContainer);
                this.centeredContainer = null;
            }

            this.isOpen = false;
            this.isClosing = false;
        }, 300);
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
        if (document.querySelector('.bottom-sheet') && document.querySelector('.overlay')) {
            new BottomSheet();
        }
    }
});

// Export functionality
window.hoverMobile = {
    BottomSheet
};