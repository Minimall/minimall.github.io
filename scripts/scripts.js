// Footer animation initialization
function initFooterAnimation() {
    console.log("Initializing footer animation");
    const footer = document.querySelector('.footer2');
    if (!footer) {
        console.log("Footer not found");
        return;
    }

    const animationWrapper = footer.querySelector('.animation-wrapper');
    const animationContainer = document.getElementById('footer-animation-container');

    if (!animationContainer) {
        console.log("Animation container not found");
        return;
    }

    let isAnimationInitialized = false;

    animationContainer.style.cssText = `
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        display: grid;
        background: transparent;
    `;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isAnimationInitialized) {
                isAnimationInitialized = true;
                createGridAnimation(animationContainer);
                setTimeout(() => {
                    animationWrapper.classList.add('visible');
                }, 100);
            }
        });
    }, { threshold: 0.2 });

    observer.observe(footer);
}

// Add to your existing DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", () => {
    // initFooterAnimation();
    // ... your existing initialization code
});








// Initialize everything
function initHeadlineWave() {
    // Ensure logos are visible first
    window.hoverJS.preserveLogos();
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const h1Element = entry.target;
                setTimeout(() => {
                    const waveTextSpan = h1Element.querySelector('.wave-text');
                    if (waveTextSpan) {
                        const spans = waveTextSpan.querySelectorAll('span');
                        const baseDelay = 25;
                        spans.forEach((span, i) => {
                            setTimeout(() => {
                                span.classList.add('shimmer-in');
                            }, i * baseDelay);
                        });
                    }
                    
                    // Ensure logos are still visible after animations
                    window.hoverJS.preserveLogos();
                }, 1200);
                
                observer.unobserve(h1Element);
            }
        });
    }, { threshold: 0.5 });

    function processHeadlines() {
        const headlines = document.querySelectorAll('h1:not(.case-title), .case-title');
        headlines.forEach(headline => {
            // Skip if already processed
            if (headline.hasAttribute('data-wave-processed')) return;
            
            const waveTextSpan = headline.querySelector('.wave-text');
            if (waveTextSpan) {
                const text = waveTextSpan.textContent.trim();
                const processedText = text.split('').map(char => 
                    char === ' ' ? `<span>&nbsp;</span>` : `<span>${char}</span>`
                ).join('');
                waveTextSpan.innerHTML = processedText;
                observer.observe(headline);
                headline.setAttribute('data-wave-processed', 'true');
            }
        });
    }

    // Initial processing
    processHeadlines();

    // Watch for dynamically loaded content
    const footerObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                processHeadlines();
            }
        });
    });

    footerObserver.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM Content Loaded");

    // 1. Wait for all resources to fully load before initializing animations
    window.addEventListener('load', () => {
        console.log("Window fully loaded");
        
        // 2. First initialize headline animation (complete essential page loading)
        setTimeout(() => {
            initHeadlineWave();
        }, 100);
        
        // 3. Then start footer animation with a delay to ensure proper sequence
        setTimeout(() => {
            const animationContainer = document.getElementById('footer-animation-container');
            if (animationContainer) {
                console.log("Starting footer animation");
                const wrapper = document.querySelector('.animation-wrapper');
                if (wrapper) {
                    wrapper.style.opacity = '1';
                    wrapper.style.background = '#ffffff';
                }
                createGridAnimation(animationContainer);
            }
        }, 1000); // Increased delay for footer animation
    });

    // First load case studies (skipping header.html which is missing)
    const loadPromises = [
        new Promise(resolve => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                // Use inline content instead of fetching header.html
                console.log('Header placeholder found but header.html is not available');
            }
            resolve();
        }),
        ...Array.from(document.querySelectorAll('[data-case-file]')).map(placeholder => 
            fetch(placeholder.dataset.caseFile)
                .then(response => response.text())
                .then(data => {
                    placeholder.innerHTML = data;
                    window.hoverJS.setupHoverEffects(); // Initialize after each case load
                })
        )
    ];

    await Promise.all(loadPromises).catch(error => console.error('Loading error:', error));

    // Initialize UI and ensure wave effects are set up
    // Mobile initialization is now handled in hover-mobile.js

    // Collapsible content handling
    document.querySelectorAll('.collapsible-link').forEach(link => {
        link.setAttribute('data-hover', 'true');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const content = document.querySelector('.collapsible-content');
            if (content) {
                content.classList.toggle('active');
            }
        });
    });

    // Header is already included in HTML, no need to fetch it
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        // Apply effects to any existing header elements
        window.hoverJS.setupHoverEffects();
    }

    // Load all case studies
    document.querySelectorAll('[data-case-file]').forEach(placeholder => {
        const caseFile = placeholder.dataset.caseFile;
        if (!caseFile) return;

        fetch(caseFile)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load case study: ${caseFile}`);
                return response.text();
            })
            .then(data => {
                placeholder.innerHTML = data;
                window.hoverJS.setupHoverEffects();
            })
            .catch(error => {
                console.error(error);
                placeholder.innerHTML = `<div class="case-study-error">Failed to load case study</div>`;
            });
    });
});
// Text repeater functionality
document.addEventListener('DOMContentLoaded', () => {
    const repeaters = document.querySelectorAll('.text-repeater');
    repeaters.forEach(repeater => {
        const text = repeater.textContent.trim();
        repeater.setAttribute('data-content', text + ' ');
        repeater.style.setProperty('--content-width', text.length + 'ch');
    });
});




// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Get the target's position
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        
        // Animate scroll
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
          // These don't work in all browsers but we're setting them anyway
          // CSS scroll-behavior handles this in modern browsers
        });
        
        // Update URL without scrolling
        history.pushState(null, null, targetId);
      }
    });
  });
});
