
document.addEventListener('DOMContentLoaded', () => {
    const hoverWords = document.querySelectorAll('.hover-word');

    // Split text into letters for each hover word
    hoverWords.forEach(word => {
        const waveText = word.querySelector('.wave-text');
        const text = word.dataset.text || waveText.textContent;
        waveText.innerHTML = text.split('').map(letter => 
            `<span>${letter}</span>`
        ).join('');
    });

    function updateAnimationDelays(letters, isHovering) {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isHovering ? 'wave-in' : 'wave-out');
            }, isHovering ? index * 50 : (letters.length - 1 - index) * 50);
        });
    }

    function updateImagePosition(e, hoverImage) {
        if (hoverImage) {
            hoverImage.style.left = e.pageX + 20 + 'px';
            hoverImage.style.top = e.pageY + 20 + 'px';
        }
    }

    hoverWords.forEach(hoverWord => {
        const hoverImage = hoverWord.querySelector('.hover-image');
        const images = hoverWord.dataset.images ? hoverWord.dataset.images.split(',') : [];
        let currentImageIndex = 0;
        let slideInterval;

        if (images.length > 0 && hoverImage) {
            hoverImage.src = `images/${images[0]}`;
        }

        function startSlideshow() {
            if (images.length <= 1) return;
            
            currentImageIndex = 0;
            hoverImage.src = `images/${images[currentImageIndex]}`;
            
            slideInterval = setInterval(() => {
                currentImageIndex = (currentImageIndex + 1) % images.length;
                hoverImage.src = `images/${images[currentImageIndex]}`;
            }, 800);
        }

        function stopSlideshow() {
            clearInterval(slideInterval);
            currentImageIndex = 0;
            hoverImage.src = `images/${images[0]}`;
        }

        const letters = hoverWord.querySelectorAll('.wave-text span');
        
        hoverWord.addEventListener('mouseenter', () => {
            updateAnimationDelays(letters, true);
            startSlideshow();
        });
        
        hoverWord.addEventListener('mouseleave', () => {
            updateAnimationDelays(letters, false);
            stopSlideshow();
        });
        
        hoverWord.addEventListener('mousemove', (e) => updateImagePosition(e, hoverImage));
    });
});
