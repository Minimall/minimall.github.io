const OPACITY_TRANSITION_TIME = 375;
const MOVEMENT_TIME = 8000;   // 2x faster
const PAUSE_TIME = 1000;      // 4x shorter
const TRANSITION_DURATION = 62;

let line = {
  currentRotation: 0,
};

function animate() {
  // ... other animation logic ...

  line.currentRotation += rotationDelta * 0.0375;

  // ... rest of the animation logic ...

  requestAnimationFrame(animate);
}

animate();

export { MOVEMENT_TIME, PAUSE_TIME, OPACITY_TRANSITION_TIME, TRANSITION_DURATION };