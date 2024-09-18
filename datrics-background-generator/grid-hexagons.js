const gridHexagons = (p) => {
  let hexagons = [];
  const hexagonSize = 30;
  const numHexagons = 50;
  let isPlaying = true;
  let backgroundColor;
  let graphics;
  let colorMode = "random";
  let color1 = "orange";
  let color2 = "orange";
  let movementAngle = 0; // 0 degrees = left to right

  p.setup = () => {
    let canvas = p.createCanvas(600, 600);
    canvas.parent("canvasContainer");
    p.pixelDensity(2);
    initializeHexagons();
    backgroundColor = p.color(datrics.getAllColors()["graydark"]);
    graphics = p.createGraphics(2000, 2000);
    graphics.pixelDensity(2);
  };

  p.draw = () => {
    if (isPlaying) {
      graphics.push();
      graphics.fill(
        p.red(backgroundColor),
        p.green(backgroundColor),
        p.blue(backgroundColor),
        25,
      );
      graphics.noStroke();
      graphics.rect(0, 0, graphics.width, graphics.height);
      graphics.pop();

      graphics.push();
      hexagons.forEach((hexagon) => {
        hexagon.update();
        hexagon.display(graphics);
      });
      graphics.pop();

      p.image(
        graphics,
        0,
        0,
        p.width,
        p.height,
        0,
        0,
        graphics.width,
        graphics.height,
      );
    }
  };

  function initializeHexagons() {
    hexagons = [];
    const gridSize = 10;
    const spacing = hexagonSize * 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        let x = (i - gridSize / 2) * spacing * 0.75;
        let y = ((j - gridSize / 2) * spacing * p.sqrt(3)) / 2;
        if (j % 2 === 0) x += spacing * 0.375;
        hexagons.push(new Hexagon(x, y));
      }
    }
  }

  class Hexagon {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.speed = p.random(1, 5);
      this.rotation = p.random(p.TWO_PI);
      this.rotationSpeed = p.random(-0.05, 0.05);
      this.size = p.random(hexagonSize * 0.5, hexagonSize * 1.5);
      this.setColor();
    }

    setColor() {
      if (colorMode === "random") {
        const colorKeys = Object.keys(datrics.colors);
        const randomColor = colorKeys[Math.floor(p.random(colorKeys.length))];
        this.color = p.color(
          p.random(Object.values(datrics.colors[randomColor])),
        );
      } else {
        const set1 = Object.values(datrics.colors[color1]);
        const set2 = Object.values(datrics.colors[color2]);
        this.color = p.color(p.random([...set1, ...set2]));
      }
    }

    update() {
      const angleRad = p.radians(movementAngle);
      this.x += p.cos(angleRad) * this.speed;
      this.y += p.sin(angleRad) * this.speed;
      this.rotation += this.rotationSpeed;

      if (this.isOffScreen()) {
        this.wrapAround();
      }
    }

    isOffScreen() {
      return (
        this.x < -graphics.width / 2 ||
        this.x > graphics.width / 2 ||
        this.y < -graphics.height / 2 ||
        this.y > graphics.height / 2
      );
    }

    wrapAround() {
      const angleRad = p.radians(movementAngle);
      if (p.cos(angleRad) > 0 && this.x > graphics.width / 2) {
        this.x = -graphics.width / 2;
      } else if (p.cos(angleRad) < 0 && this.x < -graphics.width / 2) {
        this.x = graphics.width / 2;
      }
      if (p.sin(angleRad) > 0 && this.y > graphics.height / 2) {
        this.y = -graphics.height / 2;
      } else if (p.sin(angleRad) < 0 && this.y < -graphics.height / 2) {
        this.y = graphics.height / 2;
      }
    }

    display(g) {
      g.push();
      g.translate(this.x, this.y);
      g.rotate(this.rotation);
      g.fill(p.red(this.color), p.green(this.color), p.blue(this.color), 200);
      g.noStroke();
      g.beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = (p.TWO_PI / 6) * i;
        let x = p.cos(angle) * this.size;
        let y = p.sin(angle) * this.size;
        g.vertex(x, y);
      }
      g.endShape(p.CLOSE);
      g.pop();
    }
  }

  return {
    setBackgroundColor: (colorName) => {
      backgroundColor = p.color(datrics.getAllColors()[colorName]);
      graphics.clear();
      graphics.background(backgroundColor);
    },
    setColorMode: (mode) => {
      colorMode = mode;
      hexagons.forEach((hexagon) => hexagon.setColor());
    },
    setColorPair: (c1, c2) => {
      color1 = c1;
      color2 = c2;
      if (colorMode === "pair") {
        hexagons.forEach((hexagon) => hexagon.setColor());
      }
    },
    setMovementAngle: (angle) => {
      movementAngle = angle;
    },
    togglePlay: () => {
      isPlaying = !isPlaying;
    },
    exportColored: (filename) => {
      p.saveCanvas(graphics, filename, "png");
    },
    exportTransparent: (filename) => {
      let exportCanvas = p.createGraphics(2000, 2000);
      exportCanvas.pixelDensity(2);

      exportCanvas.push();
      hexagons.forEach((hexagon) => {
        hexagon.display(exportCanvas);
      });
      exportCanvas.pop();

      p.saveCanvas(exportCanvas, filename, "png");
    },
    remove: () => {
      isPlaying = false;
    },
  };
};
