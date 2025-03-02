
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
        
        // Create overlay and prevent scrolling
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
            imgElement.style.transform = index === currentIndex ? 
                `rotate(${rotation}deg) scale(0)` : `translateX(${(index - currentIndex) * 100}%)`;
            
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
        
        // Trigger animation for the current image
        const currentImg = imageContainer.querySelectorAll('img')[currentIndex];
        setTimeout(() => {
            currentImg.style.transform = `rotate(${rotation}deg) scale(1)`;
        }, 10);
        
        // Add swipe gestures
        this.setupCenteredImageSwipe(imageContainer, centeredContainer, images, currentIndex);
        
        // Add tap handler to close
        centeredContainer.addEventListener('click', () => {
            this.closeCenteredImage(centeredContainer);
        });
        
        this.overlay.addEventListener('click', () => {
            this.closeCenteredImage(centeredContainer);
        });
    }
    
    showImageInContainer(container, newIndex, oldIndex) {
        const images = container.querySelectorAll('img');
        const rotation = ((window.rotationCounter % 2 === 0) ? 1.5 : -1.5);
        
        // Ensure container is set up for proper centering
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.height = '100%';
        
        // Set up a wrapper for the images to ensure proper horizontal centering
        if (!container.querySelector('.image-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';
            
            // Move all images into the wrapper
            while (container.firstChild) {
                wrapper.appendChild(container.firstChild);
            }
            container.appendChild(wrapper);
        }
        
        images.forEach((img, i) => {
            if (i === newIndex) {
                // Center the active image and add rotation/scale
                img.style.transform = `rotate(${rotation}deg) scale(1)`;
                img.style.margin = '0 auto'; // Ensure horizontal centering
            } else {
                // Position non-active images
                img.style.transform = `translateX(${(i - newIndex) * 100}%)`;
            }
        });
    }
    
    setupCenteredImageSwipe(container, centeredContainer, images, startIndex) {
        let startX = 0;
        let currentIndex = startIndex;
        
        const onStart = (e) => {
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            document.addEventListener(e.type === 'mousedown' ? 'mousemove' : 'touchmove', onMove, { passive: false });
            document.addEventListener(e.type === 'mousedown' ? 'mouseup' : 'touchend', onEnd);
        };
        
        const onMove = (e) => {
            if (images.length <= 1) return;
            
            e.preventDefault();
            const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const diffX = currentX - startX;
            
            if (Math.abs(diffX) > 50) {
                if (diffX > 0 && currentIndex > 0) {
                    // Swipe right - show previous image
                    currentIndex--;
                    this.showImageInContainer(container, currentIndex, currentIndex + 1);
                    
                    // Update dots
                    const dots = centeredContainer.querySelectorAll('.dot');
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentIndex);
                    });
                    
                    startX = currentX;
                } else if (diffX < 0 && currentIndex < images.length - 1) {
                    // Swipe left - show next image
                    currentIndex++;
                    this.showImageInContainer(container, currentIndex, currentIndex - 1);
                    
                    // Update dots
                    const dots = centeredContainer.querySelectorAll('.dot');
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentIndex);
                    });
                    
                    startX = currentX;
                }
            }
        };
        
        const onEnd = () => {
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
        
        // Animate all images
        images.forEach(img => {
            img.style.transform = 'rotate(0deg) scale(0)';
        });
        
        this.overlay.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        
        setTimeout(() => {
            container.remove();
        }, 300);
    }

    showImage(index) {
        if (index < 0 || index >= this.totalImages) return;

        this.currentImageIndex = index;
        const images = this.carousel.querySelectorAll('img');

        images.forEach((img, i) => {
            img.style.transform = `translateX(${(i - index) * 100}%)`;
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
        this.sheet.classList.remove('open');
        this.overlay.classList.remove('visible');
        document.body.classList.remove('no-scroll');
        this.isClosing = false;
        setTimeout(() => {
            this.carousel.innerHTML = '';
            const dotsContainer = document.querySelector('.carousel-dots');
            if (dotsContainer) dotsContainer.innerHTML = '';
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
