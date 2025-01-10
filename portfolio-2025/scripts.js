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
});