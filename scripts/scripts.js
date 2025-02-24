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
        height: 100vh;
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

// Handle image hover effects
const handleImageHover = (element, img, isEnter) => {
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
};

// Image cycling functionality
const cycleImages = (element, img) => {
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

        fadeTimeout = setTimeout(() => {
            img.style.opacity = "0";
            currentIndex = (currentIndex + 1) % images.length;
            cycleTimeout = setTimeout(showNextImage, 0);
        }, 600);
    };

    if (images.length >= 1) showNextImage();
    return () => {
        clearTimeout(cycleTimeout);
        clearTimeout(fadeTimeout);
        img.style.opacity = "0";
    };
};

// Mouse position tracking for images
const updateMousePosition = (e) => {
    document.querySelectorAll('.hover-image').forEach((img) => {
        img.style.left = `${e.clientX}px`;
        img.style.top = `${e.clientY}px`;
        img.classList.toggle('move-down', e.clientY < 480);
    });
};

// Random wave effect
const triggerRandomWave = () => {
    const availableElements = Array.from(document.querySelectorAll('[data-hover="true"]'))
        .filter(element => !hoveredElements.has(element) && element.tagName.toLowerCase() !== 'a');

    if (!availableElements.length) return;

    const randomElement = availableElements[Math.floor(Math.random() * availableElements.length)];
    const letters = randomElement.querySelectorAll('.wave-text span');
    letters.forEach(letter => letter.classList.add('random-wave'));
    handleWaveEffect(randomElement, true, true);

    setTimeout(() => {
        handleWaveEffect(randomElement, false, true);
        setTimeout(() => {
            letters.forEach(letter => letter.classList.remove('random-wave'));
        }, 700);
    }, 700);
    setTimeout(triggerRandomWave, Math.random() * 3000 + 5000);
};

// Initialize everything
function initShimmerText(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        if (!element.querySelector('.shimmer-text')) {
            const text = element.textContent.trim();
            const processedText = text.split(' ').map(word => {
                const letters = word.split('').map(char => `<span>${char}</span>`).join('');
                return `<span class="word">${letters}</span>` + ' ';
            }).join('');
            element.innerHTML = `<span class="shimmer-text">${processedText}</span>`;
        }

        const letters = element.querySelectorAll('.shimmer-text .word span');
        const baseDelay = 25;

        letters.forEach((letter, i) => {
            setTimeout(() => {
                letter.classList.add('shimmer-in');
            }, i * baseDelay);
        });
    });
}

