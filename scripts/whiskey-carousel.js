
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing fluid iOS-like carousel with bi-directional looping");
        
        // Set up main elements
        const slider = document.querySelector('.whiskey-cards');
        const originalItems = Array.from(slider.querySelectorAll(':scope > *'));
        
        // Clone carousel items for infinite scrolling if we have items
        if (originalItems.length > 0) {
            // Add more clones for smoother looping
            const numClones = Math.max(3, Math.ceil(window.innerWidth / originalItems[0].offsetWidth));
            
            // Add clones at the beginning and end
            for (let i = 0; i < numClones; i++) {
                const idx = i % originalItems.length;
                const cloneStart = originalItems[idx].cloneNode(true);
                const cloneEnd = originalItems[originalItems.length - 1 - (idx % originalItems.length)].cloneNode(true);
                slider.appendChild(cloneStart);
                slider.prepend(cloneEnd);
            }
            
            // Calculate total width of original items
            const sectionWidth = originalItems.reduce((acc, item) => {
                const itemStyle = getComputedStyle(item);
                const marginRight = parseInt(itemStyle.marginRight || 0);
                return acc + item.offsetWidth + marginRight;
            }, 0);
            
            // Initialize scroll position to show first genuine item
            setTimeout(() => {
                slider.scrollLeft = sectionWidth;
            }, 50);
        }
        
        // Variables for tracking touch/mouse and momentum
        let isDown = false;
        let startX, startY;
        let scrollLeft;
        let velX = 0;
        let momentumID;
        let prevTime = 0;
        let prevScrollLeft = 0;
        let isTouching = false;
        let isScrolling = false;
        
        // Handle infinite looping when scrolling reaches edges
        function checkInfiniteLoop() {
            if (originalItems.length === 0) return;
            
            // Calculate section width (total width of original items)
            const sectionWidth = originalItems.reduce((acc, item) => {
                const itemStyle = getComputedStyle(item);
                const marginRight = parseInt(itemStyle.marginRight || 0);
                return acc + item.offsetWidth + marginRight;
            }, 0);
            
            // If we've scrolled too far left (into beginning clones)
            if (slider.scrollLeft < sectionWidth * 0.5) {
                // Jump to middle section (original items) + offset
                const offset = slider.scrollLeft;
                const targetPos = sectionWidth + offset;
                
                // Jump without animation
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft = targetPos;
                
                // Restore smooth scrolling after jump
                setTimeout(() => slider.style.scrollBehavior = '', 50);
            }
            // If we've scrolled too far right (into ending clones)
            else if (slider.scrollLeft > sectionWidth * 1.5) {
                // Jump back to the middle section + offset
                const offset = slider.scrollLeft - (sectionWidth * 1.5);
                const targetPos = sectionWidth * 0.5 + offset;
                
                // Jump without animation
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft = targetPos;
                
                // Restore smooth scrolling after jump
                setTimeout(() => slider.style.scrollBehavior = '', 50);
            }
        }
        
        // Momentum scrolling functions
        function beginMomentumTracking() {
            cancelMomentumTracking();
            
            // Only start momentum if there's sufficient velocity
            if (Math.abs(velX) > 0.5) {
                isScrolling = true;
                prevTime = performance.now();
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // If velocity is too small, just check loop conditions
                checkInfiniteLoop();
            }
        }
        
        function cancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
            isScrolling = false;
        }
        
        function momentumLoop() {
            const now = performance.now();
            const elapsed = now - prevTime;
            prevTime = now;
            
            // iOS-like physics with adaptive friction
            const currentVelocity = Math.abs(velX);
            
            // iOS-like physics: Less friction at high speeds, more at low speeds
            // This creates that signature iOS deceleration curve
            let friction;
            if (currentVelocity > 10) {
                friction = 0.97; // Less friction at high speeds
            } else if (currentVelocity > 5) {
                friction = 0.95; // Medium friction at medium speeds
            } else {
                friction = 0.90; // More friction at low speeds
            }
            
            // Apply velocity to scroll position
            slider.scrollLeft += velX;
            
            // Reduce velocity with friction
            velX *= friction;
            
            // Continue animation until velocity is negligible
            if (Math.abs(velX) > 0.2) {
                // Check for loop conditions during momentum scrolling
                checkInfiniteLoop();
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Final check once momentum ends
                isScrolling = false;
                checkInfiniteLoop();
                
                // Ensure scroll behavior is restored
                slider.style.scrollBehavior = '';
            }
        }
        
        // Track velocity for momentum scrolling
        function trackVelocity() {
            if (!isDown) return;
            
            const now = performance.now();
            const elapsed = now - prevTime;
            
            if (elapsed > 0) {
                const currentScrollLeft = slider.scrollLeft;
                const rawVelX = (currentScrollLeft - prevScrollLeft) / (elapsed / 16.67); // normalize to 60fps
                
                // Apply smoothing to velocity for more natural feel
                velX = velX * 0.7 + rawVelX * 0.3;
                
                prevScrollLeft = currentScrollLeft;
                prevTime = now;
            }
            
            requestAnimationFrame(trackVelocity);
        }
        
        // Mouse Events for Desktop
        slider.addEventListener('mousedown', (e) => {
            if (isScrolling) {
                cancelMomentumTracking(); // Stop any ongoing momentum
            }
            
            isDown = true;
            slider.classList.add('active');
            startX = e.clientX;
            startY = e.clientY; 
            scrollLeft = slider.scrollLeft;
            prevTime = performance.now();
            prevScrollLeft = slider.scrollLeft;
            
            // Reset velocity on new interaction
            velX = 0;
            
            // Start tracking velocity for momentum
            requestAnimationFrame(trackVelocity);
            
            // Disable scroll behaviors during drag for responsiveness
            slider.style.scrollBehavior = 'auto';
            
            // Prevent default actions
            e.preventDefault();
        });
        
        slider.addEventListener('mouseleave', () => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling for momentum
            slider.style.scrollBehavior = '';
            
            // Begin momentum scrolling
            beginMomentumTracking();
        });
        
        slider.addEventListener('mouseup', () => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling for momentum
            slider.style.scrollBehavior = '';
            
            // Begin momentum scrolling
            beginMomentumTracking();
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            e.preventDefault();
            
            const x = e.clientX;
            const deltaX = x - startX;
            
            // Update scroll position based on drag distance
            slider.scrollLeft = scrollLeft - deltaX;
        });
        
        // Touch Events for Mobile
        slider.addEventListener('touchstart', (e) => {
            if (isScrolling) {
                cancelMomentumTracking(); // Stop any ongoing momentum
            }
            
            isTouching = true;
            isDown = true;
            slider.classList.add('active');
            
            // Get touch coordinates
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            scrollLeft = slider.scrollLeft;
            
            // Reset tracking for new touch
            prevTime = performance.now();
            prevScrollLeft = slider.scrollLeft;
            
            // Reset velocity on new interaction
            velX = 0;
            
            // Start tracking velocity
            requestAnimationFrame(trackVelocity);
            
            // Use auto scroll behavior for responsiveness
            slider.style.scrollBehavior = 'auto';
            
            // Only prevent default if this is likely to be a horizontal swipe
            // (to allow page scrolling for vertical touches)
        }, { passive: true });
        
        slider.addEventListener('touchmove', (e) => {
            if (!isDown || !isTouching) return;
            
            // Get current touch position
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            
            // Calculate delta movements
            const deltaX = startX - x;
            const deltaY = startY - y;
            
            // If this is primarily a horizontal movement
            if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                // Prevent page scrolling
                e.preventDefault();
                
                // Update carousel scroll position
                slider.scrollLeft = scrollLeft + deltaX;
            }
        }, { passive: false });
        
        slider.addEventListener('touchend', (e) => {
            if (!isDown || !isTouching) return;
            
            isDown = false;
            isTouching = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling for momentum
            slider.style.scrollBehavior = '';
            
            // Begin momentum with current velocity
            beginMomentumTracking();
        });
        
        slider.addEventListener('touchcancel', () => {
            if (!isDown || !isTouching) return;
            
            isDown = false;
            isTouching = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling
            slider.style.scrollBehavior = '';
            
            // Check for looping needs
            checkInfiniteLoop();
        });
        
        // Wheel Events (Desktop)
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Stop any current momentum
            cancelMomentumTracking();
            
            // Apply wheel delta to velocity (with scaling for better feel)
            velX = e.deltaY * 1.5;
            
            // Start new momentum scrolling
            beginMomentumTracking();
        }, { passive: false });
        
        // Check for scroll events to handle infinite looping
        slider.addEventListener('scroll', () => {
            if (!isDown && !isScrolling) {
                checkInfiniteLoop();
            }
        });
        
        // Global event handlers to catch mouse movement outside the carousel
        document.addEventListener('mouseup', () => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            
            // Restore smooth behavior
            slider.style.scrollBehavior = '';
            
            // Begin momentum with current velocity
            beginMomentumTracking();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            e.preventDefault();
            
            const x = e.clientX;
            const deltaX = x - startX;
            slider.scrollLeft = scrollLeft - deltaX;
        });

        // Initial check to ensure proper positioning
        setTimeout(checkInfiniteLoop, 100);
    }
});
