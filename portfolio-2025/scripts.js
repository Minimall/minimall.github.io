
document.addEventListener('DOMContentLoaded', () => {
    const hoverWord = document.querySelector('.hover-word');
    const hoverImage = document.querySelector('.hover-image');
    const letters = document.querySelectorAll('.wave-text span');
    
    function updateAnimationDelays(isHovering) {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isHovering ? 'wave-in' : 'wave-out');
            }, isHovering ? index * 50 : (letters.length - 1 - index) * 50);
        });
    }
    
    hoverWord.addEventListener('mouseenter', () => updateAnimationDelays(true));
    hoverWord.addEventListener('mouseleave', () => updateAnimationDelays(false));
    const images = ['kharkiv1.jpg', 'kharkiv2.jpg', 'kharkiv3.jpg'];
    let currentImageIndex = 0;
    let slideInterval;

    function updateImagePosition(e) {
        hoverImage.style.left = e.pageX + 20 + 'px';
        hoverImage.style.top = e.pageY + 20 + 'px';
    }

    function startSlideshow() {
        slideInterval = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            hoverImage.src = `images/${images[currentImageIndex]}`;
        }, 500);
    }

    function stopSlideshow() {
        clearInterval(slideInterval);
        currentImageIndex = 0;
        hoverImage.src = `images/${images[currentImageIndex]}`;
    }

    hoverWord.addEventListener('mousemove', updateImagePosition);
    hoverWord.addEventListener('mouseenter', startSlideshow);
    hoverWord.addEventListener('mouseleave', stopSlideshow);
});
