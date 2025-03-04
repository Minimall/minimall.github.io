
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing truly infinite carousel");
        
        // Clone carousel items for infinite scrolling
        const slider = document.querySelector('.whiskey-cards');
        const items = Array.from(slider.children);
        
        // Create clones at both ends for seamless looping
        if (items.length > 0) {
            // Clone all items to both ends for seamless scrolling
            items.forEach(item => {
                const cloneStart = item.cloneNode(true);
                const cloneEnd = item.cloneNode(true);
                slider.prepend(cloneEnd);
                slider.appendChild(cloneStart);
            });
            
            console.log(`Created ${items.length} clones at each end for seamless scrolling`);
        }
        
        // Wait for the DOM to update with clones
        setTimeout(() => {
            // Scroll to the original items (skip the clones at the start)
            const totalWidth = items.reduce((acc, item) => acc + item.offsetWidth + parseInt(getComputedStyle(item).marginRight), 0);
            slider.scrollLeft = totalWidth;
            console.log(`Initial scroll position set to: ${totalWidth}px`);
        }, 10);
        
        // Slider dragging variables
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0;
        let momentumID;
        
        // Handle the infinite loop when scrolling reaches edges
        function handleInfiniteScroll() {
            const allItems = Array.from(slider.children);
            const itemCount = allItems.length;
            const originalCount = items.length;
            
            // Calculate total width of original items
            const itemWidth = allItems.reduce((acc, item) => acc + item.offsetWidth + parseInt(getComputedStyle(item).marginRight), 0) / itemCount * originalCount;
            
            // If we've scrolled past the beginning items
            if (slider.scrollLeft < itemWidth * 0.1) {
                // Jump to the middle section (original items) without animation
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft += itemWidth;
                console.log("Looped from beginning to middle");
                
                // Restore smooth scrolling after jump
                setTimeout(() => {
                    slider.style.scrollBehavior = 'smooth';
                }, 10);
            }
            // If we've scrolled past the end items
            else if (slider.scrollLeft > itemWidth * 1.9) {
                // Jump back to the middle section without animation
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft -= itemWidth;
                console.log("Looped from end to middle");
                
                // Restore smooth scrolling after jump
                setTimeout(() => {
                    slider.style.scrollBehavior = 'smooth';
                }, 10);
            }
        }
        
        // Add scroll event listener for infinite loop handling
        slider.addEventListener('scroll', () => {
            handleInfiniteScroll();
        });

        // Mouse down event - start dragging
        slider.addEventListener('mousedown', (e) => {
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
                handleInfiniteScroll();
            }
        });

        // Mouse up event - stop dragging
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
            handleInfiniteScroll();
        });

        // Mouse move event - perform dragging
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            
            const x = e.clientX;
            const walk = (x - startX); // scroll speed
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            
            // Calculate velocity for momentum
            velX = slider.scrollLeft - prevScrollLeft;
        });

        // Touch events for mobile
        slider.addEventListener('touchstart', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.touches[0].clientX;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
            
            // Disable scroll behavior during touch for better responsiveness
            slider.style.scrollBehavior = 'auto';
            e.preventDefault(); // Prevent page scrolling during drag
        }, { passive: false });

        slider.addEventListener('touchend', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
            handleInfiniteScroll();
        });

        slider.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.touches[0].clientX;
            const walk = (x - startX);
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            velX = slider.scrollLeft - prevScrollLeft;
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
            
            // Continue animation until velocity is very small
            if (Math.abs(velX) > 0.1) {
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Reset to smooth scrolling behavior after momentum ends
                slider.style.scrollBehavior = 'smooth';
                handleInfiniteScroll(); // Check if we need to loop after momentum ends
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
                    handleInfiniteScroll();
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
