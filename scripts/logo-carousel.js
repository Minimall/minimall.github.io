document.addEventListener('DOMContentLoaded', function() {
    // ===================================================================
    // ⏱️ TIMING CONFIGURATION - Optimized for 60fps performance
    // ===================================================================
    const TIMING_CONFIG = {
        // 🎬 ANIMATION DURATIONS (in seconds) - Optimized for smooth 60fps
        animations: {
            entrance: {
                movement: 0.4,      // Slightly longer for smoother motion
                blur: 0.25,         // Optimized blur duration
                stagger: 0.06       // Refined stagger timing
            },
            exit: {
                movement: 0.35,     // Slightly faster exit
                blur: 0.2,          // Quick blur transition
                stagger: 0.04       // Tighter exit stagger
            }
        },
        
        // 🔄 CAROUSEL BEHAVIOR (in milliseconds)
        carousel: {
            interval: 4000,         // Time between each logo set transition
            initialDelay: 200,     // Delay before starting the carousel
            firstAnimationDelay: 150, // Slightly longer for smooth start
            transitionOverlap: 100  // Delay for entrance/exit overlap
        },
        
        // ⚡ TECHNICAL TIMINGS (in milliseconds) - Performance optimized
        technical: {
            exitBuffer: 0.3,        // Reduced buffer for faster transitions
            hoverAnimationSpeed: 200 // Faster hover for better responsiveness
        },
        
        // 🎨 VISUAL CONFIGURATION - All visual parameters centralized
        visual: {
            layout: {
                // Responsive logos per row based on viewport
                getLogosPerRow: function() {
                    const width = window.innerWidth;
                    // Show 3 logos for 360-479px breakpoint
                    if (width >= 360 && width <= 479) {
                        return 3;
                    }
                    // Default to 4 logos for all other breakpoints
                    return 4;
                }
            },
            animation: {
                moveDistance: 40,   // Pixels to move during entrance/exit (Y-axis)
                blurAmount: 10,     // Blur amount in pixels for transitions
                hoverScale: 1.06,     // Scale factor on hover (1.0 = normal size)
                spring: {
                    entrance: {
                        stiffness: 160,    // How quickly it reaches target (50-200)
                        damping: 16,       // How much bounce/overshoot (5-30)
                        mass: 1           // How heavy it feels (0.5-3)
                    },
                    exit: {
                        stiffness: 140,    // Slightly snappier exit
                        damping: 15,       // More damped for smoother exit
                        mass: 0.8         // Lighter feel for exit
                    }
                }
            },
            filters: {
                hover: {
                    grayscale: 0,   // Grayscale amount on hover (0-1)
                    brightness: 1,  // Brightness on hover (0-2+)
                    contrast: 1     // Contrast on hover (0-2+)
                }
            }
        }
    };
    
    // Legacy support - map to old ANIMATION_CONFIG for compatibility
    const ANIMATION_CONFIG = TIMING_CONFIG.animations;
    
    // ===================================================================
    // LOGO CONFIGURATION - Add/remove logos here
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
    if (!carousel) return;
    
    // Clear existing content
    carousel.innerHTML = '';
    
    // ===================================================================
    // LOGO RANDOMIZATION LOGIC
    // ===================================================================
    function generateLogoSets() {
        const totalLogos = availableLogos.length;
        const logosPerRow = TIMING_CONFIG.visual.layout.getLogosPerRow();
        const shuffled = [...availableLogos].sort(() => Math.random() - 0.5);
        const sets = [];
        
        // Create sets of 4 logos, ensuring variety
        for (let i = 0; i < shuffled.length; i += logosPerRow) {
            const set = shuffled.slice(i, i + logosPerRow);
            // If last set has fewer than 4, fill with random ones from previous sets
            if (set.length < logosPerRow) {
                while (set.length < logosPerRow) {
                    const randomLogo = shuffled[Math.floor(Math.random() * (shuffled.length - set.length))];
                    if (!set.some(logo => logo.src === randomLogo.src)) {
                        set.push(randomLogo);
                    }
                }
            }
            sets.push(set);
        }
        
        return sets;
    }
    
    // ===================================================================
    // CAROUSEL STATE AND LOGIC
    // ===================================================================
    let activeIndex = 0;
    let logoSets = generateLogoSets();
    let intervalId = null;
    let isPaused = false;
    let currentLogosPerRow = TIMING_CONFIG.visual.layout.getLogosPerRow();
    
    // Regenerate logo sets when viewport changes the logos per row
    function handleViewportChange() {
        const newLogosPerRow = TIMING_CONFIG.visual.layout.getLogosPerRow();
        if (newLogosPerRow !== currentLogosPerRow) {
            currentLogosPerRow = newLogosPerRow;
            logoSets = generateLogoSets();
            activeIndex = 0; // Reset to first set
            
            // Clear current content and restart with new configuration
            const currentRow = carousel.querySelector('.logo-carousel-row');
            if (currentRow) {
                currentRow.remove();
            }
            
            // Create and show first row with new configuration
            const firstRow = createLogoRow(logoSets[0], true);
            carousel.appendChild(firstRow);
            
            // Animate in the new row
            setTimeout(() => {
                requestAnimationFrame(() => {
                    animateLogosIn(firstRow);
                });
            }, 100);
        }
    }
    
    // Create single carousel row with performance optimizations
    function createLogoRow(logoSet, isVisible = false) {
        const row = document.createElement('div');
        row.className = 'logo-carousel-row';
        row.style.opacity = isVisible ? '1' : '0';
        
        // GPU acceleration hints for the row with pixel-perfect positioning
        row.style.willChange = 'transform, opacity';
        row.style.transform = 'translate3d(0, 0, 0)'; // Force hardware acceleration with pixel precision
        
        logoSet.forEach((logo, index) => {
            const logoContainer = document.createElement('div');
            logoContainer.className = 'logo-carousel-item';
            
            // Performance optimizations for each logo container with SVG-optimized transforms
            logoContainer.style.willChange = 'transform, filter, opacity';
            logoContainer.style.transform = 'translate3d(0, 0, 0)'; // Pixel-perfect GPU layer
            logoContainer.style.backfaceVisibility = 'hidden'; // Optimize for transforms
            logoContainer.style.transformOrigin = '50% 50%'; // Ensure centered scaling
            
            const logoImg = document.createElement('img');
            logoImg.src = logo.src;
            logoImg.alt = logo.alt;
            logoImg.className = 'logo-carousel-img';
            
            // Optimize SVG image rendering with pixel-perfect positioning
            logoImg.style.willChange = 'filter, opacity';
            logoImg.style.transform = 'translate3d(0, 0, 0)';
            
            // Add click functionality to open URL in new tab
            logoContainer.addEventListener('click', (e) => {
                e.preventDefault();
                if (logo.url) {
                    window.open(logo.url, '_blank', 'noopener,noreferrer');
                }
            });
            
            // Store initial computed styles for proper restoration
            const initialFilter = window.getComputedStyle(logoImg).filter;
            const initialOpacity = window.getComputedStyle(logoImg).opacity;
            
            // Optimized hover interactions using CSS transitions
            logoContainer.addEventListener('mouseenter', () => {
                // Clear any CSS transitions that might conflict
                logoContainer.style.transition = 'none';
                
                // SVG-optimized scaling with pixel-perfect positioning
                Motion.animate(
                    logoContainer,
                    { 
                        scale: TIMING_CONFIG.visual.animation.hoverScale,
                        // Ensure transform-origin is centered for crisp SVG scaling
                        transformOrigin: "50% 50%"
                    },
                    { 
                        type: "spring",
                        bounce: 0.3,
                        duration: 0.5
                    }
                );
                
                logoImg.style.transition = `filter ${TIMING_CONFIG.technical.hoverAnimationSpeed}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${TIMING_CONFIG.technical.hoverAnimationSpeed}ms ease-out`;
                logoImg.style.filter = `grayscale(${TIMING_CONFIG.visual.filters.hover.grayscale}) brightness(${TIMING_CONFIG.visual.filters.hover.brightness}) contrast(${TIMING_CONFIG.visual.filters.hover.contrast})`;
                logoImg.style.opacity = '1';
                // SVG-specific rendering for crisp scaling
                logoImg.style.imageRendering = 'auto';
                logoImg.style.shapeRendering = 'geometricPrecision';
            });
            
            logoContainer.addEventListener('mouseleave', () => {
                // Clear any CSS transitions that might conflict
                logoContainer.style.transition = 'none';
                
                // SVG-optimized scale down with pixel-perfect positioning
                Motion.animate(
                    logoContainer,
                    { 
                        scale: 1,
                        transformOrigin: "50% 50%"
                    },
                    { 
                        type: "spring",
                        bounce: 0.3,
                        duration: 0.25
                    }
                );
                
                logoImg.style.transition = `filter ${TIMING_CONFIG.technical.hoverAnimationSpeed}ms ease-out, opacity ${TIMING_CONFIG.technical.hoverAnimationSpeed}ms ease-out`;
                logoImg.style.filter = initialFilter;
                logoImg.style.opacity = initialOpacity;
                // Reset SVG rendering properties
                logoImg.style.imageRendering = '';
                logoImg.style.shapeRendering = '';
            });
            
            logoContainer.appendChild(logoImg);
            row.appendChild(logoContainer);
        });
        
        return row;
    }
    
    // ===================================================================
    // ANIMATION FUNCTIONS - 60fps Optimized with CSS Animations
    // ===================================================================
    function animateLogosIn(row) {
        const logos = row.querySelectorAll('.logo-carousel-item');
        
        logos.forEach((logo, index) => {
            // Reset to initial state - clear any existing transforms first
            logo.style.transform = 'translate3d(0, 0, 0)';
            logo.style.opacity = '0';
            logo.style.filter = `blur(${TIMING_CONFIG.visual.animation.blurAmount}px)`;
            logo.style.willChange = 'transform, opacity, filter';
            
            // Force a reflow to ensure initial state is applied
            logo.offsetHeight;
            
            // Apply spring animation with staggered delay
            const delay = index * ANIMATION_CONFIG.entrance.stagger * 1000;
            
            setTimeout(() => {
                // Handle blur separately with CSS transition to avoid negative values
                logo.style.transition = `filter ${ANIMATION_CONFIG.entrance.blur}s ease-out`;
                logo.style.filter = 'blur(0px)';
                
                // Use Motion.animate for spring physics on position and opacity only
                Motion.animate(
                    logo,
                    {
                        y: [TIMING_CONFIG.visual.animation.moveDistance, 0],  // FROM below TO final position
                        opacity: [0, 1]  // FROM invisible TO visible
                    },
                    {
                        type: "spring",
                        stiffness: TIMING_CONFIG.visual.animation.spring.entrance.stiffness,
                        damping: TIMING_CONFIG.visual.animation.spring.entrance.damping,
                        mass: TIMING_CONFIG.visual.animation.spring.entrance.mass
                    }
                ).then(() => {
                    // Clean up willChange and transition after animation completes
                    logo.style.willChange = 'auto';
                    logo.style.transition = '';
                });
            }, delay);
        });
    }
    
    function animateLogosOut(row) {
        const logos = row.querySelectorAll('.logo-carousel-item');
        
        return new Promise((resolve) => {
            const totalLogos = logos.length;
            
            if (totalLogos === 0) {
                resolve(true);
                return;
            }
            
            let completedAnimations = 0;
            
            Array.from(logos).forEach((logo, index) => {
                // Set willChange for optimal performance
                logo.style.willChange = 'transform, opacity, filter';
                
                const delay = index * ANIMATION_CONFIG.exit.stagger * 1000;
                
                setTimeout(() => {
                    // Handle blur separately with CSS transition to avoid negative values
                    logo.style.transition = `filter ${ANIMATION_CONFIG.exit.blur}s ease-out`;
                    logo.style.filter = `blur(${TIMING_CONFIG.visual.animation.blurAmount}px)`;
                    
                    // Use Motion.animate for spring physics on position and opacity only
                    Motion.animate(
                        logo,
                        {
                            y: -TIMING_CONFIG.visual.animation.moveDistance, // Move upward
                            opacity: 0
                        },
                        {
                            type: "spring",
                            stiffness: TIMING_CONFIG.visual.animation.spring.exit.stiffness,
                            damping: TIMING_CONFIG.visual.animation.spring.exit.damping,
                            mass: TIMING_CONFIG.visual.animation.spring.exit.mass
                        }
                    ).then(() => {
                        // Clean up willChange and transition properties
                        logo.style.willChange = 'auto';
                        logo.style.transition = '';
                        
                        completedAnimations++;
                        if (completedAnimations === totalLogos) {
                            resolve(true);
                        }
                    });
                }, delay);
            });
        });
    }
    
    async function switchToNextSet() {
        // Get next logo set
        const nextIndex = (activeIndex + 1) % logoSets.length;
        
        // If we've cycled through all sets, regenerate them
        if (nextIndex === 0) {
            logoSets = generateLogoSets();
        }
        
        const currentRow = carousel.querySelector('.logo-carousel-row');
        
        // Create new row immediately
        const nextRow = createLogoRow(logoSets[nextIndex], false);
        nextRow.style.opacity = '0';
        
        if (currentRow) {
            // Get current row position for perfect alignment
            const containerRect = carousel.getBoundingClientRect();
            const currentRowRect = currentRow.getBoundingClientRect();
            
            // Position both rows absolutely to overlay each other in exactly the same position
            currentRow.style.position = 'absolute';
            currentRow.style.top = '50%';
            currentRow.style.left = '0';
            currentRow.style.right = '0';
            currentRow.style.transform = 'translate3d(0, -50%, 0)';
            
            nextRow.style.position = 'absolute';
            nextRow.style.top = '50%';
            nextRow.style.left = '0';
            nextRow.style.right = '0';
            nextRow.style.transform = 'translate3d(0, -50%, 0)';
            
            // Add new row to carousel (both rows exist temporarily and perfectly overlay)
            carousel.appendChild(nextRow);
            
            // Start exit animation
            animateLogosOut(currentRow).then(() => {
                // Clean up old row
                if (currentRow.parentNode) {
                    currentRow.remove();
                }
                // Keep the row absolutely positioned to maintain exact position
                // No position reset - this prevents any jump
            }).catch(() => {
                // Fallback cleanup
                if (currentRow.parentNode) {
                    currentRow.remove();
                }
            });
            
            // Start entrance animation after very short delay (overlap with exit)
            setTimeout(() => {
                nextRow.style.opacity = '1';
                requestAnimationFrame(() => {
                    animateLogosIn(nextRow);
                });
            }, TIMING_CONFIG.carousel.transitionOverlap); // Configurable delay for smooth overlap
        } else {
            // No current row, position new row absolutely for consistency
            nextRow.style.position = 'absolute';
            nextRow.style.top = '50%';
            nextRow.style.left = '0';
            nextRow.style.right = '0';
            nextRow.style.transform = 'translate3d(0, -50%, 0)';
            
            carousel.appendChild(nextRow);
            nextRow.style.opacity = '1';
            requestAnimationFrame(() => {
                animateLogosIn(nextRow);
            });
        }
        
        activeIndex = nextIndex;
    }
    
    // ===================================================================
    // CAROUSEL CONTROLS
    // ===================================================================
    function startCarousel() {
        if (!isPaused && !intervalId) {
            intervalId = setInterval(switchToNextSet, TIMING_CONFIG.carousel.interval);
        }
    }
    
    function pauseCarousel() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        isPaused = true;
    }
    
    function resumeCarousel() {
        isPaused = false;
        startCarousel();
    }
    
    // ===================================================================
    // INITIALIZATION - Performance Optimized
    // ===================================================================
    // Create and show first row with immediate visibility
    const firstRow = createLogoRow(logoSets[0], true);
    carousel.appendChild(firstRow);
    
    // Optimize initial animation timing with requestAnimationFrame
    setTimeout(() => {
        requestAnimationFrame(() => {
            animateLogosIn(firstRow);
        });
    }, TIMING_CONFIG.carousel.firstAnimationDelay);
    
    // Start carousel with optimized timing
    setTimeout(startCarousel, TIMING_CONFIG.carousel.initialDelay);
    
    // Enhanced hover controls with performance optimizations
    const carouselWrapper = document.querySelector('.logo-carousel');
    if (carouselWrapper) {
        // Add passive event listeners for better scroll performance
        carouselWrapper.addEventListener('mouseenter', pauseCarousel, { passive: true });
        carouselWrapper.addEventListener('mouseleave', resumeCarousel, { passive: true });
        
        // Add reduced motion preference support
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // If user prefers reduced motion, extend intervals and reduce animation intensity
            TIMING_CONFIG.carousel.interval *= 1.5; // Slower transitions
            ANIMATION_CONFIG.entrance.movement *= 0.7; // Shorter animations
            ANIMATION_CONFIG.exit.movement *= 0.7;
        }
    }
    
    // Handle window resize to adapt logo count for different viewports
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Debounce resize events for better performance
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleViewportChange();
        }, 250);
    }, { passive: true });
}); 