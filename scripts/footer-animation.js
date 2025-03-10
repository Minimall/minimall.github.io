function createGridAnimation(gridElement) {
    console.log("Starting grid animation");
    if (!gridElement) {
        console.error("No grid element provided");
        return;
    }
    
    // Ensure the document is fully loaded before starting animation
    if (document.readyState !== 'complete') {
        console.log("Waiting for page to fully load before starting footer animation");
        window.addEventListener('load', () => createGridAnimation(gridElement));
        return;
    }
    const lines = [];
    const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
        "#F7FFF7", "#FFE66D", "#6B5B95", "#88D8B0", "#FF8C94"
    ];

    const OPACITY_TRANSITION_TIME = 750;
    const MOVEMENT_TIME = 8000;   // 2x faster
    const PAUSE_TIME = 2000;      // 2x shorter
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
        const width = window.innerWidth;
        const height = window.innerHeight;
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
                requestAnimationFrame(createBatch);
            }
        };

        createBatch();
    };

    gridElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(${columns}, 1fr);
        grid-template-rows: repeat(${rows}, 1fr);
        overflow: hidden;
    `;
    initializeLines();

    function getRandomPoint() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
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
            line.currentRotation += rotationDelta * 0.05625; // 1.5x faster again
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

    const resizeObserver = new ResizeObserver(() => {
        const { columns: newColumns, rows: newRows } = calculateGridSize();
        gridElement.style.gridTemplateColumns = `repeat(${newColumns}, 1fr)`;
        gridElement.style.gridTemplateRows = `repeat(${newRows}, 1fr)`;
    });

    resizeObserver.observe(gridElement);

    gridElement.addEventListener('mousemove', (event) => {
        const rect = gridElement.getBoundingClientRect();
        mousePosition.x = event.clientX - rect.left;
        mousePosition.y = event.clientY - rect.top;
        lastKnownPosition = { ...mousePosition };
    });

    gridElement.addEventListener('mouseenter', () => {
        isMouseInside = true;
        transitionStartTime = performance.now();
        currentPoint = updatePosition(transitionStartTime);
    });

    gridElement.addEventListener('mouseleave', () => {
        isMouseInside = false;
        movementStartTime = performance.now();
        currentPoint = lastKnownPosition;
        targetPoint = getRandomPoint();
        nextTargetPoint = getRandomPoint();
    });

    requestAnimationFrame(animateLines);
};

window.createGridAnimation = createGridAnimation;

// Initialize the footer animation when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    const footerAnimationContainer = document.getElementById('footer-animation-container');
    if (footerAnimationContainer) {
        console.log("Found footer animation container, initializing animation");
        createGridAnimation(footerAnimationContainer);
        
        // Make the animation wrapper visible
        const animationWrapper = document.querySelector('.animation-wrapper');
        if (animationWrapper) {
            animationWrapper.classList.add('visible');
        }
    } else {
        console.warn("Footer animation container not found");
    }
});