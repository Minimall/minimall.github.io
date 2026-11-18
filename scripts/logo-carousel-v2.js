// Logo carousel: shows client logos in rows and swaps the row every few seconds.
// Works without the Motion library (logos stay visible, rows swap without animation).
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ===================================================================
    // CONFIGURATION (visual values unchanged from the previous version)
    // ===================================================================
    const CONFIG = {
        entrance: { blur: 0.25, stagger: 0.06 },          // seconds
        exit: { blur: 0.2, stagger: 0.04 },               // seconds
        interval: 4000,             // ms between row swaps
        initialDelay: 200,          // ms before the swap timer starts
        firstAnimationDelay: 150,   // ms before the first row animates in
        transitionOverlap: 100,     // ms between exit start and entrance start
        exitSafetyTimeout: 1500,    // ms: remove the old row even if its animation never reports done
        moveDistance: 40,           // px of vertical travel
        blurAmount: 10,             // px of blur during transitions
        hoverScale: 1.06,
        hoverSpeed: 200,            // ms for the hover colour change
        spring: {
            entrance: { stiffness: 160, damping: 16, mass: 1 },
            exit: { stiffness: 140, damping: 15, mass: 0.8 }
        },
        hoverFilter: 'grayscale(0) brightness(1) contrast(1)',
        reducedMotionFade: 0.3      // seconds: plain fade used when the user asks for reduced motion
    };

    // 3 logos per row for the 360-479px layout, 4 everywhere else
    function getLogosPerRow() {
        const width = window.innerWidth;
        return width >= 360 && width <= 479 ? 3 : 4;
    }

    // ===================================================================
    // LOGOS - add/remove here
    // ===================================================================
    const availableLogos = [
        { src: 'images/logos/ryanair.svg', alt: 'Ryanair', url: 'https://www.ryanair.com' },
        { src: 'images/logos/wcg.svg', alt: 'WCG', url: 'https://www.wcgclinical.com' },
        { src: 'images/logos/mars.svg', alt: 'Mars', url: 'https://www.mars.com' },
        { src: 'images/logos/rozetka.svg', alt: 'Rozetka', url: 'https://rozetka.com.ua' },
        { src: 'images/logos/datrics.svg', alt: 'Datrics', url: 'https://datrics.ai' },
        { src: 'images/logos/intel.svg', alt: 'Intel', url: 'https://www.intel.com' },
        { src: 'images/logos/hpe.svg', alt: 'HPE', url: 'https://www.hpe.com' },
        { src: 'images/logos/pumb.svg', alt: 'PUMB', url: 'https://www.pumb.ua' },
        { src: 'images/logos/plarium.svg', alt: 'Plarium', url: 'https://plarium.com' },
        { src: 'images/logos/karpatia.svg', alt: 'Karpatia', url: 'https://karpatia.insure' },
        { src: 'images/logos/cinderblock.svg', alt: 'Cinderblock', url: 'https://cinderblock.com' }
    ];

    const carousel = document.querySelector('.logo-carousel-container');
    const wrapper = document.querySelector('.logo-carousel');
    if (!carousel || availableLogos.length === 0) return;

    const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const hoverQuery = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
    const prefersReducedMotion = () => !!(motionQuery && motionQuery.matches);
    const canHover = () => !!(hoverQuery && hoverQuery.matches);

    // Motion may load late or not at all (blocked CDN, offline). Check on every use.
    function motionAnimate(el, keyframes, options) {
        const M = window.Motion;
        if (!M || typeof M.animate !== 'function') return null;
        try {
            return M.animate(el, keyframes, options);
        } catch (err) {
            return null;
        }
    }

    // Resolves when the animation ends, or at once when there is none.
    function finished(controls) {
        if (controls && typeof controls.then === 'function') {
            return Promise.resolve(controls).catch(() => {});
        }
        return Promise.resolve();
    }

    // ===================================================================
    // LOGO SETS
    // ===================================================================
    function shuffle(list) {
        const result = list.slice();
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    // Splits all logos into rows. Logos in "avoid" (the row on screen) go last,
    // so the next row never repeats what the visitor sees right now.
    function generateLogoSets(avoid) {
        const perRow = getLogosPerRow();
        const avoidSrc = new Set((avoid || []).map(logo => logo.src));
        const shuffled = shuffle(availableLogos);
        const ordered = shuffled.filter(l => !avoidSrc.has(l.src))
            .concat(shuffled.filter(l => avoidSrc.has(l.src)));

        const sets = [];
        for (let i = 0; i < ordered.length; i += perRow) {
            const set = ordered.slice(i, i + perRow);
            if (set.length < perRow) {
                // Fill the last row with logos that are not in it yet
                const fillers = shuffle(availableLogos.filter(l => !set.some(s => s.src === l.src)));
                while (set.length < perRow && fillers.length) set.push(fillers.pop());
                // Fewer logos than slots: repeat to fill
                let k = 0;
                while (set.length < perRow) set.push(availableLogos[k++ % availableLogos.length]);
            }
            sets.push(set);
        }
        return sets;
    }

    // ===================================================================
    // DOM
    // ===================================================================
    function setOverlayPosition(row) {
        row.style.position = 'absolute';
        row.style.top = '50%';
        row.style.left = '0';
        row.style.right = '0';
        row.style.transform = 'translate3d(0, -50%, 0)';
    }

    function addHoverEffects(item, img) {
        item.addEventListener('mouseenter', () => {
            if (!canHover()) return;
            item.style.transition = 'none';
            const controls = motionAnimate(item, { scale: CONFIG.hoverScale }, { type: 'spring', bounce: 0.3, duration: 0.5 });
            if (!controls) item.style.transform = 'scale(' + CONFIG.hoverScale + ')';
            img.style.transition = 'filter ' + CONFIG.hoverSpeed + 'ms cubic-bezier(0.4, 0, 0.2, 1), opacity ' + CONFIG.hoverSpeed + 'ms ease-out';
            img.style.filter = CONFIG.hoverFilter;
            img.style.opacity = '1';
        });

        item.addEventListener('mouseleave', () => {
            if (!canHover()) return;
            item.style.transition = 'none';
            const controls = motionAnimate(item, { scale: 1 }, { type: 'spring', bounce: 0.3, duration: 0.25 });
            if (!controls) item.style.transform = '';
            img.style.transition = 'filter ' + CONFIG.hoverSpeed + 'ms ease-out, opacity ' + CONFIG.hoverSpeed + 'ms ease-out';
            // Clearing the inline values hands control back to the stylesheet
            img.style.filter = '';
            img.style.opacity = '';
        });
    }

    function createLogoRow(logoSet) {
        const row = document.createElement('div');
        row.className = 'logo-carousel-row';
        row.dataset.logos = logoSet.map(l => l.src).join('|');

        logoSet.forEach(logo => {
            // A real link: keyboard, screen readers and middle-click all work
            const item = document.createElement('a');
            item.className = 'logo-carousel-item';
            item.href = logo.url;
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
            item.setAttribute('aria-label', logo.alt + ' (opens in a new tab)');

            const img = document.createElement('img');
            img.src = logo.src;
            img.alt = logo.alt;
            img.className = 'logo-carousel-img';
            img.decoding = 'async';
            // A missing file hides its slot instead of showing a broken image
            img.addEventListener('error', () => { item.style.visibility = 'hidden'; });

            addHoverEffects(item, img);
            item.appendChild(img);
            row.appendChild(item);
        });

        return row;
    }

    // ===================================================================
    // ANIMATIONS
    // ===================================================================
    function showWithoutAnimation(item) {
        item.style.opacity = '';
        item.style.filter = '';
        item.style.transition = '';
        item.style.willChange = '';
    }

    function animateLogosIn(row) {
        const items = Array.from(row.querySelectorAll('.logo-carousel-item'));
        const reduced = prefersReducedMotion();

        return Promise.all(items.map((item, index) => {
            item.style.opacity = '0';
            item.style.willChange = 'transform, opacity, filter';
            if (!reduced) item.style.filter = 'blur(' + CONFIG.blurAmount + 'px)';
            item.offsetHeight; // apply the start state before animating

            const delay = reduced ? 0 : index * CONFIG.entrance.stagger * 1000;
            return new Promise(resolve => {
                setTimeout(() => {
                    let controls;
                    if (reduced) {
                        controls = motionAnimate(item, { opacity: [0, 1] }, { duration: CONFIG.reducedMotionFade });
                    } else {
                        item.style.transition = 'filter ' + CONFIG.entrance.blur + 's ease-out';
                        item.style.filter = 'blur(0px)';
                        controls = motionAnimate(
                            item,
                            { y: [CONFIG.moveDistance, 0], opacity: [0, 1] },
                            Object.assign({ type: 'spring' }, CONFIG.spring.entrance)
                        );
                    }
                    if (!controls) {
                        showWithoutAnimation(item);
                        resolve();
                        return;
                    }
                    finished(controls).then(() => {
                        item.style.willChange = '';
                        item.style.transition = '';
                        resolve();
                    });
                }, delay);
            });
        }));
    }

    function animateLogosOut(row) {
        const items = Array.from(row.querySelectorAll('.logo-carousel-item'));
        const reduced = prefersReducedMotion();

        const all = Promise.all(items.map((item, index) => {
            item.style.willChange = 'transform, opacity, filter';
            const delay = reduced ? 0 : index * CONFIG.exit.stagger * 1000;
            return new Promise(resolve => {
                setTimeout(() => {
                    let controls;
                    if (reduced) {
                        controls = motionAnimate(item, { opacity: 0 }, { duration: CONFIG.reducedMotionFade });
                    } else {
                        item.style.transition = 'filter ' + CONFIG.exit.blur + 's ease-out';
                        item.style.filter = 'blur(' + CONFIG.blurAmount + 'px)';
                        controls = motionAnimate(
                            item,
                            { y: -CONFIG.moveDistance, opacity: 0 },
                            Object.assign({ type: 'spring' }, CONFIG.spring.exit)
                        );
                    }
                    finished(controls).then(resolve);
                }, delay);
            });
        }));

        // Never wait forever: a stuck animation must not leave the old row on screen
        const safety = new Promise(resolve => setTimeout(resolve, CONFIG.exitSafetyTimeout));
        return Promise.race([all, safety]);
    }

    // ===================================================================
    // CAROUSEL STATE
    // ===================================================================
    let logoSets = generateLogoSets();
    let activeIndex = 0;
    let intervalId = null;
    let isTransitioning = false;
    let hoverPaused = false;
    let focusPaused = false;
    let currentLogosPerRow = getLogosPerRow();
    let generation = 0; // bumps on every full reset, so stale callbacks do nothing

    function getRows() {
        return Array.from(carousel.querySelectorAll('.logo-carousel-row'));
    }

    function currentLogos() {
        const set = logoSets[activeIndex];
        return set || [];
    }

    // Removes every row and shows a fresh first row
    function resetCarousel() {
        generation++;
        isTransitioning = false;
        getRows().forEach(row => row.remove());
        logoSets = generateLogoSets();
        activeIndex = 0;
        const firstRow = createLogoRow(logoSets[0]);
        carousel.appendChild(firstRow);
        return firstRow;
    }

    async function switchToNextSet() {
        if (document.hidden || isTransitioning) return;
        isTransitioning = true;
        const gen = generation;

        let nextIndex = activeIndex + 1;
        if (nextIndex >= logoSets.length) {
            logoSets = generateLogoSets(currentLogos());
            nextIndex = 0;
        }

        // Keep only the newest row; anything older is a leftover
        const rows = getRows();
        const currentRow = rows.pop() || null;
        rows.forEach(row => row.remove());

        const nextRow = createLogoRow(logoSets[nextIndex]);
        nextRow.style.opacity = '0';
        setOverlayPosition(nextRow);
        if (currentRow) setOverlayPosition(currentRow);
        carousel.appendChild(nextRow);
        activeIndex = nextIndex;

        const exitDone = currentRow
            ? animateLogosOut(currentRow).then(() => currentRow.remove())
            : Promise.resolve();

        await new Promise(resolve => setTimeout(resolve, currentRow ? CONFIG.transitionOverlap : 0));
        if (gen !== generation) return; // a reset happened meanwhile
        const entranceDone = animateLogosIn(nextRow); // hides each logo first, so showing the row is safe
        nextRow.style.opacity = '1';
        await Promise.all([entranceDone, exitDone]);

        if (gen === generation) isTransitioning = false;
    }

    // ===================================================================
    // CONTROLS
    // ===================================================================
    function shouldRun() {
        return !document.hidden && !hoverPaused && !focusPaused;
    }

    function updateTimer() {
        if (shouldRun() && !intervalId) {
            intervalId = setInterval(switchToNextSet, CONFIG.interval);
        } else if (!shouldRun() && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    if (wrapper) {
        // Pause on mouse hover (mouse devices only, so a tap on a phone does not freeze it)
        wrapper.addEventListener('mouseenter', () => { if (canHover()) { hoverPaused = true; updateTimer(); } });
        wrapper.addEventListener('mouseleave', () => { hoverPaused = false; updateTimer(); });
        // Pause while a logo link has keyboard focus
        wrapper.addEventListener('focusin', () => { focusPaused = true; updateTimer(); });
        wrapper.addEventListener('focusout', (e) => {
            if (!wrapper.contains(e.relatedTarget)) { focusPaused = false; updateTimer(); }
        });
    }

    document.addEventListener('visibilitychange', updateTimer);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const perRow = getLogosPerRow();
            if (perRow === currentLogosPerRow) return;
            currentLogosPerRow = perRow;
            const row = resetCarousel();
            animateLogosIn(row);
        }, 250);
    }, { passive: true });

    // ===================================================================
    // START
    // ===================================================================
    carousel.innerHTML = '';
    const firstRow = resetCarousel();
    setTimeout(() => animateLogosIn(firstRow), CONFIG.firstAnimationDelay);
    setTimeout(updateTimer, CONFIG.initialDelay);
});
