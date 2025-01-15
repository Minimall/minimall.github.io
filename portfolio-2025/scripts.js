class PortfolioApp {
    constructor() {
        this.hoverWords = document.querySelectorAll('.hover-word');
        this.previewContainer = null;
        this.currentInterval = null;
        this.init();
    }

    createPreviewContainer() {
        const container = document.createElement('div');
        container.className = 'image-preview';
        document.body.appendChild(container);
        return container;
    }

    handleImagePreview(event, images) {
        if (!this.previewContainer) {
            this.previewContainer = this.createPreviewContainer();
        }

        const imageArray = images.split(',');
        let currentIndex = 0;

        const updatePreviewPosition = (e) => {
            const offset = 20;
            const x = e.clientX + offset;
            const y = e.clientY + offset;
            this.previewContainer.style.transform = `translate(${x}px, ${y}px)`;
        };

        const showImage = (imagePath) => {
            this.previewContainer.style.opacity = '1';
            this.previewContainer.style.backgroundImage = `url(${imagePath.trim()})`;
        };

        if (imageArray.length > 1) {
            this.currentInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % imageArray.length;
                showImage(imageArray[currentIndex]);
            }, 1000);
        }

        showImage(imageArray[0]);
        document.addEventListener('mousemove', updatePreviewPosition);

        return () => {
            document.removeEventListener('mousemove', updatePreviewPosition);
            if (this.currentInterval) {
                clearInterval(this.currentInterval);
                this.currentInterval = null;
            }
            this.previewContainer.style.opacity = '0';
        };
    }

    init() {
        this.setupTextAnimations();
        this.setupEventListeners();
        this.setupImagePreviews();
    }

    setupImagePreviews() {
        const previewElements = document.querySelectorAll('[data-preview]');
        previewElements.forEach(element => {
            let cleanup = null;
            element.addEventListener('mouseenter', (e) => {
                cleanup = this.handleImagePreview(e, element.dataset.preview);
            });
            element.addEventListener('mouseleave', () => {
                if (cleanup) cleanup();
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