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