function createGridAnimation(gridElement) {
    console.log("Starting grid animation");
    if (!gridElement) {
        console.error("No grid element provided");
        return;
    }
    const lines = [];
    const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
        "#F7FFF7", "#FFE66D", "#6B5B95", "#88D8B0", "#FF8C94"
    ];

    const OPACITY_TRANSITION_TIME = 750;
    const MOVEMENT_TIME = 2000;
    const PAUSE_TIME = 500;
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
        const columns = Math.max(Math.min(Math.floor(width / 60), 32), 16);
        const rows = Math.max(Math.floor(height / 60), 16);
        
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

    const debugDot = document.createElement('div');
    debugDot.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: red;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        transform: translate(-50%, -50%);
    `;
    gridElement.appendChild(debugDot);

    let lastRectWidth = 0;
    let lastRectHeight = 0;
    let linePositions = [];

    function precalculateLinePositions(rect) {
        if (rect.width === lastRectWidth && rect.height === lastRectHeight) return;
        
        lastRectWidth = rect.width;
        lastRectHeight = rect.height;
        linePositions = lines.map((_, index) => ({
            x: (index % columns + 0.5) * rect.width / columns,
            y: (Math.floor(index / columns) + 0.5) * rect.height / rows
        }));
    }

    function animateLines(currentTime) {
        const deltaTime = currentTime - (animateLines.lastTime || currentTime);
        if (deltaTime < 16) { // Cap at ~60fps
            requestAnimationFrame(animateLines);
            return;
        }
        animateLines.lastTime = currentTime;

        const currentPosition = updatePosition(currentTime);
        const rect = gridElement.getBoundingClientRect();

        debugDot.style.left = `${currentPosition.x}px`;
        debugDot.style.top = `${currentPosition.y}px`;

        precalculateLinePositions(rect);

        lines.forEach((line, index) => {
            const pos = linePositions[index];
            const dx = currentPosition.x - pos.x;
            const dy = currentPosition.y - pos.y;

            const angleToFocalPoint = Math.atan2(dy, dx);
            const targetRotation = (angleToFocalPoint * 180 / Math.PI) + 90;

            const rotationDelta = shortestRotation(line.currentRotation, targetRotation);
            line.currentRotation += rotationDelta * 0.1;
            line.currentRotation %= 360;

            line.element.style.transform = `rotate(${line.currentRotation}deg)`;
            updateLineOpacity(line, deltaTime);

            if (Math.random() < 0.0005) {
                line.targetColor = colors[Math.floor(Math.random() * colors.length)];
                line.element.style.backgroundColor = line.targetColor;
            }
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