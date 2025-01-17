document.addEventListener("DOMContentLoaded", () => {
    const setupTextAnimation = () => {
        // Process all links and spans
        const elements = document.querySelectorAll('a, span');
        elements.forEach(element => {
            // Skip if already processed or is a child of another animated element
            if (element.closest('.wave-text') || element.querySelector('.wave-text')) return;

            // Create wave-text wrapper and split text into spans
            const text = element.textContent;
            const waveTextWrapper = document.createElement('span');
            waveTextWrapper.className = 'wave-text';
            waveTextWrapper.setAttribute('wave-effect-hint', 'true');

            waveTextWrapper.innerHTML = text
                .split("")
                .map(letter => `<span>${letter}</span>`)
                .join("");

            // Replace original content
            element.textContent = '';
            element.appendChild(waveTextWrapper);

            // Handle hover effects
            element.addEventListener("mouseenter", () => {
                const letters = element.querySelectorAll('.wave-text span');
                letters.forEach((letter, i) => {
                    setTimeout(() => {
                        letter.classList.remove("wave-out");
                        letter.classList.add("wave-in");
                    }, i * 50);
                });
            });

            element.addEventListener("mouseleave", () => {
                const letters = element.querySelectorAll('.wave-text span');
                letters.forEach((letter, i) => {
                    setTimeout(() => {
                        letter.classList.remove("wave-in");
                        letter.classList.add("wave-out");
                    }, (letters.length - 1 - i) * 50);
                });
            });
        });
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

    // Load header
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load header');
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                // Re-run setup for dynamically loaded content
                setupTextAnimation();
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
                setupTextAnimation();
            }
        });
});