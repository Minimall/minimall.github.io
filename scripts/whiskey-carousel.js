
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
            console.log("Mouse move while dragging");
            
            const x = e.clientX;
            const walk = (x - startX); // scroll speed
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            
            // Calculate velocity for momentum
            velX = slider.scrollLeft - prevScrollLeft;
            
            // Debug info
            console.log(`walk: ${walk}, scrollLeft: ${slider.scrollLeft}, velX: ${velX}`);
        });

        // Touch events for mobile
        slider.addEventListener('touchstart', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.touches[0].clientX;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
            console.log("Touch start detected");
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
            slider.scrollLeft += velX * 2;
            velX *= 0.95; // Friction factor
            console.log("Momentum: velX = " + velX);
            
            if (Math.abs(velX) > 0.5) {
                momentumID = requestAnimationFrame(momentumLoop);
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
            }
        });
    }
});
