// Track hovered elements
const hoveredElements = new Set();

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
            const text = element.textContent;
            element.innerHTML = `<span class="wave-text">${
                text.split('').map(char => char === ' ' ? '<span>&nbsp;</span>' : `<span>${char}</span>`).join('')
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
                const text = element.textContent;
                element.innerHTML = `<span class="wave-text">${
                    text.split('').map(char => char === ' ' ? '<span>&nbsp;</span>' : `<span>${char}</span>`).join('')
                }</span>`;
            }
            
            // Add wave effect listeners
            element.addEventListener('mouseenter', () => handleWaveEffect(element, true));
            element.addEventListener('mouseleave', () => handleWaveEffect(element, false));
        }

        element.setAttribute('data-processed', 'true');
    });
};

// Handle wave animation effect
const handleWaveEffect = (element, isEnter) => {
    const letters = element.querySelectorAll('.wave-text span');
    const enterDelay = 50;  // Delay for mouse enter animation
    const leaveDelay = 10;  // Delay for mouse leave animation

    letters.forEach((letter, i) => {
        setTimeout(
            () => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isEnter ? 'wave-in' : 'wave-out');
            },
            isEnter ? i * enterDelay : (letters.length - 1 - i) * leaveDelay
        );
    });
};

// Handle image hover effects
const handleImageHover = (element, img, isEnter) => {
    if (isEnter) {
        element.stopImageCycle = cycleImages(element, img);
    } else if (element.stopImageCycle) {
        element.stopImageCycle();
        element.stopImageCycle = null;
    }
};

// Image cycling functionality (preserved from original)
const cycleImages = (element, img) => {
    const images = element.dataset.images?.split(",") || [];
    if (!images.length) return null;

    let currentIndex = 0;
    let cycleTimeout;
    let fadeTimeout;

    const showNextImage = () => {
        img.src = `./images/${images[currentIndex]}`;
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
        .filter(element => !hoveredElements.has(element));

    if (!availableElements.length) return;

    const randomElement = availableElements[Math.floor(Math.random() * availableElements.length)];
    handleWaveEffect(randomElement, true);

    setTimeout(() => handleWaveEffect(randomElement, false), 600);
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

    // Header loading (preserved from original)
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load header');
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                setupHoverEffects(); // Setup hover effects for newly loaded content
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
                setupHoverEffects(); // Setup hover effects for fallback content
            }
        });
});