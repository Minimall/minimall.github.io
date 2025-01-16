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
    if (!word.hasAttribute('wave-effect-hint')) return;
    
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

const setupCollapsibleLink = () => {
    const link = document.querySelector('.collapsible-link');
    if (!link) return;

    link.innerHTML = link.textContent
        .split("")
        .map((letter) => `<span>${letter}</span>`)
        .join("");

    const letters = link.querySelectorAll('span');
    letters.forEach((letter, i) => {
        setTimeout(() => letter.classList.add("wave-in"), i * 50);
        setTimeout(() => letter.classList.remove("wave-in"), letters.length * 50 + 300);
    });
};

const toggleCollapsible = () => {
    const content = document.querySelector('.collapsible-content');
    const links = document.querySelectorAll('.collapsible-link');
    if (content && content.classList.contains('active')) {
        content.classList.remove('active');
        links.forEach(link => link.classList.remove('hidden'));
    } else if (content) {
        content.classList.add('active');
        links.forEach(link => link.classList.add('hidden'));
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setupCollapsibleLink();
    document.querySelectorAll('.collapsible-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCollapsible();
        });
    });
    setupText();
    window.addEventListener("mousemove", updateMousePosition, {
        passive: true,
    });

    hoverWords.forEach((word) => {
        word.addEventListener("mouseenter", () => handleHover(word, true));
        word.addEventListener("mouseleave", () => handleHover(word, false));
    });

    setTimeout(triggerRandomWave, 5000);
    // Load header
    fetch('header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header');
            }
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
            // Fallback header if loading fails
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = `
                    <nav>
                        <a href="index.html">Dmytro Dvornichenko</a>
                        <div>
                            <a href="mailto:email@example.com">Email</a>
                            <a href="https://linkedin.com/in/username">LinkedIn</a>
                            <a href="https://twitter.com/username">Twitter</a>
                        </div>
                    </nav>`;
            }
        });
});