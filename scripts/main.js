// Simple and optimized JavaScript for the personal website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize email copy functionality
    initEmailCopy();
    
    // Smooth scrolling for anchor links (fallback for older browsers)
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Skip if href is just "#" or empty
            if (!targetId || targetId === '#' || targetId.length <= 1) {
                return;
            }
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without triggering scroll
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                }
            }
        });
    });
    
    // Optional: Track scroll position for future enhancements
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        // Could be used for header hide/show on scroll or other scroll-based animations
        // Currently keeping it minimal as requested
        
        lastScrollY = currentScrollY;
    }, { passive: true });
});

// Email copy functionality
function initEmailCopy() {
    const copyButtons = document.querySelectorAll('.copy-email-btn');
    const email = 'hi@dvornichenko.design'; // Set the actual email address
    
    copyButtons.forEach(button => {
        const originalText = button.textContent;
        
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                // Try modern clipboard API first
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(email);
                } else {
                    // Fallback for older browsers or non-HTTPS
                    const textArea = document.createElement('textarea');
                    textArea.value = email;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    textArea.remove();
                }
                
                // Visual feedback
                button.textContent = 'Email copied';
                button.classList.add('email-copied'); // Hide underline and apply copied state
                
                // Trigger hover indicator recalculation if available
                if (typeof triggerIndicatorRecalculation === 'function') {
                    triggerIndicatorRecalculation(button);
                }
                
                // Reset after 2 seconds
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('email-copied'); // Restore underline
                    
                    // Trigger hover indicator recalculation again for the reset
                    if (typeof triggerIndicatorRecalculation === 'function') {
                        triggerIndicatorRecalculation(button);
                    }
                }, 2000);
                
            } catch (err) {
                // Fallback: show email for manual copy
                button.textContent = email;
                button.classList.add('email-copied', 'email-fallback'); // Hide underline and smaller text
                
                // Trigger hover indicator recalculation
                if (typeof triggerIndicatorRecalculation === 'function') {
                    triggerIndicatorRecalculation(button);
                }
                
                // Reset after 4 seconds
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('email-copied', 'email-fallback'); // Restore underline and normal size
                    
                    // Trigger hover indicator recalculation for reset
                    if (typeof triggerIndicatorRecalculation === 'function') {
                        triggerIndicatorRecalculation(button);
                    }
                }, 4000);
            }
        });
        
        // Handle touch events for better mobile experience
        button.addEventListener('touchstart', function() {
            this.classList.add('button-pressed');
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('button-pressed');
        }, { passive: true });
    });
}

// Simple utility function for future enhancements
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debounce };
} 