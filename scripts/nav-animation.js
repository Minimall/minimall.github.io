// Navigation Tab Animation using Motion.dev
document.addEventListener('DOMContentLoaded', function() {
    // Initialize both intro and footer navigation
    initNavigation('intro-nav');
    initNavigation('footer-nav');
    
    // Initialize inline links
    initInlineLinks();
});

function initNavigation(navId) {
    const nav = document.getElementById(navId);
    if (!nav) return;
    
    const navLinks = nav.querySelectorAll('.nav-link');
    let activeTab = null;
    let tabIndicator = null;
    let isHovering = false;

    // Create the tab indicator element
    function createTabIndicator() {
        tabIndicator = document.createElement('div');
        tabIndicator.className = 'nav-tab-indicator';
        nav.appendChild(tabIndicator);
        return tabIndicator;
    }

    // Initialize the tab indicator
    function initTabIndicator() {
        if (!tabIndicator) {
            createTabIndicator();
        }
        // No default selection - indicator only appears on interaction
        hideIndicator();
    }

    // Hide the indicator
    function hideIndicator() {
        if (tabIndicator) {
            tabIndicator.style.opacity = '0';
            tabIndicator.style.pointerEvents = 'none';
        }
    }

    // Show the indicator
    function showIndicator() {
        if (tabIndicator) {
            tabIndicator.style.opacity = '1';
        }
    }

    // Set active tab and animate indicator
    function setActiveTab(link, show = true) {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to current link
        link.classList.add('active');
        activeTab = link;

        if (show) {
            showIndicator();
        }

        // Get link dimensions and position
        const linkRect = link.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        
        const left = linkRect.left - navRect.left;
        const width = linkRect.width;
        const height = linkRect.height;
        const top = linkRect.top - navRect.top;

        // Animate the indicator using Motion.dev
        if (window.Motion && window.Motion.animate) {
            window.Motion.animate(
                tabIndicator,
                {
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`
                },
                {
                    type: "spring",
                    bounce: 0,
                    duration: 0.4
                }
            );
        } else {
            // Fallback without animation
            tabIndicator.style.left = `${left}px`;
            tabIndicator.style.top = `${top}px`;
            tabIndicator.style.width = `${width}px`;
            tabIndicator.style.height = `${height}px`;
        }
    }

    // Add event listeners to nav links
    navLinks.forEach(link => {
        // Mouse enter - show indicator
        link.addEventListener('mouseenter', () => {
            isHovering = true;
            setActiveTab(link, true);
        });

        // Mouse leave - hide indicator if not hovering nav
        link.addEventListener('mouseleave', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    hideIndicator();
                    // Remove active class from all links
                    navLinks.forEach(l => l.classList.remove('active'));
                    activeTab = null;
                }
            }, 50);
        });

        // Focus - show indicator (for keyboard navigation)
        link.addEventListener('focus', () => {
            isHovering = true;
            setActiveTab(link, true);
        });

        // Blur - hide indicator
        link.addEventListener('blur', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    hideIndicator();
                    // Remove active class from all links
                    navLinks.forEach(l => l.classList.remove('active'));
                    activeTab = null;
                }
            }, 50);
        });

        // Click - handle navigation
        link.addEventListener('click', (e) => {
            // Skip navigation handling for copy email buttons
            if (link.classList.contains('copy-email-btn')) {
                return;
            }
            
            // Handle smooth scrolling for anchor links (only for main nav)
            const href = link.getAttribute('href');
            if (href.startsWith('#') && navId === 'main-nav') {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            }
        });
    });

    // Handle mouse enter/leave for the entire nav container
    nav.addEventListener('mouseenter', () => {
        isHovering = true;
    });

    nav.addEventListener('mouseleave', () => {
        isHovering = false;
        setTimeout(() => {
            if (!isHovering) {
                hideIndicator();
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                activeTab = null;
            }
        }, 50);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (activeTab && tabIndicator && isHovering) {
            // Recalculate position on resize only if currently hovering
            setTimeout(() => {
                setActiveTab(activeTab, true);
            }, 100);
        }
    });

    // Initialize when page loads
    initTabIndicator();

    // Re-initialize if Motion.dev loads after this script
    if (!window.Motion) {
        const checkMotion = setInterval(() => {
            if (window.Motion) {
                clearInterval(checkMotion);
                initTabIndicator();
            }
        }, 100);
    }
}

// Initialize inline links with tab animation
function initInlineLinks() {
    const inlineLinks = document.querySelectorAll('.inline-link[data-nav-item]');
    
    inlineLinks.forEach(link => {
        let linkIndicator = null;
        let isHovering = false;
        
        // Create indicator for this specific link
        function createLinkIndicator() {
            linkIndicator = document.createElement('div');
            linkIndicator.className = 'inline-link-indicator';
            // Set initial state and ensure it doesn't affect layout
            linkIndicator.style.opacity = '0';
            linkIndicator.style.transform = 'scale(0.95)';
            linkIndicator.style.position = 'absolute';
            linkIndicator.style.pointerEvents = 'none';
            linkIndicator.style.zIndex = '-1';
            linkIndicator.style.fontSize = '0';
            linkIndicator.style.lineHeight = '0';
            linkIndicator.style.borderRadius = 'inherit';
            link.appendChild(linkIndicator);
            return linkIndicator;
        }
        
        // Initialize indicator
        function initLinkIndicator() {
            if (!linkIndicator) {
                createLinkIndicator();
            }
            hideLinkIndicator();
        }
        
        // Hide the indicator with animation
        function hideLinkIndicator() {
            if (linkIndicator) {
                // Use Motion.dev for smooth fade-out
                if (window.Motion && window.Motion.animate) {
                    window.Motion.animate(
                        linkIndicator,
                        {
                            opacity: 0,
                            transform: 'scale(0.6)'
                        },
                        {
                            type: "spring",
                            bounce: 0.1,
                            duration: 0.3
                        }
                    );
                } else {
                    // Fallback without animation
                    linkIndicator.style.opacity = '0';
                    linkIndicator.style.transform = 'scale(0.95)';
                }
            }
        }
        
        // Show the indicator with animation
        function showLinkIndicator() {
            if (linkIndicator) {
                // Use Motion.dev for smooth bounce animation
                if (window.Motion && window.Motion.animate) {
                    window.Motion.animate(
                        linkIndicator,
                        {
                            opacity: 1,
                            transform: 'scale(1)'
                        },
                        {
                            type: "spring",
                            bounce: 0.25,
                            duration: 0.6
                        }
                    );
                } else {
                    // Fallback without animation
                    linkIndicator.style.opacity = '1';
                    linkIndicator.style.transform = 'scale(1)';
                }
            }
        }
        
        // Set active state and animate indicator
        function setActiveLinkState(show = true) {
            if (show) {
                link.classList.add('active');
                // Position the indicator to match the link exactly
                if (linkIndicator) {
                    linkIndicator.style.left = '0px';
                    linkIndicator.style.top = '0px';
                    linkIndicator.style.width = '100%';
                    linkIndicator.style.height = '100%';
                }
                showLinkIndicator();
            } else {
                link.classList.remove('active');
                hideLinkIndicator();
            }
        }
        
        // Event listeners
        link.addEventListener('mouseenter', () => {
            isHovering = true;
            setActiveLinkState(true);
        });
        
        link.addEventListener('mouseleave', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    setActiveLinkState(false);
                }
            }, 50);
        });
        
        link.addEventListener('focus', () => {
            isHovering = true;
            setActiveLinkState(true);
        });
        
        link.addEventListener('blur', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    setActiveLinkState(false);
                }
            }, 50);
        });
        
        // Handle click for internal links
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            }
        });
        
        // Initialize the indicator
        initLinkIndicator();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (isHovering && linkIndicator) {
                setTimeout(() => {
                    setActiveLinkState(true);
                }, 100);
            }
        });
    });
}

// Global function to trigger indicator recalculation when button text changes
window.triggerIndicatorRecalculation = function(button) {
    // Find the navigation container that contains this button
    const nav = button.closest('.nav');
    if (!nav) return;
    
    // Check if this button currently has an active indicator
    const isCurrentlyActive = button.classList.contains('active');
    if (!isCurrentlyActive) return;
    
    // Find the tab indicator for this navigation
    const tabIndicator = nav.querySelector('.nav-tab-indicator');
    if (!tabIndicator) return;
    
    // Recalculate position and size
    setTimeout(() => {
        const linkRect = button.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        
        const left = linkRect.left - navRect.left;
        const width = linkRect.width;
        const height = linkRect.height;
        const top = linkRect.top - navRect.top;

        // Animate the indicator using Motion.dev
        if (window.Motion && window.Motion.animate) {
            window.Motion.animate(
                tabIndicator,
                {
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`
                },
                {
                    type: "spring",
                    bounce: 0,
                    duration: 0.4
                }
            );
        } else {
            // Fallback without animation
            tabIndicator.style.left = `${left}px`;
            tabIndicator.style.top = `${top}px`;
            tabIndicator.style.width = `${width}px`;
            tabIndicator.style.height = `${height}px`;
        }
    }, 10); // Small delay to ensure text has been updated in DOM
}; 