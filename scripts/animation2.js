const CYCLE = {
  ACCELERATION: 6000,
  DECELERATION: 6000,
  PAUSE: 4500
};

const DEBUG = {
  enabled: false,
  speedMultiplier: 6,
  dotSize: 8
};

class GridAnimation {
  constructor(element) {
    this.element = element;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.element.appendChild(this.canvas);

    // Create debug button
    this.debugButton = document.createElement('button');
    this.debugButton.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 56px;
      height: 56px;
      opacity: 0;
      cursor: pointer;
      z-index: 1000;
    `;
    this.element.appendChild(this.debugButton);

    this.setupCanvas();
    this.setupEvents();
    this.initAnimation();
  }

  setupCanvas() {
    this.resize = () => {
      this.width = this.element.clientWidth;
      this.height = this.element.clientHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
    };
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  setupEvents() {
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.debugButton.addEventListener('click', () => {
      DEBUG.enabled = !DEBUG.enabled;
      if (!DEBUG.enabled) this.ctx.clearRect(0, 0, this.width, this.height);
    });
  }

  easeInQuad(t) { return t * t; }
  easeOutQuad(t) { return t * (2 - t); }
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  initAnimation() {
    this.focalPoint = { x: this.centerX, y: this.centerY };
    this.targetPoint = { x: this.centerX, y: this.centerY };
    this.isMouseControlled = false;
    this.cycleStartTime = performance.now();
    this.animate();
  }

  updateAutomaticMovement(currentTime) {
    const cycleTime = DEBUG.enabled ? 
      (CYCLE.ACCELERATION + CYCLE.DECELERATION + CYCLE.PAUSE) / DEBUG.speedMultiplier :
      CYCLE.ACCELERATION + CYCLE.DECELERATION + CYCLE.PAUSE;

    const localTime = (currentTime - this.cycleStartTime) % cycleTime;

    if (localTime < CYCLE.ACCELERATION) {
      // Acceleration phase
      const t = this.easeInQuad(localTime / CYCLE.ACCELERATION);
      this.focalPoint.x = this.centerX + Math.sin(currentTime * 0.001) * 100 * t;
      this.focalPoint.y = this.centerY + Math.cos(currentTime * 0.001) * 100 * t;
    } else if (localTime < CYCLE.ACCELERATION + CYCLE.DECELERATION) {
      // Deceleration phase
      const t = this.easeOutQuad((localTime - CYCLE.ACCELERATION) / CYCLE.DECELERATION);
      this.focalPoint.x = this.centerX + Math.sin(currentTime * 0.001) * 100 * (1 - t);
      this.focalPoint.y = this.centerY + Math.cos(currentTime * 0.001) * 100 * (1 - t);
    } else {
      // Pause phase - point stays at center
      this.focalPoint.x = this.centerX;
      this.focalPoint.y = this.centerY;
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.isMouseControlled = true;
    this.targetPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleMouseLeave() {
    this.isMouseControlled = false;
    this.cycleStartTime = performance.now();
  }

  drawGrid() {
    // Grid drawing logic here
  }

  animate() {
    const currentTime = performance.now();

    if (!this.isMouseControlled) {
      this.updateAutomaticMovement(currentTime);
    } else {
      const t = this.easeInOutCubic(0.1);
      this.focalPoint.x += (this.targetPoint.x - this.focalPoint.x) * t;
      this.focalPoint.y += (this.targetPoint.y - this.focalPoint.y) * t;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid();

    if (DEBUG.enabled) {
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(
        this.focalPoint.x - DEBUG.dotSize/2,
        this.focalPoint.y - DEBUG.dotSize/2,
        DEBUG.dotSize,
        DEBUG.dotSize
      );
    }

    requestAnimationFrame(this.animate.bind(this));
  }
}

function createGridAnimation(element) {
  return new GridAnimation(element);
}