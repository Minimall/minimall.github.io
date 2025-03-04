
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        console.log("Initializing truly seamless iOS-like carousel");
        
        // Set up main elements
        const slider = document.querySelector('.whiskey-cards');
        const originalItems = Array.from(slider.querySelectorAll(':scope > *'));
        
        // Clone carousel items for infinite scrolling if we have items
        if (originalItems.length > 0) {
            // Calculate how many clones we need based on viewport width
            const estimatedItemWidth = originalItems[0].offsetWidth + 32; // width + margin
            const viewportWidth = window.innerWidth;
            const itemsPerScreen = Math.ceil(viewportWidth / estimatedItemWidth);
            const numClones = Math.max(Math.ceil(itemsPerScreen * 2), 6); // At least 2 screens worth or 6 items
            
            // Create clones at both ends
            for (let i = 0; i < numClones; i++) {
                // Clone from start for end
                const cloneForEnd = originalItems[i % originalItems.length].cloneNode(true);
                cloneForEnd.setAttribute('aria-hidden', 'true');
                cloneForEnd.classList.add('carousel-clone');
                slider.appendChild(cloneForEnd);
                
                // Clone from end for start
                const cloneForStart = originalItems[originalItems.length - 1 - (i % originalItems.length)].cloneNode(true);
                cloneForStart.setAttribute('aria-hidden', 'true');
                cloneForStart.classList.add('carousel-clone');
                slider.insertBefore(cloneForStart, slider.firstChild);
            }
            
            // Calculate original section width
            const itemWidths = originalItems.map(item => {
                const style = window.getComputedStyle(item);
                return item.offsetWidth + parseInt(style.marginRight || 0);
            });
            
            const originalWidth = itemWidths.reduce((sum, width) => sum + width, 0);
            
            // Initialize scroll position to first real item
            setTimeout(() => {
                const startItems = slider.querySelectorAll('.carousel-clone');
                const startWidth = Array.from(startItems).reduce((sum, item) => sum + item.offsetWidth + parseInt(window.getComputedStyle(item).marginRight || 0), 0);
                slider.scrollLeft = startWidth;
            }, 10);
        }
        
        // Variables for tracking interaction and momentum
        let isDown = false;
        let startX, startY;
        let scrollLeft;
        let velX = 0;
        let momentumID;
        let lastTimestamp = 0;
        let lastScrollLeft = 0;
        let isDragging = false;
        let isScrollingByMomentum = false;
        let scrollDirection = 0;
        let isHorizontalMove = false;
        
        // Function to check and handle looping
        function checkForLooping() {
            if (originalItems.length === 0) return;
            
            // Get all items including clones
            const allItems = Array.from(slider.children);
            const startClones = allItems.filter(item => item.classList.contains('carousel-clone') && 
                                                  Array.from(slider.children).indexOf(item) < originalItems.length);
            const endClones = allItems.filter(item => item.classList.contains('carousel-clone') && 
                                                Array.from(slider.children).indexOf(item) >= originalItems.length + startClones.length);
            
            // Calculate widths
            const startClonesWidth = startClones.reduce((sum, item) => sum + item.offsetWidth + parseInt(window.getComputedStyle(item).marginRight || 0), 0);
            const originalItemsWidth = originalItems.reduce((sum, item) => sum + item.offsetWidth + parseInt(window.getComputedStyle(item).marginRight || 0), 0);
            const endClonesWidth = endClones.reduce((sum, item) => sum + item.offsetWidth + parseInt(window.getComputedStyle(item).marginRight || 0), 0);
            
            // Total content width
            const totalWidth = startClonesWidth + originalItemsWidth + endClonesWidth;
            
            // Calculate key scroll positions
            const originalStart = startClonesWidth;
            const originalEnd = startClonesWidth + originalItemsWidth;
            
            // Check if we've scrolled past the original items and need to loop
            const currentScroll = slider.scrollLeft;
            
            // If we've scrolled before the original items
            if (currentScroll < startClonesWidth * 0.5) {
                // Jump to equivalent position at the end of the original items
                const equivalentPosition = originalEnd - (startClonesWidth - currentScroll);
                slider.scrollLeft = equivalentPosition;
            }
            // If we've scrolled past the original items
            else if (currentScroll > originalEnd + (endClonesWidth * 0.5)) {
                // Jump to equivalent position at the start of original items
                const equivalentPosition = originalStart + (currentScroll - (originalEnd + endClonesWidth));
                slider.scrollLeft = equivalentPosition;
            }
        }
        
        // Momentum scrolling functions
        function beginMomentumTracking() {
            cancelMomentumTracking();
            
            // Only start momentum if there's enough velocity
            if (Math.abs(velX) > 0.3) {
                isScrollingByMomentum = true;
                // Store scroll direction for looping logic
                scrollDirection = velX > 0 ? 1 : -1;
                
                // Use current timestamp for first frame
                lastTimestamp = performance.now();
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                // Still check for looping even with no momentum
                checkForLooping();
            }
        }
        
        function cancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
            isScrollingByMomentum = false;
        }
        
        function momentumLoop(timestamp) {
            if (!isScrollingByMomentum) return;
            
            // Calculate time delta for physics
            const elapsed = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            
            // Adaptive deceleration based on velocity - iOS-like feel
            // Higher velocity = less friction, slower velocity = more friction
            const absVelocity = Math.abs(velX);
            let friction;
            
            if (absVelocity > 15) {
                friction = 0.985;  // Very fast - minimal friction
            } else if (absVelocity > 8) {
                friction = 0.97;   // Fast - low friction
            } else if (absVelocity > 4) {
                friction = 0.94;   // Medium - medium friction
            } else if (absVelocity > 2) {
                friction = 0.91;   // Slow - higher friction
            } else {
                friction = 0.88;   // Very slow - maximum friction
            }
            
            // Apply velocity to scroll position with adaptive scaling
            // This makes it feel more like iOS's physical momentum
            slider.scrollLeft += velX * (elapsed / 16.67); // Normalize to 60fps
            
            // Reduce velocity with friction
            velX *= friction;
            
            // Special case handling for very low velocities to avoid janky end of scroll
            if (absVelocity < 1) {
                velX *= 0.85; // Apply extra friction at the end
            }
            
            // Check for loop wraparound during momentum
            checkForLooping();
            
            // Continue momentum until velocity becomes negligible
            if (Math.abs(velX) > 0.1) {
                momentumID = requestAnimationFrame(momentumLoop);
            } else {
                isScrollingByMomentum = false;
                // Final check once momentum ends
                checkForLooping();
            }
        }
        
        // Touch/mouse handling with precise velocity tracking
        function updateVelocity(e) {
            if (!isDragging) return;
            
            const now = performance.now();
            const elapsed = now - lastTimestamp;
            
            if (elapsed > 0) {  // Avoid division by zero
                const currentScrollLeft = slider.scrollLeft;
                const delta = currentScrollLeft - lastScrollLeft;
                
                // Calculate raw velocity in px/frame (assuming 60fps)
                const rawVelX = delta / (elapsed / 16.67);
                
                // Use weighted average for smoother velocity (80% previous, 20% new)
                velX = velX * 0.8 + rawVelX * 0.2;
                
                // Store values for next frame
                lastScrollLeft = currentScrollLeft;
                lastTimestamp = now;
                
                // Request next velocity update
                requestAnimationFrame(() => updateVelocity(e));
            }
        }
        
        // Mouse event handlers with improved dragging
        slider.addEventListener('mousedown', (e) => {
            // Stop any ongoing momentum
            cancelMomentumTracking();
            
            isDragging = true;
            isDown = true;
            slider.classList.add('active');
            
            // Get starting position
            startX = e.clientX;
            startY = e.clientY;
            scrollLeft = slider.scrollLeft;
            
            // Prepare for velocity tracking
            lastTimestamp = performance.now();
            lastScrollLeft = slider.scrollLeft;
            velX = 0;
            
            // Start tracking velocity
            requestAnimationFrame(() => updateVelocity(e));
            
            // Prevent default behavior to avoid text selection during drag
            e.preventDefault();
        });
        
        slider.addEventListener('mouseleave', () => {
            if (!isDown) return;
            
            isDown = false;
            isDragging = false;
            slider.classList.remove('active');
            
            // Begin momentum with current velocity
            beginMomentumTracking();
        });
        
        slider.addEventListener('mouseup', () => {
            if (!isDown) return;
            
            isDown = false;
            isDragging = false;
            slider.classList.remove('active');
            
            // Begin momentum with current velocity
            beginMomentumTracking();
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            // Prevent default to stop text selection, image dragging, etc.
            e.preventDefault();
            
            // Calculate movement amount
            const x = e.clientX;
            const deltaX = x - startX;
            
            // Update scroll position directly
            slider.scrollLeft = scrollLeft - deltaX;
        });
        
        // Touch event handlers with better physics
        slider.addEventListener('touchstart', (e) => {
            // Stop any ongoing momentum
            cancelMomentumTracking();
            
            isDragging = true;
            isDown = true;
            slider.classList.add('active');
            isHorizontalMove = false;
            
            // Get touch coordinates
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            scrollLeft = slider.scrollLeft;
            
            // Reset tracking values
            lastTimestamp = performance.now();
            lastScrollLeft = slider.scrollLeft;
            velX = 0;
            
            // Start tracking velocity
            requestAnimationFrame(() => updateVelocity(e));
        }, { passive: true });
        
        slider.addEventListener('touchmove', (e) => {
            if (!isDown || !isDragging) return;
            
            // Get current touch position
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            const deltaX = startX - x;
            const deltaY = startY - y;
            
            // Determine if this is a horizontal or vertical swipe
            if (!isHorizontalMove) {
                if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                    isHorizontalMove = true;
                    e.preventDefault(); // Prevent page scrolling for horizontal swipes
                } else if (Math.abs(deltaY) > 10) {
                    // This is a vertical swipe, let browser handle it
                    isDragging = false;
                    return;
                }
            }
            
            if (isHorizontalMove) {
                // Update carousel scroll position and prevent default
                slider.scrollLeft = scrollLeft + deltaX;
                e.preventDefault();
            }
        }, { passive: false });
        
        slider.addEventListener('touchend', () => {
            if (!isDown || !isDragging) return;
            
            isDown = false;
            isDragging = false;
            slider.classList.remove('active');
            
            // Begin momentum with current velocity
            beginMomentumTracking();
        });
        
        slider.addEventListener('touchcancel', () => {
            if (!isDown || !isDragging) return;
            
            isDown = false;
            isDragging = false;
            slider.classList.remove('active');
            
            // Check for looping if needed
            checkForLooping();
        });
        
        // Trackpad/wheel handling with enhanced inertia
        slider.addEventListener('wheel', (e) => {
            // Prevent default to stop the page from scrolling
            e.preventDefault();
            
            // Stop any ongoing momentum
            cancelMomentumTracking();
            
            // Scale the wheel delta for better feel (horizontal main delta)
            // Use deltaX if available (for trackpads) or fallback to deltaY
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5 ? e.deltaX : e.deltaY;
            
            // Apply to velocity with scaling for natural feel
            velX = delta * 1.0; // Adjusted scaling for trackpad
            
            // Start new momentum tracking
            beginMomentumTracking();
        }, { passive: false });
        
        // Check for loop conditions when manually scrolling
        slider.addEventListener('scroll', () => {
            if (!isDragging && !isScrollingByMomentum) {
                // Check if we need to loop when user is manually scrolling
                // or when browser momentum is happening
                checkForLooping();
            }
        });
        
        // Handle document mouse events to properly end dragging
        document.addEventListener('mouseup', () => {
            if (!isDown) return;
            
            isDown = false;
            isDragging = false;
            slider.classList.remove('active');
            
            // Begin momentum scrolling
            beginMomentumTracking();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            // Calculate movement
            const x = e.clientX;
            const deltaX = x - startX;
            
            // Update scroll position
            slider.scrollLeft = scrollLeft - deltaX;
        });
        
        // Initial check to ensure proper positioning
        setTimeout(checkForLooping, 100);
        
        // Handle resize events to maintain proper position
        window.addEventListener('resize', () => {
            // Recalculate positions on resize to maintain seamless scrolling
            setTimeout(checkForLooping, 100);
        });
    }
});
