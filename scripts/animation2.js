
const createGridAnimation = (gridElement) => {
    const lines = [];
    const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
        "#F7FFF7", "#FFE66D", "#6B5B95", "#88D8B0", "#FF8C94",
        "#FFDAB9", "#B5EAD7", "#C7CEEA", "#FF9AA2", "#E6E6FA"
    ];
    const OPACITY_TRANSITION_TIME = 6000;
    const ACCELERATION_TIME = 8000;
    const DECELERATION_TIME = 8000;
    const PAUSE_TIME = 6000;
    const TOTAL_CYCLE_TIME = ACCELERATION_TIME + DECELERATION_TIME + PAUSE_TIME;
    const TRANSITION_DURATION = 1000;

    let mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lastKnownPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let currentFocalPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let targetFocalPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let cycleStartTime = 0;
    let isMouseInside = false;
    let transitionStartTime = 0;

    // Create grid lines
    for (let i = 0; i < 400; i++) {
        const line = document.createElement('div');
        line.className = 'line';
        gridElement.appendChild(line);
        lines.push({
            element: line,
            color: colors[Math.floor(Math.random() * colors.length)],
            targetColor: colors[Math.floor(Math.random() * colors.length)],
            colorTransitionProgress: 0,
            currentRotation: 0,
            opacity: 1,
            targetOpacity: 1,
            opacityTransitionProgress: 1,
            opacityPauseTime: 0
        });
    }

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
        return t * t;
    }

    function easeOutQuad(t) {
        return t * (2 - t);
    }

    function lerpPoint(a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t
        };
    }

    function updateFocalPoint(currentTime) {
        if (isMouseInside) {
            const elapsedTransitionTime = currentTime - transitionStartTime;
            if (elapsedTransitionTime < TRANSITION_DURATION) {
                const t = elapsedTransitionTime / TRANSITION_DURATION;
                return lerpPoint(currentFocalPoint, mousePosition, easeInOutCubic(t));
            } else {
                return mousePosition;
            }
        }

        const elapsedTime = (currentTime - cycleStartTime) % TOTAL_CYCLE_TIME;

        if (elapsedTime < ACCELERATION_TIME) {
            const t = elapsedTime / ACCELERATION_TIME;
            const easedT = easeInQuad(t) / 2;
            return lerpPoint(currentFocalPoint, targetFocalPoint, easedT);
        } else if (elapsedTime < ACCELERATION_TIME + DECELERATION_TIME) {
            const t = (elapsedTime - ACCELERATION_TIME) / DECELERATION_TIME;
            const easedT = 0.5 + easeOutQuad(t) / 2;
            return lerpPoint(currentFocalPoint, targetFocalPoint, easedT);
        } else {
            if (Math.abs(elapsedTime - (ACCELERATION_TIME + DECELERATION_TIME)) < 16) {
                currentFocalPoint = targetFocalPoint;
                targetFocalPoint = getRandomPoint();
                cycleStartTime = currentTime;
            }
            return currentFocalPoint;
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
            const t = easeInOutCubic(line.opacityTransitionProgress);
            line.opacity = line.opacity + (line.targetOpacity - line.opacity) * t;
        } else if (line.opacityPauseTime > 0) {
            line.opacityPauseTime -= deltaTime;
            if (line.opacityPauseTime <= 0) {
                line.targetOpacity = line.targetOpacity === 0 ? 1 : 0;
                line.opacityTransitionProgress = 0;
            }
        } else if (Math.random() < 0.0005) {
            line.targetOpacity = line.targetOpacity === 0 ? 1 : 0;
            line.opacityTransitionProgress = 0;
            line.opacityPauseTime = Math.random() * 3000 + 1000;
        }
    }

    function animateLines(currentTime) {
        const deltaTime = currentTime - (animateLines.lastTime || currentTime);
        animateLines.lastTime = currentTime;

        const focalPoint = updateFocalPoint(currentTime);

        lines.forEach((line, index) => {
            const rect = gridElement.getBoundingClientRect();
            const x = (index % 20 + 0.5) * rect.width / 20 - focalPoint.x;
            const y = (Math.floor(index / 20) + 0.5) * rect.height / 20 - focalPoint.y;

            const angleToFocalPoint = Math.atan2(y, x);
            const targetRotation = (angleToFocalPoint * 180 / Math.PI) + 90;

            const rotationDelta = shortestRotation(line.currentRotation, targetRotation);
            line.currentRotation += rotationDelta * 0.05;
            line.currentRotation %= 360;

            line.element.style.transform = `rotate(${line.currentRotation}deg)`;

            line.colorTransitionProgress += 0.01;
            if (line.colorTransitionProgress >= 1 || Math.random() < 0.001) {
                line.color = line.targetColor;
                line.targetColor = colors[Math.floor(Math.random() * colors.length)];
                line.colorTransitionProgress = 0;
            }
            
            line.element.style.backgroundColor = line.targetColor;
            updateLineOpacity(line, deltaTime);
            line.element.style.opacity = line.opacity;
        });

        requestAnimationFrame(animateLines);
    }

    gridElement.addEventListener('mousemove', (event) => {
        mousePosition.x = event.clientX;
        mousePosition.y = event.clientY;
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

    cycleStartTime = performance.now();
    targetFocalPoint = getRandomPoint();
    requestAnimationFrame(animateLines);
};

window.createGridAnimation = createGridAnimation;
