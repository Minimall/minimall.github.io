class PortfolioApp {
    constructor() {
        this.hoverWords = document.querySelectorAll('.hover-word');
        this.observedElements = new Set();
        this.init();
    }

    init() {
        this.setupTextAnimations();
        this.setupEventListeners();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log(`Element ${entry.target.textContent} is ${entry.isIntersecting ? 'visible' : 'hidden'}`);
                if (entry.isIntersecting) {
                    this.observedElements.add(entry.target);
                    console.log('Added to observed elements, total:', this.observedElements.size);
                } else {
                    this.observedElements.delete(entry.target);
                    console.log('Removed from observed elements, total:', this.observedElements.size);
                }
            });
        }, { threshold: 0.1 });

        this.hoverWords.forEach(word => {
            console.log('Observing word:', word.textContent);
            observer.observe(word);
        });
    }

    preloadAllImages() {
        // Removed image preloading
    }

    setupTextAnimations() {
        this.hoverWords.forEach(word => {
            const waveText = word.querySelector('.wave-text');
            if (!waveText) return;
            const text = word.dataset.text || waveText.textContent;
            waveText.innerHTML = text.split('').map(letter => 
                `<span>${letter}</span>`
            ).join('');
        });
    }

    updateMousePosition(e) {
        const hoverWord = e.target.closest('.hover-word');
        if (!hoverWord) return;
        
        const rect = hoverWord.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        document.documentElement.style.setProperty('--mouse-x', `${x}px`);
        document.documentElement.style.setProperty('--mouse-y', `${y}px`);
    }

    setupImageCycle(hoverWord) {
        return { start: () => {}, stop: () => {} };
    }

    updateWaveAnimation(letters, isHovering) {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isHovering ? 'wave-in' : 'wave-out');
            }, isHovering ? index * 50 : (letters.length - 1 - index) * 50);
        });
    }

    setupEventListeners() {
        this.hoverWords.forEach(hoverWord => {
            const letters = hoverWord.querySelectorAll('.wave-text span');
            
            hoverWord.addEventListener('mouseenter', () => {
                this.updateWaveAnimation(letters, true);
            });

            hoverWord.addEventListener('mouseleave', () => {
                this.updateWaveAnimation(letters, false);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});