
class BottomSheet {
    constructor() {
        this.sheet = document.querySelector('.bottom-sheet');
        this.overlay = document.querySelector('.overlay');
        this.carousel = document.querySelector('.carousel');
        this.images = this.carousel.querySelectorAll('img');
        this.currentIndex = 0;
        
        this.setupDots();
        this.setupGestures();
        this.setupCarousel();
        
        document.getElementById('openSheet').addEventListener('click', () => this.open());
        this.overlay.addEventListener('click', () => this.close());
    }
    
    setupDots() {
        const dotsContainer = document.querySelector('.carousel-dots');
        this.images.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        });
        this.dots = dotsContainer.querySelectorAll('.dot');
    }
    
    setupGestures() {
        let startY = 0;
        let isClosing = false;
        
        const onStart = (e) => {
            if (isClosing) return;
            startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            document.addEventListener(e.type === 'mousedown' ? 'mouseup' : 'touchend', onEnd);
        };
        
        const onEnd = (e) => {
            const currentY = e.type === 'mouseup' ? e.clientY : e.changedTouches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 100 && !isClosing) {
                isClosing = true;
                this.animateClose();
            }
            
            document.removeEventListener(e.type === 'mouseup' ? 'mouseup' : 'touchend', onEnd);
        };
        
        this.sheet.addEventListener('mousedown', onStart);
        this.sheet.addEventListener('touchstart', onStart, { passive: true });
    }
    
    setupCarousel() {
        let startX = 0;
        let currentTranslate = 0;
        
        const onStart = (e) => {
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            this.carousel.style.transition = 'none';
            document.addEventListener(e.type === 'mousedown' ? 'mousemove' : 'touchmove', onMove, { passive: false });
            document.addEventListener(e.type === 'mousedown' ? 'mouseup' : 'touchend', onEnd);
        };
        
        const onMove = (e) => {
            e.preventDefault();
            const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
            const diffX = currentX - startX;
            const diffY = Math.abs(currentY - (e.type === 'mousemove' ? e.clientY : e.touches[0].clientY));
            
            // Only apply horizontal transform if vertical movement isn't dominant
            if (diffY > Math.abs(diffX)) return;
            
            const transform = -this.currentIndex * 100 + (diffX / this.carousel.offsetWidth * 100);
            this.carousel.style.transform = `translateX(${transform}%) translateY(0)`;
            this.carousel.style.touchAction = 'pan-x';
        };
        
        const onEnd = (e) => {
            const currentX = e.type === 'mouseup' ? e.clientX : e.changedTouches[0].clientX;
            const diff = currentX - startX;
            
            this.carousel.style.transition = 'transform 0.3s ease-out';
            if (Math.abs(diff) > 100) {
                if (diff > 0 && this.currentIndex > 0) {
                    this.currentIndex--;
                } else if (diff < 0 && this.currentIndex < this.images.length - 1) {
                    this.currentIndex++;
                }
            }
            
            this.updateCarousel();
            document.removeEventListener(e.type === 'mouseup' ? 'mousemove' : 'touchmove', onMove);
            document.removeEventListener(e.type === 'mouseup' ? 'touchend' : 'touchend', onEnd);
        };
        
        this.carousel.addEventListener('mousedown', onStart);
        this.carousel.addEventListener('touchstart', onStart, { passive: true });
    }
    
    updateCarousel() {
        const offset = -this.currentIndex * 100;
        this.carousel.style.transform = `translateX(${offset}%)`;
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }
    
    open() {
        this.sheet.classList.add('open');
        this.overlay.classList.add('visible');
    }
    
    animateClose() {
        this.sheet.style.transform = 'translateY(100%)';
        this.sheet.style.transition = 'transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)';
        
        setTimeout(() => {
            this.sheet.classList.remove('open');
            this.overlay.classList.remove('visible');
            this.sheet.style.transform = '';
        }, 250);
    }
    
    close() {
        this.animateClose();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
        document.body.classList.add('has-safari-bar');
    }
    
    new BottomSheet();
});
