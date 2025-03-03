/**
 * CSS Loader Utility
 * Handles dynamic loading of CSS files based on viewport and features
 */

// List of CSS modules with conditions for loading
const cssModules = [
    { path: 'styles/typography.css', always: true },
    { path: 'styles/layout.css', always: true },
    { path: 'styles/buttons.css', always: true },
    { path: 'styles/header.css', always: true },
    { path: 'styles/animation.css', always: true },
    { path: 'styles/links.css', always: true },
    { path: 'styles/case-studies.css', always: true },
    { path: 'styles/images.css', always: true },
    { path: 'styles/components.css', always: true },
    { path: 'styles/footer-animation.css', condition: () => document.querySelector('.footer2') !== null },
    { path: 'styles/marquee.css', condition: () => document.querySelector('.marquee-container') !== null },
    { path: 'styles/responsive.css', condition: () => window.matchMedia('(max-width: 788px)').matches },
    { path: 'styles/grid-elements.css', condition: () => document.querySelector('.grid-container') !== null }
];

// Function to check if CSS file is already loaded
function isCssLoaded(path) {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .some(link => link.href.includes(path));
}

// Function to dynamically load a CSS file
function loadCss(path) {
    if (isCssLoaded(path)) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;

        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${path}`));

        document.head.appendChild(link);
    });
}

// Function to load all required CSS files
function loadRequiredCss() {
    const promises = [];

    cssModules.forEach(module => {
        // Load if it's always required or its condition is met
        if (module.always || (module.condition && module.condition())) {
            if (!isCssLoaded(module.path)) {
                console.log(`Loading CSS module: ${module.path}`);
                promises.push(loadCss(module.path));
            }
        }
    });

    return Promise.all(promises);
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    loadRequiredCss().then(() => {
        console.log('All required CSS modules loaded');
    }).catch(error => {
        console.error('Error loading CSS modules:', error);
    });

    // Also check on resize for responsive modules
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            loadRequiredCss();
        }, 250);
    });
});

// Export for use in other scripts
window.cssLoader = {
    loadCss,
    loadRequiredCss
};