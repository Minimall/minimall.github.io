
/**
 * Webflow Grid Animation
 * Optimized version of the animation for Webflow landing page
 * Works for header animation only
 */
function createWebflowGridAnimation(containerSelector = '.header-grid-container') {
    // Find all grid containers, specifically in header
    const gridElements = document.querySelectorAll(containerSelector);
    if (!gridElements.length) {
        console.error(`Grid containers not found. Make sure you have elements with class '${containerSelector}'`);
        return;
    }
    
    console.log(`Starting Webflow grid animation on ${gridElements.length} containers`);
    
    // Setup animation for each grid container
    gridElements.forEach(gridElement => {
        const lines = [];
        const colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
            "#F7FFF7", "#FFE66D", "#6B5B95", "#88D8B0", "#FF8C94",
            "#FFDAB9", "#B5EAD7", "#C7CEEA", "#FF9AA2", "#E6E6FA"
        ];

        const OPACITY_TRANSITION_TIME = 750;
        const MOVEMENT_TIME = 8000;
        const PAUSE_TIME = 2000;
        const TRANSITION_DURATION = 125;

        let mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        let lastKnownPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        let currentPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        let targetPoint = getRandomPoint();
        let nextTargetPoint = getRandomPoint();
        let movementStartTime = performance.now();
        let isMouseInside = false;
        let transitionStartTime = 0;

        const calculateGridSize = () => {
            const width = gridElement.clientWidth || window.innerWidth;
            const height = gridElement.clientHeight || window.innerHeight;
            const baseWidth = 1920; // Baseline width
            const baseColumns = 36; // Baseline columns for 1920px
            
            // Calculate columns based on viewport width ratio
            const scaleFactor = width / baseWidth;
            const targetColumns = Math.floor(baseColumns * scaleFactor);
            
            // Ensure columns stay within reasonable bounds
            const columns = Math.max(Math.min(targetColumns, 48), 12);
            
            // Calculate rows maintaining similar density
            const cellWidth = width / columns;
            const rows = Math.max(Math.floor(height / cellWidth), 18);
            
            gridElement.style.display = 'grid';
            gridElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
            gridElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
            
            return { columns, rows };
        };

        const { columns, rows } = calculateGridSize();
        const totalLines = columns * rows;

        const initializeLines = () => {
            // Clear any existing lines first
            while (gridElement.firstChild) {
                gridElement.removeChild(gridElement.firstChild);
            }
            
            const batchSize = 20;
            let currentBatch = 0;

            const createBatch = () => {
                const start = currentBatch * batchSize;
                const end = Math.min(start + batchSize, totalLines);

                for (let i = start; i < end; i++) {
                    const line = document.createElement('div');
                    line.className = 'line';
                    line.style.opacity = '0.5';
                    line.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    gridElement.appendChild(line);
                    lines.push({
                        element: line,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        targetColor: colors[Math.floor(Math.random() * colors.length)],
                        currentRotation: 0,
                        opacity: 0,
                        targetOpacity: 1,
                        opacityTransitionProgress: 0
                    });
                }

                currentBatch++;
                if (currentBatch * batchSize < totalLines) {
                    setTimeout(createBatch, 10); // Use setTimeout to avoid blocking
                }
            };

            createBatch();
        };

        function getRandomPoint() {
            const rect = gridElement.getBoundingClientRect();
            return {
                x: Math.random() * rect.width,
                y: Math.random() * rect.height
            };
        }

        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function lerpPoint(a, b, t) {
            return {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t
            };
        }

        function updatePosition(currentTime) {
            if (isMouseInside) {
                const elapsedTransitionTime = currentTime - transitionStartTime;
                if (elapsedTransitionTime < TRANSITION_DURATION) {
                    const t = elapsedTransitionTime / TRANSITION_DURATION;
                    return lerpPoint(currentPoint, mousePosition, easeInOutCubic(t));
                }
                return mousePosition;
            }

            const elapsedTime = currentTime - movementStartTime;
            const cycleDuration = MOVEMENT_TIME + PAUSE_TIME;

            if (elapsedTime >= cycleDuration) {
                currentPoint = targetPoint;
                targetPoint = nextTargetPoint;
                nextTargetPoint = getRandomPoint();
                movementStartTime = currentTime;
                return currentPoint;
            }

            if (elapsedTime <= MOVEMENT_TIME) {
                const t = elapsedTime / MOVEMENT_TIME;
                return lerpPoint(currentPoint, targetPoint, easeInOutCubic(t));
            }

            return targetPoint;
        }

        function shortestRotation(current, target) {
            let delta = (target - current) % 360;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            return delta;
        }

        function updateLineOpacity(line, deltaTime) {
            if (line.opacityTransitionProgress < 1) {
                line.opacityTransitionProgress += deltaTime / OPACITY_TRANSITION_TIME;
                if (line.opacityTransitionProgress > 1) line.opacityTransitionProgress = 1;
                line.opacity = easeInOutCubic(line.opacityTransitionProgress);
            }
        }

        function animateLines(currentTime) {
            const deltaTime = currentTime - (animateLines.lastTime || currentTime);
            animateLines.lastTime = currentTime;

            const currentPosition = updatePosition(currentTime);
            const rect = gridElement.getBoundingClientRect();

            lines.forEach((line, index) => {
                const lineX = (index % columns + 0.5) * rect.width / columns;
                const lineY = (Math.floor(index / columns) + 0.5) * rect.height / rows;

                const dx = currentPosition.x - lineX;
                const dy = currentPosition.y - lineY;

                const angleToFocalPoint = Math.atan2(dy, dx);
                const targetRotation = (angleToFocalPoint * 180 / Math.PI) + 90;

                const rotationDelta = shortestRotation(line.currentRotation, targetRotation);
                line.currentRotation += rotationDelta * 0.05625;
                line.currentRotation %= 360;

                line.element.style.transform = `rotate(${line.currentRotation}deg)`;
                updateLineOpacity(line, deltaTime);
                line.element.style.opacity = line.opacity;

                if (Math.random() < 0.001) {
                    line.targetColor = colors[Math.floor(Math.random() * colors.length)];
                }
                line.element.style.backgroundColor = line.targetColor;
            });

            requestAnimationFrame(animateLines);
        }

        function setupEventListeners() {
            // Track mouse movement
            const handleMouseMove = (event) => {
                const rect = gridElement.getBoundingClientRect();
                mousePosition.x = event.clientX - rect.left;
                mousePosition.y = event.clientY - rect.top;
                lastKnownPosition = { ...mousePosition };
            };

            // Handle mouse enter/leave for the grid
            const handleMouseEnter = () => {
                isMouseInside = true;
                transitionStartTime = performance.now();
                currentPoint = updatePosition(transitionStartTime);
            };

            const handleMouseLeave = () => {
                isMouseInside = false;
                movementStartTime = performance.now();
                currentPoint = lastKnownPosition;
                targetPoint = getRandomPoint();
                nextTargetPoint = getRandomPoint();
            };

            // Add the event listeners
            document.addEventListener('mousemove', handleMouseMove);
            gridElement.addEventListener('mouseenter', handleMouseEnter);
            gridElement.addEventListener('mouseleave', handleMouseLeave);

            // Return a cleanup function
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                gridElement.removeEventListener('mouseenter', handleMouseEnter);
                gridElement.removeEventListener('mouseleave', handleMouseLeave);
            };
        }

        // Handle window resize
        function setupResizeHandler() {
            let debounceTimeout;
            
            const handleResize = () => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    const newSizes = calculateGridSize();
                    
                    // Clear lines array
                    lines.length = 0;
                    
                    // Reinitialize with new grid size
                    initializeLines();
                }, 250);
            };
            
            window.addEventListener('resize', handleResize);
            
            // Return cleanup function
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }

        // Initialize the grid and start the animation
        function init() {
            // Set up grid style
            gridElement.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                overflow: hidden;
                pointer-events: auto;
                background: transparent;
            `;
            
            // Initialize the lines
            initializeLines();
            
            // Set up event listeners
            const cleanupEventListeners = setupEventListeners();
            const cleanupResizeHandler = setupResizeHandler();
            
            // Start the animation
            requestAnimationFrame(animateLines);
            
            // Return cleanup function
            return () => {
                cleanupEventListeners();
                cleanupResizeHandler();
            };
        }
        
        // Initialize this grid container
        init();
    });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Webflow to fully initialize
    setTimeout(() => {
        createWebflowGridAnimation('.header-grid-container');
    }, 300);
});

// Also initialize when the window loads (as a fallback)
window.addEventListener('load', function() {
    if (!window.gridAnimationInitialized) {
        window.gridAnimationInitialized = true;
        createWebflowGridAnimation('.header-grid-container');
    }
});

// Fix SVG width/height errors by ensuring they have numeric values
document.addEventListener('DOMContentLoaded', function() {
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
        // Check for invalid width/height values and replace them
        if (svg.getAttribute('width') === 'currentWidth') {
            svg.setAttribute('width', '100%');
        }
        if (svg.getAttribute('height') === 'currentHeight') {
            svg.setAttribute('height', '100%');
        }
    });
});

// Add export button functionality (if needed)
document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.querySelector('.export-button');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            // Export functionality can be added here if needed
            console.log('Export button clicked');
        });
    }
});
