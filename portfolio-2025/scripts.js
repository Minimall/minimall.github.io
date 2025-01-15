const hoverWords = document.querySelectorAll(".hover-word");
const hoveredWords = new Set();

const setupText = () => {
    hoverWords.forEach((word) => {
        const waveText = word.querySelector(".wave-text");
        if (!waveText) return;
        waveText.innerHTML = (word.dataset.text || waveText.textContent)
            .split("")
            .map((letter) => letter === " " ? "<span>&nbsp;</span>" : `<span>${letter}</span>`)
            .join("");
    });
};

const updateMousePosition = (e) => {
    document.querySelectorAll(".hover-image").forEach((img) => {
        img.style.left = `${e.clientX}px`;
        img.style.top = `${e.clientY}px`;
        img.classList.toggle("move-down", e.clientY < 240);
    });
};

const cycleImages = (word, img) => {
    const images = word.dataset.images?.split(",") || [];
    if (!images.length) return null;

    let currentIndex = 0;
    let cycleTimeout;
    let fadeTimeout;

    const showNextImage = () => {
        img.src = `./images/${images[currentIndex]}`;
        img.style.opacity = "1";

        if (images.length > 1) {
            fadeTimeout = setTimeout(() => {
                img.style.opacity = "0";
                currentIndex = (currentIndex + 1) % images.length;
                cycleTimeout = setTimeout(showNextImage, 0);
            }, 600);
        }
    };

    showNextImage();
    return () => {
        clearTimeout(cycleTimeout);
        clearTimeout(fadeTimeout);
        img.style.opacity = "0";
    };
};

const handleHover = (word, isEnter) => {
    const letters = word.querySelectorAll(".wave-text span");
    const img = word.querySelector(".hover-image");

    if (isEnter) {
        hoveredWords.add(word);
    } else {
        hoveredWords.delete(word);
    }

    letters.forEach((letter, i) => {
        setTimeout(
            () => {
                letter.classList.remove("wave-in", "wave-out");
                letter.classList.add(isEnter ? "wave-in" : "wave-out");
            },
            isEnter ? i * 50 : (letters.length - 1 - i) * 50
        );
    });

    if (img) {
        if (isEnter) {
            word.stopImageCycle = cycleImages(word, img);
        } else if (word.stopImageCycle) {
            word.stopImageCycle();
            word.stopImageCycle = null;
        }
    }
};

const triggerRandomWave = () => {
    const availableWords = Array.from(hoverWords).filter(
        (word) => !hoveredWords.has(word) && !word.classList.contains('read-more-link')
    );
    if (!availableWords.length) return;

    const randomWord =
        availableWords[Math.floor(Math.random() * availableWords.length)];
    const letters = randomWord.querySelectorAll(".wave-text span");

    letters.forEach((letter, i) => {
        setTimeout(() => letter.classList.add("wave-in"), i * 50);
        setTimeout(
            () => letter.classList.remove("wave-in"),
            letters.length * 50 + 300
        );
    });

    const nextWaveDelay = Math.random() * 3000 + 5000;
    setTimeout(triggerRandomWave, nextWaveDelay);
};

document.addEventListener("DOMContentLoaded", () => {
    setupText();
    
    const mainText = document.querySelector('.main-text');
    const readMoreLink = document.querySelector('.read-more-link');
    
    readMoreLink.addEventListener('click', () => {
        mainText.classList.toggle('expanded');
        const waveText = readMoreLink.querySelector('.wave-text');
        waveText.textContent = mainText.classList.contains('expanded') ? 'Show less' : 'Read more';
        setupText(); // Reinitialize the wave effect
    });
    window.addEventListener("mousemove", updateMousePosition, {
        passive: true,
    });

    hoverWords.forEach((word) => {
        word.addEventListener("mouseenter", () => handleHover(word, true));
        word.addEventListener("mouseleave", () => handleHover(word, false));
    });

    setTimeout(triggerRandomWave, 5000);
});
