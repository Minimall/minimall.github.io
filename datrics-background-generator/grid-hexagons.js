let hexagons = [];
const hexagonSize = 30;
const numHexagons = 50;
let isPlaying = true;
let backgroundColor;
let graphics;
let colorMode = 'random';
let color1 = 'orange';
let color2 = 'orange';
let movementAngle = 0; // 0 degrees = left to right

function setup() {
    let canvas = createCanvas(600, 600);
    canvas.parent('canvasContainer');
    pixelDensity(2);
    initializeHexagons();
    backgroundColor = color(datrics.getAllColors()['graydark']);
    graphics = createGraphics(2000, 2000);
    graphics.pixelDensity(2);
}

function draw() {
    if (isPlaying) {
        graphics.push();
        graphics.fill(red(backgroundColor), green(backgroundColor), blue(backgroundColor), 25);
        graphics.noStroke();
        graphics.rect(0, 0, graphics.width, graphics.height);
        graphics.pop();

        graphics.push();
        hexagons.forEach(hexagon => {
            hexagon.update();
            hexagon.display(graphics);
        });
        graphics.pop();

        image(graphics, 0, 0, width, height, 0, 0, graphics.width, graphics.height);
    }
}

    graphics.push();
    hexagons.forEach(hexagon => {
        if (isPlaying) {
            hexagon.update();
        }
        hexagon.display(graphics);
    });
    graphics.pop();

    image(graphics, 0, 0, width, height, 0, 0, graphics.width, graphics.height);
}

function initializeHexagons() {
    hexagons = [];
    const gridSize = 10;
    const spacing = hexagonSize * 2;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            let x = (i - gridSize / 2) * spacing * 0.75;
            let y = (j - gridSize / 2) * spacing * sqrt(3) / 2;
            if (j % 2 === 0) x += spacing * 0.375;
            hexagons.push(new Hexagon(x, y));
        }
    }
}

class Hexagon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = random(1, 5);
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.05, 0.05);
        this.size = random(hexagonSize * 0.5, hexagonSize * 1.5);
        this.setColor();
    }

    setColor() {
        if (colorMode === 'random') {
            const colorKeys = Object.keys(datrics.colors);
            const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
            this.color = color(random(Object.values(datrics.colors[randomColor])));
        } else {
            const set1 = Object.values(datrics.colors[color1]);
            const set2 = Object.values(datrics.colors[color2]);
            this.color = color(random([...set1, ...set2]));
        }
    }

    update() {
        const angleRad = radians(movementAngle);
        this.x += cos(angleRad) * this.speed;
        this.y += sin(angleRad) * this.speed;
        this.rotation += this.rotationSpeed;

        if (this.isOffScreen()) {
            this.wrapAround();
        }
    }

    isOffScreen() {
        return (this.x < -graphics.width/2 || this.x > graphics.width/2 ||
                this.y < -graphics.height/2 || this.y > graphics.height/2);
    }

    wrapAround() {
        const angleRad = radians(movementAngle);
        if (cos(angleRad) > 0 && this.x > graphics.width/2) {
            this.x = -graphics.width/2;
        } else if (cos(angleRad) < 0 && this.x < -graphics.width/2) {
            this.x = graphics.width/2;
        }
        if (sin(angleRad) > 0 && this.y > graphics.height/2) {
            this.y = -graphics.height/2;
        } else if (sin(angleRad) < 0 && this.y < -graphics.height/2) {
            this.y = graphics.height/2;
        }
    }

    display(g) {
        g.push();
        g.translate(this.x, this.y);
        g.rotate(this.rotation);
        g.fill(red(this.color), green(this.color), blue(this.color), 200);
        g.noStroke();
        g.beginShape();
        for (let i = 0; i < 6; i++) {
            let angle = TWO_PI / 6 * i;
            let x = cos(angle) * this.size;
            let y = sin(angle) * this.size;
            g.vertex(x, y);
        }
        g.endShape(CLOSE);
        g.pop();
    }
}

function setBackgroundColor(colorName) {
    backgroundColor = color(datrics.getAllColors()[colorName]);
    graphics.clear();
    // Redraw the background immediately
    graphics.background(backgroundColor);
}

function setColorMode(mode) {
    colorMode = mode;
    hexagons.forEach(hexagon => hexagon.setColor());
}

function setColorPair(c1, c2) {
    color1 = c1;
    color2 = c2;
    if (colorMode === 'pair') {
        hexagons.forEach(hexagon => hexagon.setColor());
    }
}

function resetHexagons() {
    hexagons.forEach(hexagon => hexagon.setColor());
}

function togglePlay() {
    isPlaying = !isPlaying;
}

function setMovementAngle(angle) {
    movementAngle = angle;
}

function exportColored(filename) {
    saveCanvas(graphics, filename, 'png');
}

function exportTransparent(filename) {
    let exportCanvas = createGraphics(2000, 2000);
    exportCanvas.pixelDensity(2);

    exportCanvas.push();
    hexagons.forEach(hexagon => {
        hexagon.display(exportCanvas);
    });
    exportCanvas.pop();

    saveCanvas(exportCanvas, filename, 'png');
}
