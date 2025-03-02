/**
 * Desktop Carousel Handler
 * Only initializes carousel for desktop devices
 */

// Initialize carousel when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load needed components
    loadComponents().then(() => {
        initializeCarousel();
    });

    // Function to load additional script components
    async function loadComponents() {
        // Helper function to load a script
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                // Skip if script is already loaded
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        try {
            // Only load desktop carousel
            await loadScript('scripts/carousel/desktop-carousel.js');
            return true;
        } catch (error) {
            console.error('Failed to load carousel components:', error);
            return false;
        }
    }

    // Initialize desktop carousel only
    function initializeCarousel() {
        // Skip carousel initialization on mobile
        const isMobile = window.matchMedia('(max-width: 788px)').matches;
        if (isMobile) return;
        
        const gridItems = document.querySelectorAll('.grid-item');
        if (gridItems.length === 0) return;

        // Desktop implementation
        if (window.DesktopCarousel) {
            const desktopCarousel = new window.DesktopCarousel();
            desktopCarousel.setGridItems(gridItems);
            window.gridCarousel = desktopCarousel;

            // Set up click handlers
            setupDesktopClickHandlers(gridItems, desktopCarousel);
        } else {
            console.error('Desktop carousel component not loaded');
        }
    }

    // Setup click handlers for desktop grid items
    function setupDesktopClickHandlers(gridItems, carousel) {
        gridItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                carousel.open(index);
            });
        });
    }
});