function initHeadlineWave() {
    const headlines = document.querySelectorAll('.headline');
    headlines.forEach(headline => {
        if (!headline.querySelector('.wave-text')) {
            const text = headline.textContent.trim();
            const processedText = text.split(' ').map(word => {
                const letters = word.split('').map(char => `<span>${char}</span>`).join('');
                return `<span class="word">${letters}</span>` + ' ';
            }).join('');
            headline.innerHTML = `<span class="wave-text">${processedText}</span>`;
        }

        const letters = headline.querySelectorAll('.wave-text .word span');
        const baseDelay = 25;

        letters.forEach((letter, i) => {
            setTimeout(() => {
                letter.classList.add('shimmer-in');
            }, i * baseDelay);
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM Content Loaded");
    
    // Wait for all resources to load before playing animations
    window.addEventListener('load', () => {
        // Initialize wave first
        setTimeout(initHeadlineWave, 100);
        // Initialize shimmer last, with a delay
        setTimeout(() => {
            initShimmerText('[data-shimmer="true"]');
        }, 800);
    });
    // Initialize footer animation
    setTimeout(() => {
        const animationContainer = document.getElementById('footer-animation-container');
        if (animationContainer) {
            console.log("Found animation container, initializing");
            const wrapper = document.querySelector('.animation-wrapper');
            if (wrapper) {
                wrapper.style.opacity = '1';
                wrapper.style.background = '#ffffff';
            }
            createGridAnimation(animationContainer);
        }
    }, 500);

    // First load header and case studies
    const loadPromises = [
        fetch('/header.html').then(response => response.text()).then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                setupHoverEffects(); // Initialize after header load
            }
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
        new BottomSheet();
    }

    // Run setupHoverEffects again to catch any elements that might have been missed
    setupHoverEffects();
    window.addEventListener("mousemove", updateMousePosition, { passive: true });
    setTimeout(triggerRandomWave, 5000);

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

    // Load header
    fetch('/header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load header');
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                setupHoverEffects();
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = `
                    <nav>
                        <a href="index.html">Dmytro Dvornichenko</a>
                        <div>
                            <a href="mailto:email@example.com">Email</a>
                            <a href="https://linkedin.com/in/username">LinkedIn</a>
                            <a href="https://twitter.com/username">Twitter</a>
                        </div>
                    </nav>`;
                setupHoverEffects();
            }
        });

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
        this.carousel = document.querySelector('.carousel');
        this.currentImageIndex = 0;
        this.setupGestures();
        this.setupTriggers();
        this.totalImages = 0;

        this.overlay.addEventListener('click', () => this.close());
        document.querySelector('.bottom-sheet-indicator').addEventListener('click', () => this.close());
    }

    setupGestures() {
        let startY = 0;
        let startX = 0;
        this.isClosing = false;

        const onStart = (e) => {
            this.isClosing = false;
            startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            document.addEventListener(e.type === 'mousedown' ? 'mousemove' : 'touchmove', onMove, { passive: true });
            document.addEventListener(e.type === 'mousedown' ? 'mouseup' : 'touchend', onEnd);
        };

        const onMove = (e) => {
            const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
            const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const diffY = currentY - startY;
            const diffX = currentX - startX;

            // Determine if the swipe is more horizontal or vertical
            if (Math.abs(diffX) > Math.abs(diffY) && this.totalImages > 1) {
                // Horizontal swipe for carousel
                e.preventDefault();
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0 && this.currentImageIndex > 0) {
                        this.showImage(this.currentImageIndex - 1);
                        startX = currentX;
                    } else if (diffX < 0 && this.currentImageIndex < this.totalImages - 1) {
                        this.showImage(this.currentImageIndex + 1);
                        startX = currentX;
                    }
                }
            } else if (diffY > 100 && !this.isClosing) {
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
        this.sheet.addEventListener('touchstart', onStart, { passive: true });
    }

    setupTriggers() {
        document.querySelectorAll('[data-images]').forEach(element => {
            element.addEventListener('click', (e) => {
                if (window.matchMedia('(max-width: 788px)').matches) {
                    e.preventDefault();
                    this.updateImages(element);
                    this.open();
                }
            });
        });
    }

    updateImages(element) {
        const images = element.dataset.images?.split(',') || [];
        this.carousel.innerHTML = '';
        this.currentImageIndex = 0;
        this.totalImages = images.length;

        images.forEach((image, index) => {
            const img = document.createElement('img');
            const imgPath = `/images/${image}`;
            if (image.endsWith('.webp')) {
                img.type = 'image/webp';
            } else if (image.endsWith('.avif')) {
                img.type = 'image/avif';
            }
            img.src = imgPath;
            img.style.transform = `translateX(${index * 100}%)`;
            img.style.position = 'absolute';
            this.carousel.appendChild(img);
        });

        this.setupDots(images.length);
    }

    showImage(index) {
        if (index < 0 || index >= this.totalImages) return;

        this.currentImageIndex = index;
        const images = this.carousel.querySelectorAll('img');

        images.forEach((img, i) => {
            img.style.transform = `translateX(${(i - index) * 100}%)`;
            img.style.transition = 'transform 0.3s ease-out';
        });

        // Update dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    setupDots(count) {
        const dotsContainer = document.querySelector('.carousel-dots');
        dotsContainer.innerHTML = '';

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
        this.isClosing = false;
        setTimeout(() => {
            this.carousel.innerHTML = '';
            document.querySelector('.carousel-dots').innerHTML = '';
        }, 300);
    }
}