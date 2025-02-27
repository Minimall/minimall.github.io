// Track hovered elements and rotation counter
const hoveredElements = new Set();
let rotationCounter = 0;

// Footer animation initialization
function initFooterAnimation() {
    console.log("Initializing footer animation");
    const footer = document.querySelector('.footer2');
    if (!footer) {
        console.log("Footer not found");
        return;
    }

    const animationWrapper = footer.querySelector('.animation-wrapper');
    const animationContainer = document.getElementById('footer-animation-container');

    if (!animationContainer) {
        console.log("Animation container not found");
        return;
    }

    let isAnimationInitialized = false;

    animationContainer.style.cssText = `
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        display: grid;
        background: transparent;
    `;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isAnimationInitialized) {
                isAnimationInitialized = true;
                createGridAnimation(animationContainer);
                setTimeout(() => {
                    animationWrapper.classList.add('visible');
                }, 100);
            }
        });
    }, { threshold: 0.2 });

    observer.observe(footer);
}

// Add to your existing DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", () => {
    // initFooterAnimation();
    // ... your existing initialization code
});


// Unified setup function for hover effects
const setupHoverEffects = () => {
    const hoverableElements = document.querySelectorAll('a, [data-hover="true"]');

    hoverableElements.forEach(element => {
        // Skip if already processed
        if (element.hasAttribute('data-processed')) return;
        
        // Skip logo elements - exclude case-logo links from hover effects
        if (element.closest('.case-logo')) return;

        // Handle text wave effect
        if (!element.querySelector('.wave-text')) {
            const text = element.textContent.trim();
            const processedText = text.split('').map(char => `<span>${char}</span>`).join('');
            element.innerHTML = `<span class="wave-text">${processedText}</span>`;
        }

        // Add wave effect listeners for both desktop and mobile
        if ('ontouchstart' in window) {
            // For mobile - using touchstart/end and preserving link clicks
            element.addEventListener('touchstart', (e) => {
                // Don't prevent default to keep links working
                handleWaveEffect(element, true);
            });
            element.addEventListener('touchend', () => {
                setTimeout(() => handleWaveEffect(element, false), 300);
            });
        }

        // Keep desktop behavior
        element.addEventListener('mouseenter', () => handleWaveEffect(element, true));
        element.addEventListener('mouseleave', () => handleWaveEffect(element, false));

        element.setAttribute('data-processed', 'true');
    });
    
    // Set up grid item hover effects
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            // Apply SVG-like hover effect - scale container and increase z-index
            item.style.transform = 'scale(1.05)';
            item.style.zIndex = '9999';
        });
        item.addEventListener('mouseleave', () => {
            // Reset to original state
            item.style.transform = '';
            // Delay resetting the z-index to ensure smooth transition
            setTimeout(() => {
                item.style.zIndex = '1';
            }, 300);
        });
    });
};

// Handle wave animation effect
const handleWaveEffect = (element, isEnter, isRandom = false) => {
    console.log('Wave effect on:', element.innerHTML);
    const letters = element.querySelectorAll('.wave-text span');
    const enterDelay = isRandom ? 112 : 48;  // 20% faster for wave-in
    const leaveDelay = isRandom ? 104 : 26;  // 30% slower for wave-out

    // Clear previous animation timeouts
    if (element.waveTimeouts) {
        element.waveTimeouts.forEach(timeout => clearTimeout(timeout));
    }
    element.waveTimeouts = [];

    letters.forEach((letter, i) => {
        const timeout = setTimeout(
            () => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isEnter ? 'wave-in' : 'wave-out');
            },
            isEnter ? i * enterDelay : (letters.length - 1 - i) * leaveDelay
        );
        element.waveTimeouts.push(timeout);
    });
};

// Handle wave animation effect only (no image hover handling needed)
// This function is kept intact since we still need the text wave effect



// Make sure logos are preserved
function preserveLogos() {
    // Find all case logos and ensure they're visible
    const caseLogos = document.querySelectorAll('.case-logo img');
    caseLogos.forEach(logo => {
        // Force logo visibility and prevent any CSS that might hide it
        logo.style.display = 'block !important';
        logo.style.visibility = 'visible !important';
        logo.style.opacity = '1 !important';
        
        // Remove any classes that might be causing the issue
        logo.classList.remove('wave-in', 'wave-out');
        
        // Mark logo parents to be excluded from hover effects
        const logoParent = logo.closest('.case-logo');
        if (logoParent) {
            logoParent.setAttribute('data-logo-container', 'true');
        }
    });
}

// Initialize everything
function initHeadlineWave() {
    // Ensure logos are visible first
    preserveLogos();
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const h1Element = entry.target;
                setTimeout(() => {
                    const waveTextSpan = h1Element.querySelector('.wave-text');
                    if (waveTextSpan) {
                        const spans = waveTextSpan.querySelectorAll('span');
                        const baseDelay = 25;
                        spans.forEach((span, i) => {
                            setTimeout(() => {
                                span.classList.add('shimmer-in');
                            }, i * baseDelay);
                        });
                    }
                    
                    // Ensure logos are still visible after animations
                    preserveLogos();
                }, 1200);
                
                observer.unobserve(h1Element);
            }
        });
    }, { threshold: 0.5 });

    function processHeadlines() {
        const headlines = document.querySelectorAll('h1:not(.case-title), .case-title');
        headlines.forEach(headline => {
            // Skip if already processed
            if (headline.hasAttribute('data-wave-processed')) return;
            
            const waveTextSpan = headline.querySelector('.wave-text');
            if (waveTextSpan) {
                const text = waveTextSpan.textContent.trim();
                const processedText = text.split('').map(char => 
                    char === ' ' ? `<span>&nbsp;</span>` : `<span>${char}</span>`
                ).join('');
                waveTextSpan.innerHTML = processedText;
                observer.observe(headline);
                headline.setAttribute('data-wave-processed', 'true');
            }
        });
    }

    // Initial processing
    processHeadlines();

    // Watch for dynamically loaded content
    const footerObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                processHeadlines();
            }
        });
    });

    footerObserver.observe(document.body, { childList: true, subtree: true });
}

