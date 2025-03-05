
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing true infinite stream carousel");

        // Main elements
        const slider = document.querySelector('.whiskey-cards');
        const originalItems = Array.from(slider.querySelectorAll(':scope > *'));
        const itemCount = originalItems.length;

        if (itemCount === 0) return; // No items to display

        // Remove any existing clones
        slider.querySelectorAll('.carousel-clone').forEach(clone => clone.remove());

        // ===== CORE STRATEGY =====
        // Instead of using "jump" repositioning when reaching boundaries,
        // we create enough clones that the user can never reach the edges
        // during normal scrolling. This creates the illusion of an infinite stream.

        // Calculate required clones based on viewport and content
        function createSeamlessStream() {
            // Calculate content dimensions
            const viewportWidth = window.innerWidth;
            const totalContentWidth = originalItems.reduce((total, item) => {
                const style = window.getComputedStyle(item);
                const marginRight = parseInt(style.marginRight) || 0;
                return total + item.offsetWidth + marginRight;
            }, 0);

            // Create enough clones to fill several viewport widths on each side
            // This ensures users can't scroll to the edges during normal interaction
            const requiredSets = Math.ceil((viewportWidth * 5) / totalContentWidth) + 2;

            // Remove existing clones
            slider.querySelectorAll('.carousel-clone').forEach(clone => clone.remove());

            // Create clones before original items (for scrolling left)
            for (let i = 0; i < requiredSets; i++) {
                for (let j = itemCount - 1; j >= 0; j--) {
                    const clone = originalItems[j].cloneNode(true);
                    clone.classList.add('carousel-clone');
                    clone.setAttribute('aria-hidden', 'true');
                    slider.insertBefore(clone, slider.firstChild);
                }
            }

            // Create clones after original items (for scrolling right)
            for (let i = 0; i < requiredSets; i++) {
                for (let j = 0; j < itemCount; j++) {
                    const clone = originalItems[j].cloneNode(true);
                    clone.classList.add('carousel-clone');
                    clone.setAttribute('aria-hidden', 'true');
                    slider.appendChild(clone);
                }
            }

            // Calculate initial position to show original items
            const preClones = Array.from(slider.querySelectorAll('.carousel-clone:not(:nth-last-of-type(n+' + 
                (itemCount * requiredSets + 1) + '))'));

            const initialOffset = preClones.reduce((sum, item) => {
                const style = window.getComputedStyle(item);
                const marginRight = parseInt(style.marginRight) || 0;
                return sum + item.offsetWidth + marginRight;
            }, 0);

            // Position the carousel at the original items
            slider.scrollLeft = initialOffset;

            return {
                totalContentWidth,
                initialOffset,
                requiredSets,
                itemsPerSet: itemCount
            };
        }

        // Initialize the infinite stream
        let streamData = createSeamlessStream();

        // ===== SEAMLESS INFINITE SCROLLING =====
        // Monitor the scroll position and reset when appropriate to create infinite effect
        function monitorScrollPosition() {
            // Get current scroll position
            const currentPosition = slider.scrollLeft;
            const containerWidth = slider.clientWidth;
            
            // Calculate total width of one set of original items
            const originalSetWidth = originalItems.reduce((sum, item) => {
                const style = window.getComputedStyle(item);
                const marginRight = parseInt(style.marginRight) || 0;
                return sum + item.offsetWidth + marginRight;
            }, 0);
            
            // Get all cloned sets before the original items
            const preCloneSets = streamData.requiredSets;
            const preCloneWidth = preCloneSets * originalSetWidth;
            
            // Get total content width including all clones
            const totalWidth = slider.scrollWidth;
            
            // Calculate trigger points for resetting scroll position
            // We trigger a reset before reaching actual edges to ensure seamless experience
            const leftResetTrigger = preCloneWidth * 0.5; // Half of left clone width
            const rightResetTrigger = preCloneWidth + originalSetWidth + (streamData.requiredSets * 0.5 * originalSetWidth);
            
            // If scrolled too far left, reset to equivalent position from right side
            if (currentPosition < leftResetTrigger) {
                // Calculate how far into the left clones we've scrolled
                const offset = (leftResetTrigger - currentPosition) % originalSetWidth;
                // Reset to equivalent position in right clones
                const newPosition = preCloneWidth + originalSetWidth - offset;
                
                // Disable smooth scrolling temporarily for instant jump
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft = newPosition;
                // Re-enable smooth scrolling
                setTimeout(() => {
                    slider.style.scrollBehavior = '';
                }, 50);
            }
            
            // If scrolled too far right, reset to equivalent position from left side
            else if (currentPosition > rightResetTrigger) {
                // Calculate how far into the right clones we've scrolled
                const excess = currentPosition - rightResetTrigger;
                const offset = excess % originalSetWidth;
                // Reset to equivalent position in left clones
                const newPosition = preCloneWidth - (originalSetWidth - offset);
                
                // Disable smooth scrolling temporarily for instant jump
                slider.style.scrollBehavior = 'auto';
                slider.scrollLeft = newPosition;
                // Re-enable smooth scrolling
                setTimeout(() => {
                    slider.style.scrollBehavior = '';
                }, 50);
            }
            
            // Continue monitoring
            requestAnimationFrame(monitorScrollPosition);
        }
        
        // Start monitoring scroll position for infinite loop effect
        requestAnimationFrame(monitorScrollPosition);

        // ===== PHYSICS-BASED SCROLLING =====

        // Variables for physics and interaction tracking
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let scrollStartPosition = 0;
        let velocityX = 0;
        let lastScrollPosition = 0;
        let lastTimestamp = 0;
        let momentumID = null;
        let isHorizontalMove = null;
        let touchStartY = 0;

        // Track velocity during user interaction
        function updateVelocity() {
            if (!isDragging) return;

            const now = performance.now();
            const elapsed = now - lastTimestamp;

            if (elapsed > 0) {
                const currentPosition = slider.scrollLeft;
                const delta = currentPosition - lastScrollPosition;

                // Calculate pixels per frame (assuming 60fps)
                velocityX = delta / (elapsed / 16.67);

                // Store values for next calculation
                lastScrollPosition = currentPosition;
                lastTimestamp = now;

                // Continue tracking
                requestAnimationFrame(updateVelocity);
            }
        }

        // Initialize momentum scrolling
        function startMomentum() {
            cancelMomentum(); // Clear any existing animation

            // Only apply momentum if there's meaningful velocity
            if (Math.abs(velocityX) > 0.5) {
                lastTimestamp = performance.now();
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }

        // Cancel momentum scrolling
        function cancelMomentum() {
            if (momentumID) {
                cancelAnimationFrame(momentumID);
                momentumID = null;
            }
        }

        // Momentum scrolling animation
        function momentumLoop(timestamp) {
            const elapsed = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            // Apply dynamic friction based on velocity
            const absVelocity = Math.abs(velocityX);
            let friction;

            // iOS-like feel: faster movements have less friction
            if (absVelocity > 20) {
                friction = 0.97;      // Very fast
            } else if (absVelocity > 12) {
                friction = 0.95;      // Fast
            } else if (absVelocity > 5) {
                friction = 0.92;      // Medium
            } else if (absVelocity > 2) {
                friction = 0.88;      // Slow
            } else {
                friction = 0.82;      // Very slow
            }

            // Apply scroll based on velocity and time delta
            slider.scrollLeft += velocityX * (elapsed / 16.67);

            // Apply friction
            velocityX *= friction;

            // Continue animation if velocity is still significant
            if (Math.abs(velocityX) > 0.2) {
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                momentumID = null;
            }
        }

        // ===== EVENT HANDLERS =====

        // Mouse events for desktop
        slider.addEventListener('mousedown', (e) => {
            cancelMomentum();

            isDragging = true;
            slider.classList.add('active');

            startX = e.clientX;
            scrollStartPosition = slider.scrollLeft;

            // Reset velocity tracking
            velocityX = 0;
            lastScrollPosition = slider.scrollLeft;
            lastTimestamp = performance.now();

            // Start tracking velocity
            requestAnimationFrame(updateVelocity);

            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const x = e.clientX;
            const deltaX = startX - x;

            // Move the scroll position directly
            slider.scrollLeft = scrollStartPosition + deltaX;

            e.preventDefault();
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;

            isDragging = false;
            slider.classList.remove('active');

            // Begin momentum scrolling
            startMomentum();
        });

        window.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                slider.classList.remove('active');

                // Begin momentum scrolling
                startMomentum();
            }
        });

        // Touch events for mobile
        slider.addEventListener('touchstart', (e) => {
            cancelMomentum();

            isDragging = true;
            isHorizontalMove = null; // Direction not determined yet
            slider.classList.add('active');

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            touchStartY = startY; // Store for direction detection
            scrollStartPosition = slider.scrollLeft;

            // Reset velocity tracking
            velocityX = 0;
            lastScrollPosition = slider.scrollLeft;
            lastTimestamp = performance.now();

            // Start tracking velocity
            requestAnimationFrame(updateVelocity);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;

            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            const deltaX = startX - x;
            const deltaY = touchStartY - y;

            // Determine scroll direction if not already determined
            if (isHorizontalMove === null) {
                // If movement is more horizontal than vertical, capture it
                if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                    isHorizontalMove = true;
                    e.preventDefault();
                } 
                // If movement is more vertical, let the browser handle it
                else if (Math.abs(deltaY) > 10) {
                    isHorizontalMove = false;
                }
            }

            // Process horizontal movement
            if (isHorizontalMove) {
                slider.scrollLeft = scrollStartPosition + deltaX;
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (!isDragging) return;

            isDragging = false;
            slider.classList.remove('active');

            // Apply momentum if this was a horizontal move
            if (isHorizontalMove) {
                startMomentum();
            }
        });

        // Wheel event for mouse wheel/trackpad
        slider.addEventListener('wheel', (e) => {
            // Cancel any ongoing momentum
            cancelMomentum();

            // Use deltaX for horizontal wheels, fallback to deltaY
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5 ? e.deltaX : e.deltaY;
            slider.scrollLeft += delta;

            // Apply momentum for natural feel
            velocityX = delta * 0.5;
            startMomentum();

            e.preventDefault();
        }, { passive: false });

        // Window resize handler
        window.addEventListener('resize', () => {
            cancelMomentum();
            streamData = createSeamlessStream();
        });
    }
});
