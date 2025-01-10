document.addEventListener('DOMContentLoaded', () => {
    const hoverWords = document.querySelectorAll('.hover-word');

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

        function showNextImage() {
            console.log(`Switching from image ${currentIndex + 1}`);
            currentIndex = (currentIndex + 1) % images.length;
            const timestamp = Date.now();
            hoverImage.src = `images/${images[currentIndex]}?t=${timestamp}`;
            console.log(`Switched to image ${currentIndex + 1}`);
        }

        const letters = hoverWord.querySelectorAll('.wave-text span');

        hoverWord.addEventListener('mouseenter', () => {
            updateWaveAnimation(letters, true);
            if (images.length && hoverImage) {
                currentIndex = 0;
                console.log('Starting image sequence');
                hoverImage.src = `images/${images[0]}?t=${Date.now()}`;
                hoverImage.style.opacity = '1';
                intervalId = setInterval(showNextImage, 800);
            }
        });

        hoverWord.addEventListener('mouseleave', () => {
            updateWaveAnimation(letters, false);
            clearInterval(intervalId);
            if (hoverImage) {
                hoverImage.style.opacity = '0';
            }
        });

        hoverWord.addEventListener('mousemove', updateImagePosition);
    });
});