// Set up periodic check to ensure logos remain visible
function setupLogoPreservation() {
    // Initial preservation
    preserveLogos();
    
    // Keep checking periodically
    setInterval(preserveLogos, 1000);
    
    // Also preserve logos after any DOM changes
    const observer = new MutationObserver(() => {
        preserveLogos();
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM Content Loaded");
    
    // Make logos visible immediately and set up preservation
    setupLogoPreservation();

    // 1. Wait for all resources to fully load before initializing animations
    window.addEventListener('load', () => {
        console.log("Window fully loaded");
        
        // Ensure logos remain visible after load
        preserveLogos();
        
        // 2. First initialize headline animation (complete essential page loading)
        setTimeout(() => {
            initHeadlineWave();
            preserveLogos(); // Ensure logos stay visible
        }, 100);
        
        // 3. Then start footer animation with a delay to ensure proper sequence
        setTimeout(() => {
            const animationContainer = document.getElementById('footer-animation-container');
            if (animationContainer) {
                console.log("Starting footer animation");
                const wrapper = document.querySelector('.animation-wrapper');
                if (wrapper) {
                    wrapper.style.opacity = '1';
                    wrapper.style.background = '#ffffff';
                }
                createGridAnimation(animationContainer);
                
                // Final check to ensure logos are visible
                preserveLogos();
            }
        }, 1000); // Increased delay for footer animation
    });

    // First load case studies (skipping header.html which is missing)
    const loadPromises = [
        new Promise(resolve => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                // Use inline content instead of fetching header.html
                console.log('Header placeholder found but header.html is not available');
            }
            resolve();
        }),
        ...Array.from(document.querySelectorAll('[data-case-file]')).map(placeholder => 
            fetch(placeholder.dataset.caseFile)
                .then(response => response.text())
                .then(data => {
                    placeholder.innerHTML = data;
                    setupHoverEffects(); // Initialize after each case load
                })
        )
    ];

    await Promise.all(loadPromises).catch(error => console.error('Loading error:', error));

    // Initialize UI and ensure wave effects are set up
    if (window.matchMedia('(max-width: 788px)').matches) {
        // Make sure required elements exist before creating BottomSheet
        if (document.querySelector('.bottom-sheet') && document.querySelector('.overlay')) {
            new BottomSheet();
        } else {
            console.log('Required elements for BottomSheet not found');
        }
    }

    // Run setupHoverEffects again to catch any elements that might have been missed
    setupHoverEffects();

    // Collapsible content handling
    document.querySelectorAll('.collapsible-link').forEach(link => {
        link.setAttribute('data-hover', 'true');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const content = document.querySelector('.collapsible-content');
            if (content) {
                content.classList.toggle('active');
            }
        });
    });

    // Header is already included in HTML, no need to fetch it
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        // Apply effects to any existing header elements
        setupHoverEffects();
    }

    // Load all case studies
    document.querySelectorAll('[data-case-file]').forEach(placeholder => {
        const caseFile = placeholder.dataset.caseFile;
        if (!caseFile) return;

        fetch(caseFile)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load case study: ${caseFile}`);
                return response.text();
            })
            .then(data => {
                placeholder.innerHTML = data;
                setupHoverEffects();
            })
            .catch(error => {
                console.error(error);
                placeholder.innerHTML = `<div class="case-study-error">Failed to load case study</div>`;
            })
            .finally(() => {
                // Initialize footer animation after content is loaded

            });
    });
});
// Text repeater functionality
document.addEventListener('DOMContentLoaded', () => {
    const repeaters = document.querySelectorAll('.text-repeater');
    repeaters.forEach(repeater => {
        const text = repeater.textContent.trim();
        repeater.setAttribute('data-content', text + ' ');
        repeater.style.setProperty('--content-width', text.length + 'ch');
    });
});
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
        const rotation = ((rotationCounter % 2 === 0) ? 1.5 : -1.5);
        rotationCounter++;
        
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
        const rotation = ((rotationCounter % 2 === 0) ? 1.5 : -1.5);
        
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

// Preload all hover images
function preloadHoverImages() {
    document.querySelectorAll('[data-images]').forEach(element => {
        const images = element.dataset.images?.split(',') || [];
        images.forEach(image => {
            const img = new Image();
            img.src = `/images/${image}`;
            
            // Set image type based on extension
            if (image.endsWith('.webp')) {
                img.type = 'image/webp';
            } else if (image.endsWith('.avif')) {
                img.type = 'image/avif';
            } else if (image.endsWith('.jpg') || image.endsWith('.jpeg')) {
                img.type = 'image/jpeg';
            }
        });
    });
}

// Add to your existing DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", () => {
    // Existing code...
    
    // Preload all hover images as soon as DOM is ready
    preloadHoverImages();
});


// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Get the target's position
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        
        // Animate scroll
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
          // These don't work in all browsers but we're setting them anyway
          // CSS scroll-behavior handles this in modern browsers
        });
        
        // Update URL without scrolling
        history.pushState(null, null, targetId);
      }
    });
  });
});
