function calculateMovementPhase(elapsedTime) {
        const movementTime = ACCELERATION_TIME + DECELERATION_TIME;

        if (elapsedTime < movementTime) {
            return {
                type: 'move',
                progress: elapsedTime / movementTime
            };
        }

        if (elapsedTime >= TOTAL_CYCLE_TIME) {
            return { type: 'complete' };
        }

        return { type: 'pause' };
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
        let nextPoint;

        do {
            nextPoint = getRandomPoint();
        } while (
            Math.hypot(nextPoint.x - currentFocalPoint.x, nextPoint.y - currentFocalPoint.y) < 100 ||
            Math.hypot(nextPoint.x - currentFocalPoint.x, nextPoint.y - currentFocalPoint.y) > window.innerWidth / 3
        );

        targetFocalPoint = nextPoint;
        cycleStartTime = currentTime;
    }
function createGridAnimation(container) {
    const debugMode = {
        enabled: false,
        button: null
    };

    // Create and append debug button
    const debugButton = document.createElement('div');
    debugButton.style.cssText = 'position: absolute; width: 56px; height: 56px; top: 0; left: 0; cursor: pointer; z-index: 100;';
    container.appendChild(debugButton);

    debugButton.addEventListener('click', () => {
        debugMode.enabled = !debugMode.enabled;
        if (debugMode.enabled) {
            TOTAL_CYCLE_TIME /= 6;
        } else {
            TOTAL_CYCLE_TIME *= 6;
        }
    });

    // Grid setup
    container.style.display = 'grid';
    const cols = 20;
    const rows = 20;
    
    for (let i = 0; i < cols * rows; i++) {
        const line = document.createElement('div');
        line.className = 'line';
        line.style.background = '#EAEAEA';
        container.appendChild(line);
    }

    // Start animation loop
    let currentFocalPoint = { x: container.offsetWidth / 2, y: container.offsetHeight / 2 };
    let targetFocalPoint = getRandomPoint();
    let cycleStartTime = performance.now();

    function animate() {
        const currentTime = performance.now();
        const elapsedTime = currentTime - cycleStartTime;
        const phase = calculateMovementPhase(elapsedTime);

        if (phase.type === 'complete') {
            prepareNextCycle(currentTime);
        }

        const focalPoint = calculatePointForPhase(phase);
        updateLines(container, focalPoint, debugMode.enabled);
        requestAnimationFrame(animate);
    }

    animate();
}

// Constants
const ACCELERATION_TIME = 1000;
const DECELERATION_TIME = 1000;
let TOTAL_CYCLE_TIME = 4000;

function getRandomPoint() {
    const container = document.querySelector('.grid-animation');
    return {
        x: Math.random() * container.offsetWidth,
        y: Math.random() * container.offsetHeight
    };
}

function updateLines(container, focalPoint, isDebugMode) {
    const lines = container.querySelectorAll('.line');
    const rect = container.getBoundingClientRect();
    
    lines.forEach((line, i) => {
        const col = i % 20;
        const row = Math.floor(i / 20);
        const x = (col + 0.5) * (rect.width / 20);
        const y = (row + 0.5) * (rect.height / 20);
        
        const dx = x - focalPoint.x;
        const dy = y - focalPoint.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const opacity = Math.max(0.1, Math.min(1, distance / 500));
        
        line.style.transform = `rotate(${angle}deg)`;
        line.style.opacity = opacity;
    });

    // Debug mode: show focal point
    if (isDebugMode) {
        let debugDot = container.querySelector('.debug-dot');
        if (!debugDot) {
            debugDot = document.createElement('div');
            debugDot.className = 'debug-dot';
            debugDot.style.cssText = 'position: absolute; width: 8px; height: 8px; background: red; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none;';
            container.appendChild(debugDot);
        }
        debugDot.style.left = `${focalPoint.x}px`;
        debugDot.style.top = `${focalPoint.y}px`;
    } else {
        const debugDot = container.querySelector('.debug-dot');
        if (debugDot) debugDot.remove();
    }
}

function lerpPoint(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t
    };
}

function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
