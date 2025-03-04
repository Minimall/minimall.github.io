
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing fluid iOS-like carousel");
        
        // Set up main elements
        const slider = document.querySelector('.whiskey-cards');
        const originalItems = Array.from(slider.children);
        
        // Clone carousel items for infinite scrolling if we have items
        if (originalItems.length > 0) {
            // Create clones at both ends for seamless looping
            originalItems.forEach(item => {
                const cloneStart = item.cloneNode(true);
                const cloneEnd = item.cloneNode(true);
                slider.prepend(cloneEnd);
                slider.appendChild(cloneStart);
            });
            
            // Initialize to middle section (with original items)
            setTimeout(() => {
                const itemWidth = originalItems.reduce((acc, item) => 
                    acc + item.offsetWidth + parseInt(getComputedStyle(item).marginRight || 0), 0);
                slider.scrollLeft = itemWidth;
            }, 10);
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
        
        // Handle infinite looping when scrolling reaches edges
        function checkInfiniteLoop() {
            if (originalItems.length === 0) return;
            
            // Calculate total width of original items
            const sectionWidth = originalItems.reduce((acc, item) => {
                const itemStyle = getComputedStyle(item);
                const marginRight = parseInt(itemStyle.marginRight || 0);
                return acc + item.offsetWidth + marginRight;
            }, 0);
            
            // If we've scrolled past the beginning clones
            if (slider.scrollLeft < sectionWidth * 0.5) {
                // Jump to middle section (original items) without animation
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft += sectionWidth;
                
                // Restore smooth scrolling after jump
                setTimeout(() => slider.style.scrollBehavior = '', 50);
            }
            // If we've scrolled past the end clones
            else if (slider.scrollLeft > sectionWidth * 1.5) {
                // Jump back to the middle section without animation
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft -= sectionWidth;
                
                // Restore smooth scrolling after jump
                setTimeout(() => slider.style.scrollBehavior = '', 50);
            }
        }
        
        // Momentum scrolling functions
        function beginMomentumTracking() {
            cancelMomentumTracking();
            momentumID = requestAnimationFrame(momentumLoop);
        }
        
        function cancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
        }
        
        function momentumLoop() {
            const now = performance.now();
            const elapsed = now - prevTime;
            prevTime = now;
            
            // Apply momentum with iOS-like physics
            slider.scrollLeft += velX;
            
            // Dynamic friction based on velocity for natural iOS-like feel
            // Higher velocity = less friction initially for smoother feel
            // Faster slowdown at lower speeds for precision stopping
            const baseDecay = 0.97;
            const velocityFactor = Math.min(0.02, Math.abs(velX) * 0.005);
            const frictionFactor = baseDecay - velocityFactor;
            
            // Apply the calculated friction
            velX *= frictionFactor;
            
            // Continue animation until velocity is very small
            if (Math.abs(velX) > 0.2) {
                // Check for loop conditions during momentum scrolling
                checkInfiniteLoop();
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Final check once momentum ends
                checkInfiniteLoop();
                
                // Re-enable smooth scrolling behavior
                slider.style.scrollBehavior = '';
            }
        }
        
        // Track velocity during user interaction
        function trackVelocity() {
            if (!isDown) return;
            
            const now = performance.now();
            const elapsed = now - prevTime;
            
            if (elapsed > 0) {
                const currentScrollLeft = slider.scrollLeft;
                velX = (currentScrollLeft - prevScrollLeft) / (elapsed / 16.67); // Normalize to 60fps
                
                prevScrollLeft = currentScrollLeft;
                prevTime = now;
            }
            
            requestAnimationFrame(trackVelocity);
        }
        
        // Mouse Events for Desktop
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.clientX;
            startY = e.clientY; // Track vertical position to determine scroll direction
            scrollLeft = slider.scrollLeft;
            prevTime = performance.now();
            prevScrollLeft = slider.scrollLeft;
            
            cancelMomentumTracking();
            requestAnimationFrame(trackVelocity);
            
            // Disable transitions during drag for more responsive feel
            slider.style.scrollBehavior = 'auto';
            
            // Prevent default to avoid text selection
            e.preventDefault();
        });
        
        slider.addEventListener('mouseleave', () => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling for momentum
            slider.style.scrollBehavior = '';
            
            beginMomentumTracking();
        });
        
        slider.addEventListener('mouseup', () => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling for momentum
            slider.style.scrollBehavior = '';
            
            beginMomentumTracking();
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            e.preventDefault();
            
            const x = e.clientX;
            const y = e.clientY;
            
            // Calculate movement in x direction
            const deltaX = x - startX;
            
            // Update scroll position
            slider.scrollLeft = scrollLeft - deltaX;
        });
        
        // Touch Events for Mobile
        slider.addEventListener('touchstart', (e) => {
            isTouching = true;
            isDown = true;
            slider.classList.add('active');
            
            // Get touch coordinates
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            scrollLeft = slider.scrollLeft;
            
            prevTime = performance.now();
            prevScrollLeft = slider.scrollLeft;
            
            cancelMomentumTracking();
            requestAnimationFrame(trackVelocity);
            
            // Disable smooth scrolling during touch for better responsiveness
            slider.style.scrollBehavior = 'auto';
        }, { passive: false });
        
        slider.addEventListener('touchmove', (e) => {
            if (!isDown || !isTouching) return;
            
            // Get current touch position
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            
            // Calculate delta movements
            const deltaX = startX - x;
            const deltaY = startY - y;
            
            // Horizontal scrolling - only prevent default if horizontal movement is primary
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
                slider.scrollLeft = scrollLeft + deltaX;
            }
        }, { passive: false });
        
        slider.addEventListener('touchend', () => {
            if (!isDown || !isTouching) return;
            
            isDown = false;
            isTouching = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling
            slider.style.scrollBehavior = '';
            
            beginMomentumTracking();
        });
        
        slider.addEventListener('touchcancel', () => {
            if (!isDown || !isTouching) return;
            
            isDown = false;
            isTouching = false;
            slider.classList.remove('active');
            
            // Restore smooth scrolling
            slider.style.scrollBehavior = '';
            
            beginMomentumTracking();
        });
        
        // Wheel Events (Desktop)
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            cancelMomentumTracking();
            
            // Calculate velocity based on wheel delta
            velX = e.deltaY * 2;
            
            // Apply immediate scroll
            slider.scrollLeft += velX;
            
            // Start momentum after wheel
            beginMomentumTracking();
        }, { passive: false });
        
        // Check for scroll events to handle infinite looping
        slider.addEventListener('scroll', () => {
            if (!isDown) {
                checkInfiniteLoop();
            }
        });
        
        // Global event handlers to catch mouse movement outside the carousel
        document.addEventListener('mouseup', () => {
            if (!isDown) return;
            
            isDown = false;
            slider.classList.remove('active');
            slider.style.scrollBehavior = '';
            
            beginMomentumTracking();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            e.preventDefault();
            
            const x = e.clientX;
            const deltaX = x - startX;
            slider.scrollLeft = scrollLeft - deltaX;
        });
    }
});
