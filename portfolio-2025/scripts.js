const hoverWords = document.querySelectorAll(".hover-word");
const hoveredWords = new Set();

const setupText = () => {
    hoverWords.forEach((word) => {
        const waveText = word.querySelector(".wave-text");
        if (!waveText) return;
        waveText.innerHTML = (word.dataset.text || waveText.textContent)
            .split("")
            .map((letter) => `<span>${letter}</span>`)
            .join("");
    });
};

const updateMousePosition = (e) => {
    document.querySelectorAll(".hover-image").forEach((img) => {
        img.style.left = `${e.clientX}px`;
        img.style.top = `${e.clientY}px`;
        img.classList.toggle("move-down", e.clientY < 480);
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

        fadeTimeout = setTimeout(() => {
            img.style.opacity = "0";
            currentIndex = (currentIndex + 1) % images.length;
            cycleTimeout = setTimeout(showNextImage, 0);
        }, 600);
    };

    if (images.length >= 1) showNextImage();
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
        (word) => !hoveredWords.has(word)
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

const setupTruncation = () => {
    const mainText = document.querySelector('.main-text');
    const truncationPoint = mainText.innerHTML.indexOf('skeuomorphic buttons');
    if (truncationPoint === -1) return;

    mainText.classList.add('truncated');
    
    const readMoreGradient = document.createElement('div');
    readMoreGradient.className = 'read-more-gradient';
    mainText.appendChild(readMoreGradient);

    const readMoreLink = document.createElement('div');
    readMoreLink.className = 'read-more-link';
    const readMoreText = document.createElement('div');
    readMoreText.className = 'read-more-text';
    readMoreText.innerHTML = 'Read More'.split('').map(letter => 
        `<span>${letter}</span>`).join('');
    readMoreLink.appendChild(readMoreText);
    mainText.appendChild(readMoreLink);

    // Add hover effect for read more text
    readMoreText.addEventListener('mouseenter', () => {
        const letters = readMoreText.querySelectorAll('span');
        letters.forEach((letter, i) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add('wave-in');
            }, i * 50);
        });
    });

    readMoreText.addEventListener('mouseleave', () => {
        const letters = readMoreText.querySelectorAll('span');
        letters.forEach((letter, i) => {
            setTimeout(() => {
                letter.classList.remove('wave-in', 'wave-out');
                letter.classList.add('wave-out');
            }, (letters.length - 1 - i) * 50);
        });
    });

    readMoreLink.addEventListener('click', () => {
        mainText.classList.add('expanding');
        mainText.style.maxHeight = mainText.scrollHeight + 'px';
        mainText.classList.remove('truncated');
        readMoreLink.style.display = 'none';
    });
};

document.addEventListener("DOMContentLoaded", () => {
    setupText();
    setupTruncation();
    window.addEventListener("mousemove", updateMousePosition, {
        passive: true,
    });

    hoverWords.forEach((word) => {
        word.addEventListener("mouseenter", () => handleHover(word, true));
        word.addEventListener("mouseleave", () => handleHover(word, false));
    });

    setTimeout(triggerRandomWave, 5000);
});
