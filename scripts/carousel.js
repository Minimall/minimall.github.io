/**
 * Main Carousel Handler
 * Initializes the appropriate carousel based on device type
 * and coordinates interactions with grid items
 */

// Initialize carousel when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load needed components first
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

        // Load necessary components based on device
        const isMobile = window.matchMedia('(max-width: 788px)').matches;

        try {
            if (isMobile) {
                await loadScript('scripts/carousel/mobile-carousel.js');
            } else {
                await loadScript('scripts/carousel/desktop-carousel.js');
            }
            return true;
        } catch (error) {
            console.error('Failed to load carousel components:', error);
            return false;
        }
    }

    // Initialize the appropriate carousel based on device type
    function initializeCarousel() {
        const isMobile = window.matchMedia('(max-width: 788px)').matches;
        const gridItems = document.querySelectorAll('.grid-item');

        if (gridItems.length === 0) return;

        if (isMobile) {
            // Mobile implementation
            if (window.GridItemCarousel) {
                const gridCarousel = new window.GridItemCarousel();
                window.gridCarousel = gridCarousel;

                // Set up click handlers
                setupMobileClickHandlers(gridItems);
            } else {
                console.error('Mobile carousel component not loaded');
            }
        } else {
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
    }

    // Setup click handlers for mobile grid items
    function setupMobileClickHandlers(gridItems) {
        gridItems.forEach((item, index) => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.gridCarousel && window.gridCarousel.open) {
                    window.gridCarousel.open(gridItems, index);
                }
            });
        });
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