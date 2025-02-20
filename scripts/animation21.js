const OPACITY_TRANSITION_TIME = 750;
const MOVEMENT_TIME = 16000;  
const PAUSE_TIME = 4000;     
const TRANSITION_DURATION = 125;

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