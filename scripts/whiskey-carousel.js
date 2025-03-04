
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        // Slider dragging
        const slider = document.querySelector('.whiskey-cards');
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0;
        let momentumID;
        
        console.log("Whiskey carousel initialized");

        // Mouse down event - start dragging
        slider.addEventListener('mousedown', (e) => {
            console.log("Mouse down detected");
            isDown = true;
            slider.classList.add('active');
            startX = e.clientX;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
            e.preventDefault(); // Prevent text selection during drag
            
            // Disable transition during drag for more responsive feel
            slider.style.scrollBehavior = 'auto';
        });

        // Mouse leave event - stop dragging if mouse leaves the element
        slider.addEventListener('mouseleave', () => {
            if (isDown) {
                isDown = false;
                slider.classList.remove('active');
                beginMomentumTracking();
            }
        });

        // Mouse up event - stop dragging
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
        });

        // Mouse move event - perform dragging
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            
            const x = e.clientX;
            const walk = (x - startX); // scroll speed
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            
            // Calculate velocity for momentum - track the last 5 movements for smoother acceleration
            velX = slider.scrollLeft - prevScrollLeft;
            
            // Debug info at reduced frequency to avoid console spam
            if (Math.random() < 0.1) { // Only log ~10% of move events
                console.log(`walk: ${walk}, scrollLeft: ${slider.scrollLeft}, velX: ${velX}`);
            }
        });

        // Touch events for mobile
        slider.addEventListener('touchstart', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.touches[0].clientX;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
            console.log("Touch start detected");
            
            // Disable scroll behavior during touch for better responsiveness
            slider.style.scrollBehavior = 'auto';
            e.preventDefault(); // Prevent page scrolling during drag
        }, { passive: false });

        slider.addEventListener('touchend', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
        });

        slider.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.touches[0].clientX;
            const walk = (x - startX);
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            velX = slider.scrollLeft - prevScrollLeft;
            console.log("Touch move: scrollLeft = " + slider.scrollLeft);
        }, { passive: false });

        // Momentum tracking functions
        function beginMomentumTracking() {
            cancelMomentumTracking();
            momentumID = requestAnimationFrame(momentumLoop);
        }

        function cancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
        }

        function momentumLoop() {
            // Apply momentum with iOS-like physics
            slider.scrollLeft += velX;
            
            // Implement variable friction based on velocity for more natural deceleration
            // Higher velocity = less friction initially for smoother feel
            const frictionFactor = Math.max(0.90, 0.97 - Math.abs(velX) * 0.01);
            velX *= frictionFactor;
            
            // Log less frequently to avoid console spam
            if (Math.random() < 0.05) {
                console.log("Momentum: velX = " + velX);
            }
            
            // Continue animation until velocity is very small
            if (Math.abs(velX) > 0.1) {
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Reset to smooth scrolling behavior after momentum ends
                slider.style.scrollBehavior = 'smooth';
            }
        }

        // Cancel momentum on wheel events
        slider.addEventListener('wheel', (e) => {
            cancelMomentumTracking();
        });

        // Scroll handling
        slider.addEventListener("wheel", (evt) => {
            evt.preventDefault();
            window.requestAnimationFrame(() => {
                slider.scrollTo({ 
                    top: 0, 
                    left: slider.scrollLeft + (evt.deltaY * 2), 
                    behavior: "smooth" 
                });
            });
        });

        // Add global mouse up listener to handle cases where mouse is released outside the slider
        document.addEventListener('mouseup', () => {
            if (isDown) {
                isDown = false;
                slider.classList.remove('active');
                beginMomentumTracking();
                
                // Re-enable smooth scrolling after drag ends
                setTimeout(() => {
                    slider.style.scrollBehavior = 'smooth';
                }, 50);
            }
        });
        
        // Also track global mouse movement to ensure drag continues even if cursor moves fast
        document.addEventListener('mousemove', (e) => {
            if (isDown) {
                e.preventDefault();
                const x = e.clientX;
                const walk = (x - startX);
                const prevScrollLeft = slider.scrollLeft;
                slider.scrollLeft = scrollLeft - walk;
                velX = slider.scrollLeft - prevScrollLeft;
            }
        });
    }
});
