
// Main application class to handle all functionality
class PortfolioApp {
    constructor() {
        // Core state
        this.hoverWords = document.querySelectorAll('.hover-word');
        this.hoveredSpans = new Set();
        this.intervalIncrease = 0;
        this.lastUsedParentIndex = -1;

        // Bind methods
        this.handleScroll = this.throttle(this.handleScroll.bind(this), 16);
        
        // Initialize
        this.init();
    }

    // Initialize all features
    init() {
        this.preloadAllImages();
        this.setupTextAnimations();
        this.setupEventListeners();
        this.startRandomWaveEffect();
    }

    // Preload all images for hover effects
    preloadAllImages() {
        this.hoverWords.forEach(word => {
            const images = word.dataset.images?.split(',') || [];
            images.forEach(url => {
                const img = new Image();
                img.src = `images/${url}`;
            });
        });
    }

    // Setup wave text animations
    setupTextAnimations() {
        this.hoverWords.forEach(word => {
            const waveText = word.querySelector('.wave-text');
            const text = word.dataset.text || waveText.textContent;
            waveText.innerHTML = text.split('').map(letter => 
                `<span>${letter}</span>`
            ).join('');
        });
    }

    // Performance utility: Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Handle image position updates
    handleImagePosition(hoverWord, e) {
        const hoverImage = hoverWord.querySelector('.hover-image');
        if (!hoverImage) return;

        requestAnimationFrame(() => {
            hoverImage.style.transform = `translate(${e.pageX}px, ${e.pageY}px) translateX(-50%)`;
        });
    }

    // Handle scroll events
    handleScroll() {
        this.hoverWords.forEach(word => {
            if (word.lastMouseEvent) {
                this.handleImagePosition(word, word.lastMouseEvent);
            }
        });
    }

    // Setup image cycling for hover effects
    setupImageCycle(hoverWord) {
        const hoverImage = hoverWord.querySelector('.hover-image');
        const images = hoverWord.dataset.images?.split(',') || [];
        let currentIndex = 0;
        let cycleTimeout = null;
        let hideTimeout = null;

        const cycleImage = () => {
            if (!images.length) return;
            
            hoverImage.src = `images/${images[currentIndex]}`;
            hoverImage.style.opacity = '1';

            hideTimeout = setTimeout(() => {
                hoverImage.style.opacity = '0';
                currentIndex = (currentIndex + 1) % images.length;
                cycleTimeout = setTimeout(cycleImage, 0);
            }, 600);
        };

        return {
            start: () => cycleImage(),
            stop: () => {
                clearTimeout(cycleTimeout);
                clearTimeout(hideTimeout);
                hoverImage.style.opacity = '0';
            }
        };
    }

    // Handle wave animation updates
    updateWaveAnimation(letters, isHovering) {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isHovering ? 'wave-in' : 'wave-out');
            }, isHovering ? index * 50 : (letters.length - 1 - index) * 50);
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        window.addEventListener('scroll', this.handleScroll);

        this.hoverWords.forEach(hoverWord => {
            const letters = hoverWord.querySelectorAll('.wave-text span');
            const imageCycle = this.setupImageCycle(hoverWord);

            hoverWord.addEventListener('mouseenter', () => {
                const waveText = hoverWord.querySelector('.wave-text');
                if (!this.hoveredSpans.has(waveText)) {
                    this.hoveredSpans.add(waveText);
                    this.intervalIncrease += 15;
                }
                this.updateWaveAnimation(letters, true);
                imageCycle.start();
            });

            hoverWord.addEventListener('mouseleave', () => {
                this.updateWaveAnimation(letters, false);
                imageCycle.stop();
            });

            hoverWord.addEventListener('mousemove', (e) => {
                hoverWord.lastMouseEvent = e;
                this.handleImagePosition(hoverWord, e);
            });
        });
    }

    // Random wave effect implementation
    triggerRandomWave() {
        const mainText = document.querySelector('.main-text');
        const allWaveSpans = mainText.querySelectorAll('.wave-text span');
        
        // Group spans by their parent elements
        const randomSpanSet = Array.from(allWaveSpans).reduce((acc, span) => {
            const parent = span.closest('.wave-text');
            if (!acc.has(parent)) acc.set(parent, []);
            acc.get(parent).push(span);
            return acc;
        }, new Map());

        const parents = Array.from(randomSpanSet.keys())
            .filter(parent => !this.hoveredSpans.has(parent));
        
        if (!parents.length) return;

        // Select random parent, avoiding consecutive repeats
        let randomParentIndex;
        do {
            randomParentIndex = Math.floor(Math.random() * parents.length);
        } while (randomParentIndex === this.lastUsedParentIndex && parents.length > 1);

        this.lastUsedParentIndex = randomParentIndex;
        const spans = randomSpanSet.get(parents[randomParentIndex]);

        // Animate spans
        spans.forEach((span, index) => {
            setTimeout(() => span.classList.add('wave-in'), index * 50);
            setTimeout(() => {
                span.classList.remove('wave-in');
                span.style.color = '';
            }, spans.length * 50 + 300);
        });

        // Schedule next wave
        const baseInterval = Math.random() * 3000 + 5000;
        const adjustedInterval = baseInterval * (1 + this.intervalIncrease / 100);
        setTimeout(() => this.triggerRandomWave(), adjustedInterval);
    }

    // Start the random wave effect
    startRandomWaveEffect() {
        setTimeout(() => this.triggerRandomWave(), 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});
