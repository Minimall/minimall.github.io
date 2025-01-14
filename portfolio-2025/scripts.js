class PortfolioApp {
    constructor() {
        this.hoverWords = document.querySelectorAll('.hover-word');
        this.hoveredSpans = new Set();
        this.intervalIncrease = 0;
        this.lastUsedParentIndex = -1;
        this.observedElements = new Set();

        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.preloadAllImages();
        this.setupTextAnimations();
        this.setupEventListeners();
        this.startRandomWaveEffect();
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
        this.hoverWords.forEach(word => {
            const images = word.dataset.images?.split(',') || [];
            images.forEach(url => {
                const img = new Image();
                img.onerror = () => console.error(`Failed to load image: ${url}`);
                img.src = `images/${url}`;
            });
        });
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
        const hoverImage = hoverWord.querySelector('.hover-image');
        if (!hoverImage) return { start: () => {}, stop: () => {} };

        const images = hoverWord.dataset.images?.split(',') || [];
        let currentIndex = 0;
        let cycleTimeout = null;
        let hideTimeout = null;

        const cycleImage = () => {
            if (!images.length) {
                console.warn('No images specified for hover word:', hoverWord.dataset.text);
                return;
            }

            const imagePath = `images/${images[currentIndex]}`;
            console.log('Loading image:', imagePath);
            const tempImage = new Image();
            tempImage.onload = () => {
                console.log('Image loaded successfully:', imagePath);
                hoverImage.src = imagePath;
                hoverImage.style.opacity = '1';
            };
            tempImage.onerror = () => {
                console.error(`Failed to load image: ${imagePath}`);
                hoverImage.style.opacity = '0';
            };
            tempImage.src = imagePath;

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

    updateWaveAnimation(letters, isHovering) {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add(isHovering ? 'wave-in' : 'wave-out');
            }, isHovering ? index * 50 : (letters.length - 1 - index) * 50);
        });
    }

    setupEventListeners() {
        window.addEventListener('mousemove', this.updateMousePosition.bind(this), { passive: true });
        window.addEventListener('resize', () => {
            this.observedElements.clear();
            this.hoverWords.forEach(word => {
                if (word.getBoundingClientRect().top < window.innerHeight) {
                    this.observedElements.add(word);
                }
            });
        }, { passive: true });

        this.hoverWords.forEach(hoverWord => {
            if (!this.observedElements.has(hoverWord)) return;

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
        });
    }

    triggerRandomWave() {
        const mainText = document.querySelector('.main-text');
        if (!mainText) return;

        const allWaveSpans = mainText.querySelectorAll('.wave-text span');
        const randomSpanSet = Array.from(allWaveSpans).reduce((acc, span) => {
            const parent = span.closest('.wave-text');
            if (!acc.has(parent)) acc.set(parent, []);
            acc.get(parent).push(span);
            return acc;
        }, new Map());

        const parents = Array.from(randomSpanSet.keys())
            .filter(parent => !this.hoveredSpans.has(parent));

        if (!parents.length) return;

        let randomParentIndex;
        do {
            randomParentIndex = Math.floor(Math.random() * parents.length);
        } while (randomParentIndex === this.lastUsedParentIndex && parents.length > 1);

        this.lastUsedParentIndex = randomParentIndex;
        const spans = randomSpanSet.get(parents[randomParentIndex]);

        spans.forEach((span, index) => {
            setTimeout(() => span.classList.add('wave-in'), index * 50);
            setTimeout(() => {
                span.classList.remove('wave-in');
                span.style.color = '';
            }, spans.length * 50 + 300);
        });

        const baseInterval = Math.random() * 3000 + 5000;
        const adjustedInterval = baseInterval * (1 + this.intervalIncrease / 100);
        setTimeout(() => this.triggerRandomWave(), adjustedInterval);
    }

    startRandomWaveEffect() {
        setTimeout(() => this.triggerRandomWave(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});