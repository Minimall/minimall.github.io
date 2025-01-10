document.addEventListener('DOMContentLoaded', () => {
    // Preload images
    function preloadImages(imageUrls) {
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = `images/${url}`;
        });
    }

    const hoverWords = document.querySelectorAll('.hover-word');
    // Preload all hover word images
    hoverWords.forEach(word => {
        const images = word.dataset.images?.split(',') || [];
        preloadImages(images);
    });

    // Split text into letters for wave animation
    hoverWords.forEach(word => {
        const waveText = word.querySelector('.wave-text');
        const text = word.dataset.text || waveText.textContent;
        waveText.innerHTML = text.split('').map(letter => 
            `<span>${letter}</span>`
        ).join('');
    });

    function updateWaveAnimation(letters, isHovering) {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isHovering ? 'wave-in' : 'wave-out');
            }, isHovering ? index * 50 : (letters.length - 1 - index) * 50);
        });
    }

    hoverWords.forEach(hoverWord => {
        const hoverImage = hoverWord.querySelector('.hover-image');
        const images = hoverWord.dataset.images?.split(',') || [];
        let currentIndex = 0;
        let intervalId = null;

        function updateImagePosition(e) {
            if (!hoverImage) return;
            hoverImage.style.left = `${e.pageX + 20}px`;
            hoverImage.style.top = `${e.pageY + 20}px`;
        }

        function cycleImage() {
            // Show image
            hoverImage.src = `images/${images[currentIndex]}`;
            hoverImage.style.opacity = '1';

            // Set timeout to hide after 600ms
            hideTimeout = setTimeout(() => {
                hoverImage.style.opacity = '0';

                // Prepare next image
                currentIndex = (currentIndex + 1) % images.length;

                // Schedule next cycle
                cycleTimeout = setTimeout(cycleImage, 0);
            }, 600);
        }

        const letters = hoverWord.querySelectorAll('.wave-text span');

        hoverWord.addEventListener('mouseenter', () => {
            const waveText = hoverWord.querySelector('.wave-text');
            if (!hoveredSpans.has(waveText)) {
                hoveredSpans.add(waveText);
                intervalIncrease += 15; // Add 15% for each new hover
            }
            updateWaveAnimation(letters, true);
            if (images.length && hoverImage) {
                currentIndex = 0;
                cycleImage();
            }
        });

        let cycleTimeout = null;
        let hideTimeout = null;

        hoverWord.addEventListener('mouseleave', () => {
            updateWaveAnimation(letters, false);
            if (hoverImage) {
                if (cycleTimeout) clearTimeout(cycleTimeout);
                if (hideTimeout) clearTimeout(hideTimeout);
                hoverImage.style.opacity = '0';
                currentIndex = 0;
            }
        });

        hoverWord.addEventListener('mousemove', updateImagePosition);
    });

    // Random wave animation feature
    let lastUsedParentIndex = -1;
    const hoveredSpans = new Set();
    let intervalIncrease = 0; // Track total interval increase
    
    function triggerRandomWave() {
        const mainText = document.querySelector('.main-text');
        const allWaveSpans = mainText.querySelectorAll('.wave-text span');
        const randomSpanSet = Array.from(allWaveSpans).reduce((acc, span) => {
            const parent = span.closest('.wave-text');
            if (!acc.has(parent)) {
                acc.set(parent, []);
            }
            acc.get(parent).push(span);
            return acc;
        }, new Map());

        const parents = Array.from(randomSpanSet.keys()).filter(parent => !hoveredSpans.has(parent));
        if (parents.length === 0) return; // Skip if all spans have been hovered
        let randomParentIndex;
        
        // Ensure we don't pick the same parent twice in a row
        do {
            randomParentIndex = Math.floor(Math.random() * parents.length);
        } while (randomParentIndex === lastUsedParentIndex && parents.length > 1);
        
        lastUsedParentIndex = randomParentIndex;
        const spans = randomSpanSet.get(parents[randomParentIndex]);

        spans.forEach((span, index) => {
            // Wave in
            setTimeout(() => {
                span.style.color = '#8A2BE2';
                span.classList.add('wave-in');
            }, index * 50);

            // Hold
            setTimeout(() => {
                // Wave out
                spans.forEach((s, i) => {
                    setTimeout(() => {
                        s.classList.remove('wave-in');
                        s.style.color = '';
                    }, i * 50);
                });
            }, spans.length * 50 + 300);
        });

        // Schedule next random wave with increased interval based on hover count
        const baseInterval = Math.random() * 3000 + 5000;
        const adjustedInterval = baseInterval * (1 + intervalIncrease / 100);
        setTimeout(triggerRandomWave, adjustedInterval);
    }

    // Start the random wave effect after a delay
    setTimeout(triggerRandomWave, 5000);
});