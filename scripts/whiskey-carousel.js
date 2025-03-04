
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing free-flowing carousel with momentum");
        
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
            
            // Store initial position and time for better drag calculations
            lastTime = Date.now();
            lastScrollLeft = slider.scrollLeft;
            
            // Make sure we don't prevent default entirely to allow focus on interactive elements
            if (e.target === slider || e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                e.preventDefault();
            }
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
        slider.addEventListener('mouseup', (e) => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            
            // Calculate final velocity for better momentum
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
                velX = (slider.scrollLeft - lastScrollLeft) / dt * 20;
            }
            
            beginMomentumTracking();
            console.log("Mouse up event, starting momentum with velocity:", velX);
        });
        
        // Mouse move - perform free dragging
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            e.preventDefault();
            const x = e.pageX;
            const walk = (x - startX);
            
            // Update scroll position based on mouse movement - use direct calculation for smoother feel
            const newScrollLeft = scrollLeft - walk;
            slider.scrollLeft = newScrollLeft;
            
            // Calculate instantaneous velocity for better momentum
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
                velX = (slider.scrollLeft - lastScrollLeft) / dt * 15; // Scale for better feel
                lastTime = now;
                lastScrollLeft = slider.scrollLeft;
            }
        });
        
        // Touch events for mobile with improved fluidity
        slider.addEventListener('touchstart', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.touches[0].pageX;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
            
            // Store initial position and time
            lastTime = Date.now();
            lastScrollLeft = slider.scrollLeft;
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            
            // Calculate final velocity for better momentum
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
                velX = (slider.scrollLeft - lastScrollLeft) / dt * 20;
            }
            
            beginMomentumTracking();
        });
        
        slider.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            
            const x = e.touches[0].pageX;
            const walk = (x - startX) * 1.0; // Multiplier for drag sensitivity
            
            // Update scroll position for smooth drag
            const newScrollLeft = scrollLeft - walk;
            slider.scrollLeft = newScrollLeft;
            
            // Calculate instantaneous velocity
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 20) { // Only update every 20ms for stability
                velX = (slider.scrollLeft - lastScrollLeft) / dt * 15;
                lastTime = now;
                lastScrollLeft = slider.scrollLeft;
            }
            
            // Only prevent default if significantly moving horizontally to allow vertical scrolling
            if (Math.abs(walk) > 10) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Momentum functions with improved iOS-like physics
        function beginMomentumTracking() {
            cancelMomentumTracking();
            
            // Only start momentum if there's meaningful velocity
            if (Math.abs(velX) > 0.2) {
                console.log("Beginning momentum with velocity:", velX);
                lastTime = Date.now();
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
            const now = Date.now();
            const dt = now - lastTime;
            lastTime = now;
            
            // Calculate deceleration based on elapsed time for consistent feel across devices
            const friction = Math.pow(0.97, dt / 16.67); // 60fps reference
            
            // Update velocity with time-based friction
            velX *= friction;
            
            // Add velocity to scroll position
            slider.scrollLeft += velX * (dt / 16.67); // Scale by time delta
            
            // Continue animation until velocity is very small
            if (Math.abs(velX) > 0.1) {
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Check infinite scroll position at the end of momentum
                checkInfiniteScroll();
            }
        }
        
        // Mouse wheel handling - enhanced for smoother experience
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            cancelMomentumTracking();
            
            // Apply variable scroll speed based on wheel delta 
            // for more natural feeling
            const scaleFactor = Math.abs(e.deltaY) > 100 ? 4 : 2.5;
            const scrollAmount = e.deltaY * scaleFactor;
            
            // Use animation frame for smoother scroll
            requestAnimationFrame(() => {
                slider.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            });
            
            // Set a small velocity in the direction of the wheel for natural momentum
            velX = e.deltaY > 0 ? 2 : -2;
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
            
            // Update velocity during global drag
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
                velX = (slider.scrollLeft - lastScrollLeft) / dt * 15;
                lastTime = now;
                lastScrollLeft = slider.scrollLeft;
            }
        });
    }
});
