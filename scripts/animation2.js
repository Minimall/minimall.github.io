const createGridAnimation = (gridElement) => {
    const lines = [];
    const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
        "#F7FFF7", "#FFE66D", "#6B5B95", "#88D8B0", "#FF8C94"
    ];

    const OPACITY_TRANSITION_TIME = 4500;
    const ACCELERATION_TIME = 6000;
    const DECELERATION_TIME = 6000;
    const PAUSE_TIME = 4500;
    const TOTAL_CYCLE_TIME = ACCELERATION_TIME + DECELERATION_TIME + PAUSE_TIME;
    const TRANSITION_DURATION = 750;

    let mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lastKnownPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let currentFocalPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let targetFocalPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let cycleStartTime = 0;
    let isMouseInside = false;
    let transitionStartTime = 0;

    // Calculate responsive grid size
    const calculateGridSize = () => {
        const width = window.innerWidth;
        const baseColumns = 12;
        const baseRows = 12;

        let columns = Math.min(Math.floor(width / 60), 24);
        let rows = Math.floor(columns * (window.innerHeight / window.innerWidth));

        return {
            columns: Math.max(columns, baseColumns),
            rows: Math.max(rows, baseRows)
        };
    };

    const { columns, rows } = calculateGridSize();
    const totalLines = columns * rows;

    // Create grid lines with staggered initialization
    const initializeLines = () => {
        const batchSize = 20;
        let currentBatch = 0;

        const createBatch = () => {
            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, totalLines);

            for (let i = start; i < end; i++) {
                const line = document.createElement('div');
                line.className = 'line';
                gridElement.appendChild(line);
                lines.push({
                    element: line,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    targetColor: colors[Math.floor(Math.random() * colors.length)],
                    colorTransitionProgress: 0,
                    currentRotation: 0,
                    opacity: 0,
                    targetOpacity: 1,
                    opacityTransitionProgress: 0,
                    opacityPauseTime: Math.random() * 1000
                });
            }

            currentBatch++;
            if (currentBatch * batchSize < totalLines) {
                requestAnimationFrame(createBatch);
            }
        };

        createBatch();
    };

    // Initialize grid layout
    gridElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

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

    function easeInQuad(t) {
        return t * t * t;  // Cubic easing for slower start
    }

    function easeOutQuad(t) {
        return 1 - Math.pow(1 - t, 3);  // Cubic easing for smoother end
    }

    function lerpPoint(a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t
        };
    }

    let debugMode = false;
    let debugDot = null;

    function createDebugButton(gridElement) {
        const button = document.createElement('button');
        button.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 56px;
            height: 56px;
            opacity: 0;
            cursor: pointer;
            z-index: 1000;
        `;
        button.onclick = () => {
            debugMode = !debugMode;
            if (debugMode && !debugDot) {
                debugDot = document.createElement('div');
                debugDot.style.cssText = `
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: red;
                    border-radius: 50%;
                    pointer-events: none;
                    transition: transform 0.05s linear;
                    z-index: 999;
                `;
                gridElement.appendChild(debugDot);
            }
            if (debugDot) debugDot.style.display = debugMode ? 'block' : 'none';
        };
        gridElement.appendChild(button);
    }

    function updateFocalPoint(currentTime) {
        const timeScale = debugMode ? 6 : 1;
        const scaledTime = currentTime * timeScale;

        if (isMouseInside) {
            const elapsedTransitionTime = currentTime - transitionStartTime;
            if (elapsedTransitionTime < TRANSITION_DURATION) {
                const t = elapsedTransitionTime / TRANSITION_DURATION;
                const point = lerpPoint(currentFocalPoint, mousePosition, easeInOutCubic(t));
                updateDebugDot(point);
                return point;
            }
            updateDebugDot(mousePosition);
            return mousePosition;
        }

        const elapsedTime = (scaledTime - cycleStartTime) % TOTAL_CYCLE_TIME;
        const phase = calculateMovementPhase(elapsedTime);
        
        if (phase.type === 'prepare') {
            prepareNextCycle(scaledTime);
            updateDebugDot(targetFocalPoint);
            return targetFocalPoint;
        }
        
        const point = calculatePointForPhase(phase);
        updateDebugDot(point);
        return point;
    }

    function calculateMovementPhase(elapsedTime) {
        const cycleProgress = elapsedTime / TOTAL_CYCLE_TIME;
        const movementTime = ACCELERATION_TIME + DECELERATION_TIME;
        
        if (elapsedTime < movementTime) {
            return {
                type: 'move',
                progress: elapsedTime / movementTime
            };
        }
        
        return {
            type: 'wait',
            progress: cycleProgress
        };
    }

    function calculatePointForPhase(phase) {
        if (phase.type === 'move') {
            const easeT = easeInOutCubic(phase.progress);
            return lerpPoint(currentFocalPoint, targetFocalPoint, easeT);
        }
        return targetFocalPoint;
    }

    function prepareNextCycle(currentTime) {
        currentFocalPoint = {...targetFocalPoint};
        const prevTarget = {...targetFocalPoint};
        
        do {
            targetFocalPoint = getRandomPoint();
        } while (
            Math.hypot(targetFocalPoint.x - prevTarget.x, targetFocalPoint.y - prevTarget.y) < 100 ||
            Math.hypot(targetFocalPoint.x - prevTarget.x, targetFocalPoint.y - prevTarget.y) > window.innerWidth / 3
        );
        
        cycleStartTime = currentTime;
    }

    function updateDebugDot(point) {
        if (debugDot && debugMode) {
            debugDot.style.transform = `translate(${point.x - 4}px, ${point.y - 4}px)`;
        }
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

        const focalPoint = updateFocalPoint(currentTime);
        const rect = gridElement.getBoundingClientRect();

        lines.forEach((line, index) => {
            const x = (index % columns + 0.5) * rect.width / columns - focalPoint.x;
            const y = (Math.floor(index / columns) + 0.5) * rect.height / rows - focalPoint.y;

            const angleToFocalPoint = Math.atan2(y, x);
            const targetRotation = (angleToFocalPoint * 180 / Math.PI) + 90;

            const rotationDelta = shortestRotation(line.currentRotation, targetRotation);
            line.currentRotation += rotationDelta * 0.05;
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

    // Event Listeners
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
        currentFocalPoint = updateFocalPoint(transitionStartTime);
    });

    gridElement.addEventListener('mouseleave', () => {
        isMouseInside = false;
        cycleStartTime = performance.now();
        currentFocalPoint = lastKnownPosition;
        targetFocalPoint = getRandomPoint();
    });

    createDebugButton(gridElement);
    cycleStartTime = performance.now();
    targetFocalPoint = getRandomPoint();
    requestAnimationFrame(animateLines);
};

window.createGridAnimation = createGridAnimation;