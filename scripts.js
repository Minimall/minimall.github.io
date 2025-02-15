// Track hovered elements and rotation counter
const hoveredElements = new Set();
let rotationCounter = 0;

// Unified setup function for hover effects
const setupHoverEffects = () => {
    const hoverableElements = document.querySelectorAll('a, [data-hover="true"]');
    const isMobile = window.innerWidth <= 768;

    if (isMobile && !document.querySelector('.bottom-sheet-hover')) {
        const bottomSheet = document.createElement('div');
        bottomSheet.classList.add('bottom-sheet-hover');
        bottomSheet.innerHTML = `
            <div class="bottom-sheet-header">
                <div class="bottom-sheet-indicator"></div>
            </div>
            <div class="carousel-container">
                <div class="carousel"></div>
                <div class="carousel-dots"></div>
            </div>
        `;
        document.body.appendChild(bottomSheet);

        const overlay = document.createElement('div');
        overlay.classList.add('overlay-hover');
        document.body.appendChild(overlay);
    }

    hoverableElements.forEach(element => {
        if (element.hasAttribute('data-processed')) return;
        
        const hasImages = element.dataset.images || element.querySelector('[data-images]');

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

            if (!isMobile) {
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
            }

            element.addEventListener('click', (e) => {
                if (!isMobile) return;
                e.preventDefault();
                
                const targetElement = element.dataset.images ? element : element.querySelector('[data-images]');
                if (!targetElement) return;
                
                const images = targetElement.dataset.images?.split(",") || [];
                if (!images.length) return;

                const bottomSheet = document.querySelector('.bottom-sheet-hover');
                const carousel = bottomSheet.querySelector('.carousel');
                carousel.innerHTML = images.map(img => 
                    `<img src="/images/1x/${img}" srcset="/images/1x/${img} 1x, /images/2x/${img} 2x" alt="">`
                ).join('');

                const dots = bottomSheet.querySelector('.carousel-dots');
                dots.innerHTML = images.map((_, i) => 
                    `<div class="dot ${i === 0 ? 'active' : ''}"></div>`
                ).join('');

                bottomSheet.classList.add('open');
                document.querySelector('.overlay-hover').classList.add('visible');
            });
        } else {
            // Handle regular wave text effect
            if (!element.querySelector('.wave-text')) {
                const text = element.textContent.trim();
                const needsWave = !element.querySelector('.wave-text');
                if (needsWave) {
                    element.innerHTML = `<span class="wave-text">${
                        text.split('').map(char => char === ' ' ? `<span>&nbsp;</span>` : `<span>${char}</span>`).join('')
                    }</span>`;
                }
            }

            // Add wave effect listeners
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
    const enterDelay = isRandom ? 70 : 30;  // Faster for random waves
    const leaveDelay = isRandom ? 40 : 10;   // Faster exit for random waves

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
        img.src = `/images/1x/${images[currentIndex]}`;
        img.srcset = `/images/1x/${images[currentIndex]} 1x, /images/2x/${images[currentIndex]} 2x`;
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
document.addEventListener("DOMContentLoaded", () => {
    setupHoverEffects();
    window.addEventListener("mousemove", updateMousePosition, { passive: true });
    setTimeout(triggerRandomWave, 5000);

    // Collapsible content handling
    document.querySelectorAll('.collapsible-link').forEach(link => {
        link.setAttribute('data-hover', 'true');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const content = document.querySelector('.collapsible-content');
            const links = document.querySelectorAll('.collapsible-link');

            if (content) {
                content.classList.toggle('active');
                links.forEach(l => l.classList.toggle('hidden'));
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

const setupBottomSheet = () => {
    if (window.innerWidth > 768) return;

    const bottomSheet = document.querySelector('.bottom-sheet-hover') || document.createElement('div');
    bottomSheet.classList.add('bottom-sheet-hover');
    bottomSheet.innerHTML = `
        <div class="bottom-sheet-header">
            <div class="bottom-sheet-indicator"></div>
        </div>
        <div class="carousel-container">
            <div class="carousel"></div>
            <div class="carousel-dots"></div>
        </div>
    `;

    if (!document.querySelector('.bottom-sheet-hover')) {
        document.body.appendChild(bottomSheet);
    }

    document.querySelectorAll('[data-hover="true"]').forEach(element => {
        element.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;
            e.preventDefault();
            
            const images = element.dataset.images?.split(",") || [];
            if (!images.length) return;

            const carousel = bottomSheet.querySelector('.carousel');
            carousel.innerHTML = images.map(img => 
                `<img src="/images/1x/${img}" srcset="/images/1x/${img} 1x, /images/2x/${img} 2x" alt="">`
            ).join('');

            bottomSheet.classList.add('open');
            document.querySelector('.overlay-hover').classList.add('visible');
        });
    });

    const overlay = document.querySelector('.overlay-hover') || document.createElement('div');
    overlay.classList.add('overlay-hover');
    if (!document.querySelector('.overlay-hover')) {
        document.body.appendChild(overlay);
    }

    overlay.addEventListener('click', () => {
        bottomSheet.classList.remove('open');
        overlay.classList.remove('visible');
    });
}

// Initialize bottom sheet
document.addEventListener('DOMContentLoaded', setupBottomSheet);