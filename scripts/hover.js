
// Track hovered elements and rotation counter
const hoveredElements = new Set();
let rotationCounter = 0;

// Set up hover effects for elements
function setupHoverEffects() {
    const hoverableElements = document.querySelectorAll('a, [data-hover="true"]');

    hoverableElements.forEach(element => {
        // Skip if already processed
        if (element.hasAttribute('data-processed')) return;
        
        // Skip logo elements - exclude case-logo links from hover effects
        if (element.closest('.case-logo')) return;

        // Check if it's a direct image hover element
        const hasDirectImageHover = element.dataset.images && !element.querySelector('.wave-text');

        if (hasDirectImageHover) {
            // Create and handle hover image
            const img = document.createElement('img');
            img.className = 'hover-image';
            img.alt = element.textContent;
            document.body.appendChild(img);

            // Split text for wave effect
            const text = element.textContent.trim();
            element.innerHTML = `<span class="wave-text">${
                text.split('').map(char => char === ' ' ? `<span>&nbsp;</span>` : `<span>${char}</span>`).join('')
            }</span>`;

            element.addEventListener('mouseenter', () => {
                handleImageHover(element, img, true);
                handleWaveEffect(element, true);
                hoveredElements.add(element);
            });
            element.addEventListener('mouseleave', () => {
                handleImageHover(element, img, false);
                handleWaveEffect(element, false);
                hoveredElements.delete(element);
            });
        } else {
            // Handle regular wave text effect
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
        }

        element.setAttribute('data-processed', 'true');
    });
}

// Handle wave animation effect
function handleWaveEffect(element, isEnter, isRandom = false) {
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
}

// Handle image hover effects
function handleImageHover(element, img, isEnter) {
    if (isEnter) {
        const rotation = (rotationCounter % 2 === 0) ? 3 : -3;
        rotationCounter++;
        img.style.setProperty('--rotation', `${rotation}deg`);
        img.classList.add('active');
        element.stopImageCycle = cycleImages(element, img);
    } else if (element.stopImageCycle) {
        img.classList.remove('active');
        element.stopImageCycle();
        element.stopImageCycle = null;
    }
}

// Image cycling functionality
function cycleImages(element, img) {
    const images = element.dataset.images?.split(",") || [];
    if (!images.length) return null;

    let currentIndex = 0;
    let cycleTimeout;
    let fadeTimeout;

    const showNextImage = () => {
        const imgPath = `/images/${images[currentIndex]}`;
        if (images[currentIndex].endsWith('.webp')) {
            img.type = 'image/webp';
        } else if (images[currentIndex].endsWith('.avif')) {
            img.type = 'image/avif';
        }
        img.src = imgPath;
        img.style.opacity = "1";

        // Only set up cycling if there are multiple images
        if (images.length > 1) {
            fadeTimeout = setTimeout(() => {
                img.style.opacity = "0";
                currentIndex = (currentIndex + 1) % images.length;
                cycleTimeout = setTimeout(showNextImage, 0);
            }, 1200);
        }
    };

    if (images.length >= 1) showNextImage();
    return () => {
        clearTimeout(cycleTimeout);
        clearTimeout(fadeTimeout);
        img.style.opacity = "0";
    };
}

// Mouse position tracking for images
function updateMousePosition(e) {
    document.querySelectorAll('.hover-image').forEach((img) => {
        img.style.left = `${e.clientX}px`;
        img.style.top = `${e.clientY}px`;
        img.classList.toggle('move-down', e.clientY < 480);
    });
}

// Mobile implementation for hover images
function setupMobileHoverImages() {
    if ('ontouchstart' in window) {
        document.querySelectorAll('[data-images]').forEach(element => {
            element.addEventListener('click', (e) => {
                if (window.matchMedia('(max-width: 788px)').matches) {
                    e.preventDefault();
                    const images = element.dataset.images?.split(',') || [];
                    if (images.length > 0 && typeof showCenteredImage === 'function') {
                        showCenteredImage(images[0]);
                    }
                }
            });
        });
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

// Make sure logos are preserved and not affected by hover effects
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

// Initialize hover effects on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
    // Preload hover images
    preloadHoverImages();
    
    // Set up hover effects
    setupHoverEffects();
    
    // Set up mobile hover images
    setupMobileHoverImages();
    
    // Add mouse move handler for desktop
    window.addEventListener("mousemove", updateMousePosition, { passive: true });
    
    // Preserve logos
    preserveLogos();
    
    // Setup periodic logo preservation
    setInterval(preserveLogos, 1000);
});

// Export functions for use in other scripts
window.hoverJS = {
    setupHoverEffects,
    handleWaveEffect,
    handleImageHover,
    updateMousePosition,
    preloadHoverImages,
    preserveLogos
};
