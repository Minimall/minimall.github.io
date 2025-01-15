class PortfolioApp {
    constructor() {
        this.hoverWords = document.querySelectorAll('.hover-word');
        this.init();
    }

    init() {
        this.setupTextAnimations();
        this.setupEventListeners();
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