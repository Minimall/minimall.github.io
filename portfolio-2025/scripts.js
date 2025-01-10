
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
        const imageList = hoverWord.dataset.images ? hoverWord.dataset.images.split(',') : [];
        let currentIndex = 0;
        let timer = null;

        if (imageList.length > 0 && hoverImage) {
            hoverImage.src = `images/${imageList[0]}`;
        }

        function showNextImage() {
            currentIndex = (currentIndex + 1) % imageList.length;
            hoverImage.src = `images/${imageList[currentIndex]}`;
        }

        function handleHoverStart() {
            if (imageList.length <= 1) return;
            currentIndex = 0;
            hoverImage.src = `images/${imageList[0]}`;
            timer = setInterval(showNextImage, 800);
        }

        function handleHoverEnd() {
            clearInterval(timer);
            currentIndex = 0;
            hoverImage.src = `images/${imageList[0]}`;
        }

        const letters = hoverWord.querySelectorAll('.wave-text span');
        
        hoverWord.addEventListener('mouseenter', () => {
            updateAnimationDelays(letters, true);
            handleHoverStart();
        });
        
        hoverWord.addEventListener('mouseleave', () => {
            updateAnimationDelays(letters, false);
            handleHoverEnd();
        });
        
        hoverWord.addEventListener('mousemove', (e) => updateImagePosition(e, hoverImage));
    });
});
