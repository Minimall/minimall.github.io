document.addEventListener("DOMContentLoaded", () => {
    const hoveredElements = new Set();

    const setupTextAnimation = () => {
        const elements = document.querySelectorAll('a, span');

        elements.forEach(element => {
            // Skip if element is already processed or is a child of processed element
            if (element.closest('.wave-text') || element.querySelector('.wave-text')) return;

            // Create wave text wrapper
            const waveText = document.createElement('span');
            waveText.className = 'wave-text';
            waveText.setAttribute('wave-effect-hint', 'true');

            // Split text into spans
            const text = element.textContent;
            waveText.innerHTML = text
                .split("")
                .map(letter => `<span>${letter}</span>`)
                .join("");

            // Replace original content
            element.textContent = '';
            element.appendChild(waveText);

            // Setup hover handlers
            element.addEventListener("mouseenter", () => {
                if (!element.hasAttribute('wave-effect-hint')) return;
                hoveredElements.add(element);

                const letters = element.querySelectorAll(".wave-text span");
                letters.forEach((letter, i) => {
                    setTimeout(() => {
                        letter.classList.remove("wave-out");
                        letter.classList.add("wave-in");
                    }, i * 50);
                });

                // Handle image if present
                const img = element.querySelector(".hover-image");
                if (img && element.dataset.images) {
                    element.stopImageCycle = cycleImages(element, img);
                }
            });

            element.addEventListener("mouseleave", () => {
                if (!element.hasAttribute('wave-effect-hint')) return;
                hoveredElements.delete(element);

                const letters = element.querySelectorAll(".wave-text span");
                letters.forEach((letter, i) => {
                    setTimeout(() => {
                        letter.classList.remove("wave-in");
                        letter.classList.add("wave-out");
                    }, (letters.length - 1 - i) * 50);
                });

                if (element.stopImageCycle) {
                    element.stopImageCycle();
                    element.stopImageCycle = null;
                }
            });
        });
    };

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

    const updateMousePosition = (e) => {
        document.querySelectorAll(".hover-image").forEach((img) => {
            img.style.left = `${e.clientX}px`;
            img.style.top = `${e.clientY}px`;
            img.classList.toggle("move-down", e.clientY < 480);
        });
    };

    // Initialize
    setupTextAnimation();
    window.addEventListener("mousemove", updateMousePosition, { passive: true });

    // Header loading
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load header');
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                setupTextAnimation(); // Re-run setup for dynamically loaded content
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
                setupTextAnimation(); // Re-run setup for fallback content
            }
        });
});