
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing truly infinite carousel");
        
        // Slider element
        const slider = document.querySelector('.whiskey-cards');
        const originalItems = Array.from(slider.children);
        
        // First, remove any previously created clones to start fresh
        Array.from(slider.children).forEach(child => {
            if (child.classList.contains('clone')) {
                slider.removeChild(child);
            }
        });
        
        // Create clones for truly infinite scrolling
        if (originalItems.length > 0) {
            // Clone all items for both ends
            originalItems.forEach(item => {
                const cloneStart = item.cloneNode(true);
                const cloneEnd = item.cloneNode(true);
                cloneStart.classList.add('clone');
                cloneEnd.classList.add('clone');
                slider.appendChild(cloneStart);  // Add to end
                slider.insertBefore(cloneEnd, slider.firstChild);  // Add to beginning
            });
            
            console.log(`Created ${originalItems.length} clones at each end for seamless scrolling`);
        }
        
        // Calculate total width of original items
        const getItemWidth = () => {
            return originalItems.reduce((total, item) => {
                const style = window.getComputedStyle(item);
                const marginRight = parseInt(style.marginRight);
                const width = item.offsetWidth;
                return total + width + marginRight;
            }, 0);
        };
        
        // Position initially to show original items (not clones)
        setTimeout(() => {
            const itemSetWidth = getItemWidth();
            slider.scrollLeft = itemSetWidth;
            console.log(`Initial scroll position set to: ${itemSetWidth}px`);
        }, 50);
        
        // Variables for dragging and momentum
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0;
        let momentumID;
        let lastTime = 0;
        let lastScrollLeft = 0;
        
        // Handle infinite scrolling
        function checkInfiniteScroll() {
            const itemSetWidth = getItemWidth();
            
            // If scrolled to beginning clones, jump to corresponding original items
            if (slider.scrollLeft < itemSetWidth * 0.5) {
                console.log("Looping from beginning to middle");
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft += itemSetWidth;
                
                // Restore smooth scrolling
                setTimeout(() => {
                    slider.style.scrollBehavior = '';
                }, 10);
            }
            // If scrolled to end clones, jump to corresponding original items
            else if (slider.scrollLeft > itemSetWidth * 1.5) {
                console.log("Looping from end to middle");
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft -= itemSetWidth;
                
                // Restore smooth scrolling
                setTimeout(() => {
                    slider.style.scrollBehavior = '';
                }, 10);
            }
        }
        
        // Add scroll event to handle infinite scrolling
        slider.addEventListener('scroll', () => {
            // Only check infinite scroll if not currently dragging
            if (!isDown) {
                checkInfiniteScroll();
            }
            
            // Calculate current velocity
            const now = Date.now();
            if (now - lastTime > 20) {  // Only update every 20ms for stability
                velX = (slider.scrollLeft - lastScrollLeft) / (now - lastTime) * 20;
                lastScrollLeft = slider.scrollLeft;
                lastTime = now;
            }
        });
        
        // Mouse down - start dragging
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
            
            console.log("Mouse down event at", startX);
            e.preventDefault();
        });
        
        // Mouse leave - stop dragging
        slider.addEventListener('mouseleave', () => {
            if (isDown) {
                isDown = false;
                slider.classList.remove('active');
                beginMomentumTracking();
            }
        });
        
        // Mouse up - stop dragging and start momentum
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
            console.log("Mouse up event, starting momentum");
        });
        
        // Mouse move - perform dragging
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            e.preventDefault();
            const x = e.pageX;
            const walk = (x - startX);
            
            // Update scroll position based on mouse movement
            slider.scrollLeft = scrollLeft - walk;
            console.log(`Dragging: x=${x}, startX=${startX}, walk=${walk}, scrollLeft=${slider.scrollLeft}`);
        });
        
        // Touch events for mobile
        slider.addEventListener('touchstart', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.touches[0].pageX;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
            
            // Don't prevent default on touchstart to allow native scrolling behavior
            lastTime = Date.now();
            lastScrollLeft = slider.scrollLeft;
        }, { passive: true });
        
        slider.addEventListener('touchend', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
        });
        
        slider.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            
            const x = e.touches[0].pageX;
            const walk = (x - startX);
            
            // Update scroll position based on touch movement
            slider.scrollLeft = scrollLeft - walk;
            
            // Only prevent default if significantly moving horizontally
            if (Math.abs(walk) > 10) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Momentum functions
        function beginMomentumTracking() {
            cancelMomentumTracking();
            
            // Only start momentum if there's actual velocity
            if (Math.abs(velX) > 0.5) {
                console.log("Beginning momentum with velocity:", velX);
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }
        
        function cancelMomentumTracking() {
            if (momentumID) {
                cancelAnimationFrame(momentumID);
                momentumID = null;
            }
        }
        
        function momentumLoop() {
            // Add velocity to scroll position
            slider.scrollLeft += velX;
            
            // Apply friction - iOS-like physics
            velX *= 0.95;
            
            // Continue animation until velocity is very small
            if (Math.abs(velX) > 0.5) {
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Check infinite scroll position at the end of momentum
                checkInfiniteScroll();
            }
        }
        
        // Mouse wheel handling
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            cancelMomentumTracking();
            
            // Smooth scroll with wheel
            slider.scrollBy({
                left: e.deltaY * 3,
                behavior: 'smooth'
            });
        });
        
        // Global mouse event tracking to handle edge cases
        document.addEventListener('mouseup', () => {
            if (isDown) {
                isDown = false;
                slider.classList.remove('active');
                beginMomentumTracking();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            const x = e.pageX;
            const walk = (x - startX);
            slider.scrollLeft = scrollLeft - walk;
        });
    }
});
