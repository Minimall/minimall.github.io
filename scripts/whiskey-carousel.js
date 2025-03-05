document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing truly free-flowing seamless carousel");

        // Set up main elements
        const slider = document.querySelector('.whiskey-cards');
        const items = Array.from(slider.querySelectorAll(':scope > *:not(.carousel-clone)'));

        // Remove any existing clones
        slider.querySelectorAll('.carousel-clone').forEach(clone => clone.remove());

        // Enhanced function to create clones for truly seamless infinite streaming
        function setupInfiniteScroll() {
            // Calculate how many clones we need based on viewport width and scroll velocity
            // We want at least 4 screens worth on each side for truly seamless scrolling
            // even during rapid flicking gestures
            const viewportWidth = window.innerWidth;
            const contentWidth = items.reduce((sum, item) => {
                const style = window.getComputedStyle(item);
                const marginRight = parseInt(style.marginRight) || 0;
                return sum + item.offsetWidth + marginRight;
            }, 0);

            // Add extra clones for high-speed scrolling scenarios
            const repeatsNeeded = Math.ceil((viewportWidth * 4) / contentWidth) + 2;

            // Remove existing clones
            slider.querySelectorAll('.carousel-clone').forEach(clone => clone.remove());

            // For truly seamless effect, we need perfect continuation pattern
            // First analyze the visual pattern at the boundaries
            const firstItem = items[0];
            const lastItem = items[items.length - 1];
            
            // Add clones before original items (for seamless scrolling to the left)
            // Starting with the end items to ensure perfect pattern continuation
            for (let i = 0; i < repeatsNeeded; i++) {
                for (let j = items.length - 1; j >= 0; j--) {
                    const clone = items[j].cloneNode(true);
                    clone.classList.add('carousel-clone');
                    clone.setAttribute('aria-hidden', 'true');
                    // Add data attribute to help with debugging
                    clone.setAttribute('data-clone-index', `left-${i}-${j}`);
                    slider.insertBefore(clone, slider.firstChild);
                }
            }

            // Add clones after original items (for seamless scrolling to the right)
            for (let i = 0; i < repeatsNeeded; i++) {
                for (let j = 0; j < items.length; j++) {
                    const clone = items[j].cloneNode(true);
                    clone.classList.add('carousel-clone');
                    clone.setAttribute('aria-hidden', 'true');
                    // Add data attribute to help with debugging
                    clone.setAttribute('data-clone-index', `right-${i}-${j}`);
                    slider.appendChild(clone);
                }
            }

            // Calculate position of first real item
            const preClones = Array.from(slider.querySelectorAll('.carousel-clone:not(:nth-last-of-type(n+' + (items.length * repeatsNeeded + 1) + '))'));
            const preWidth = preClones.reduce((sum, item) => {
                const style = window.getComputedStyle(item);
                const marginRight = parseInt(style.marginRight) || 0;
                return sum + item.offsetWidth + marginRight;
            }, 0);

            // Set initial scroll position to first non-clone
            slider.scrollLeft = preWidth;

            return {
                preWidth,
                contentWidth,
                originalItems: items,
                preClones,
                postClones: Array.from(slider.querySelectorAll('.carousel-clone:nth-last-of-type(-n+' + (items.length * repeatsNeeded) + ')'))
            };
        }

        // Set up the infinite scroll
        let scrollData = setupInfiniteScroll();

        // Advanced boundary handling for creating an illusion of truly infinite stream
        function checkForLooping() {
            if (!scrollData || !scrollData.originalItems.length) return;

            const originals = scrollData.originalItems;
            const preWidth = scrollData.preWidth;
            const contentWidth = scrollData.contentWidth;
            const itemAvgWidth = contentWidth / originals.length;
            
            // Create threshold variables for more granular control
            const leftThreshold = preWidth - (itemAvgWidth * 2); // Detect earlier before visible edge
            const rightThreshold = preWidth + contentWidth + (itemAvgWidth * 2);
            
            // Get current scroll velocity to determine if user is actively scrolling
            const isActivelyScrolling = Math.abs(velocityX) > 0.5;
            
            // If approaching left boundary (scrolling backward)
            if (slider.scrollLeft < leftThreshold) {
                // Only reposition when user isn't actively interacting or during very fast scrolls
                if (!isDragging || Math.abs(velocityX) > 15) {
                    // Instead of jumping by full content width, jump by a calculated offset
                    // that places identical content under the viewport
                    const currentVisibleOffset = preWidth - slider.scrollLeft;
                    const seamlessJumpPos = preWidth + contentWidth - currentVisibleOffset;
                    
                    // Use immediate repositioning without animation
                    slider.scrollLeft = seamlessJumpPos;
                }
            }
            
            // If approaching right boundary (scrolling forward)
            if (slider.scrollLeft > rightThreshold) {
                // Only reposition when user isn't actively interacting or during very fast scrolls
                if (!isDragging || Math.abs(velocityX) > 15) {
                    // Calculate exact position to create perfect content alignment
                    const currentVisibleOffset = slider.scrollLeft - preWidth - contentWidth;
                    const seamlessJumpPos = preWidth + currentVisibleOffset;
                    
                    // Use immediate repositioning without animation
                    slider.scrollLeft = seamlessJumpPos;
                }
            }
        }

        // Variables for momentum scrolling
        let isDown = false;
        let isDragging = false;
        let startX = 0;
        let scrollStartLeft = 0;
        let velocityX = 0;
        let lastScrollLeft = 0;
        let lastTimestamp = 0;
        let momentumID = null;
        let isHorizontalMove = true;

        // Momentum scrolling functions
        function updateVelocity() {
            if (!isDragging) return;

            const now = performance.now();
            const elapsed = now - lastTimestamp;

            if (elapsed > 0) {
                const currentScrollLeft = slider.scrollLeft;
                const delta = currentScrollLeft - lastScrollLeft;

                // Calculate velocity (pixels per animation frame)
                velocityX = delta / (elapsed / 16.67);

                // Store values for next frame
                lastScrollLeft = currentScrollLeft;
                lastTimestamp = now;

                // Continue tracking velocity
                requestAnimationFrame(updateVelocity);
            }
        }

        function startMomentum() {
            // Clear any existing momentum animation
            cancelMomentum();

            // Only apply momentum if there's significant velocity
            if (Math.abs(velocityX) > 0.5) {
                // Start animation
                lastTimestamp = performance.now();
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Still check for looping
                checkForLooping();
            }
        }

        function cancelMomentum() {
            if (momentumID) {
                cancelAnimationFrame(momentumID);
                momentumID = null;
            }
        }

        function momentumLoop(timestamp) {
            // Calculate time delta
            const elapsed = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            // Apply smooth deceleration based on current velocity
            const absVelocity = Math.abs(velocityX);
            let friction;

            // Dynamic friction: faster = less friction for iOS-like feel
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

            // Apply velocity to scroll position with time scaling
            slider.scrollLeft += velocityX * (elapsed / 16.67);

            // Apply friction with 20% less aggressive inertia
            velocityX *= friction * 0.8;

            // Check for looping during momentum
            checkForLooping();

            // Continue animation if velocity is still significant
            if (Math.abs(velocityX) > 0.2) {
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                momentumID = null;
                // Final check for proper position
                checkForLooping();
            }
        }

        // Mouse event handlers for desktop
        slider.addEventListener('mousedown', (e) => {
            cancelMomentum();

            isDown = true;
            isDragging = true;
            slider.classList.add('active');

            startX = e.clientX;
            scrollStartLeft = slider.scrollLeft;

            // Reset velocity tracking
            velocityX = 0;
            lastScrollLeft = slider.scrollLeft;
            lastTimestamp = performance.now();

            // Start tracking velocity
            requestAnimationFrame(updateVelocity);

            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDown) return;

            const x = e.clientX;
            const deltaX = startX - x;

            // Move the scroll position directly for immediate feedback
            slider.scrollLeft = scrollStartLeft + deltaX;

            e.preventDefault();
        });

        window.addEventListener('mouseup', () => {
            if (!isDown) return;

            isDown = false;
            isDragging = false;
            slider.classList.remove('active');

            // Begin momentum scrolling
            startMomentum();
        });

        window.addEventListener('mouseleave', () => {
            if (isDown) {
                isDown = false;
                isDragging = false;
                slider.classList.remove('active');

                // Begin momentum scrolling
                startMomentum();
            }
        });

        // Touch event handlers for mobile
        slider.addEventListener('touchstart', (e) => {
            cancelMomentum();

            isDown = true;
            isDragging = true;
            isHorizontalMove = null; // We don't know direction yet
            slider.classList.add('active');

            const touch = e.touches[0];
            startX = touch.clientX;
            const startY = touch.clientY; // Store Y position to detect scroll direction
            scrollStartLeft = slider.scrollLeft;

            // For direction detection
            window.touchStartY = startY;

            // Reset velocity tracking
            velocityX = 0;
            lastScrollLeft = slider.scrollLeft;
            lastTimestamp = performance.now();

            // Start tracking velocity
            requestAnimationFrame(updateVelocity);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!isDown) return;

            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            const deltaX = startX - x;
            const deltaY = window.touchStartY - y;

            // If we haven't determined direction yet
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

            // If this is a horizontal move, handle it
            if (isHorizontalMove) {
                slider.scrollLeft = scrollStartLeft + deltaX;
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (!isDown) return;

            isDown = false;
            isDragging = false;
            slider.classList.remove('active');

            // Apply momentum if this was a horizontal move
            if (isHorizontalMove) {
                startMomentum();
            }
        });

        // Wheel event handler for trackpad/mouse wheel
        slider.addEventListener('wheel', (e) => {
            // Cancel any ongoing momentum
            cancelMomentum();

            // Apply immediate scroll
            const delta = Math.abs(e.deltaX) > 0.5 * Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            slider.scrollLeft += delta;

            // Track the most recent deltas for momentum
            velocityX = delta * 0.8;

            // Apply momentum to continue the scroll naturally
            startMomentum();

            e.preventDefault();
        }, { passive: false });

        // Handle scroll events to check looping
        slider.addEventListener('scroll', () => {
            if (!isDragging && !momentumID) {
                // Check for looping during standard scrolling
                checkForLooping();
            }
        });

        // Handle window resizing
        window.addEventListener('resize', () => {
            cancelMomentum();
            scrollData = setupInfiniteScroll();
        });

        // Initial position check
        setTimeout(() => {
            checkForLooping();
        }, 50);
    }
});