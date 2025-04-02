import { BORDERS, INITIAL_POINTS_COUNT, MAX_ACCELERATION, MAX_FRAME_TIME, MAX_POINTS_COUNT, MAX_SPEED, POINT_RADIUS } from "./constants";
import { initControl } from "./controls";
import { TPoint } from "./data.t";
import { powers } from "./powers";
import { getVectorLength, multiplyVector } from "./utils/vector";
import { FPS } from 'yy-fps'
const fps = new FPS({
    FPS: 1000,
    meter: false,
    text: ' processings per second',
})

export const points: TPoint[] = [];

declare global {
    interface Window {
        getAverageSpeed: () => number;
        points: TPoint[];
    }
}

window.points = points;
window.getAverageSpeed = () => {
    let sum = 0;
    const nonStaticPoints = points.filter(point => !point.isStatic);
    for (const point of nonStaticPoints) {
        sum += getVectorLength(point.velocity);
    }
    return sum / points.length;
}

const REFLECTION = 0.45;

const getNewPoint = (x?: number, y?: number, isStatic?: boolean): TPoint => ({
    position: {
        x: x || (Math.random() * (BORDERS.maxX - BORDERS.minX) + BORDERS.minX),
        y: y || (Math.random() * (BORDERS.maxY - BORDERS.minY) + BORDERS.minY),
    },
    velocity: {
        x: 0,
        y: 0,
    },
    acceleration: {
        x: 0,
        y: 0,
    },
    temporaryData: {},
    isStatic,
});

for (let i = 0; i < INITIAL_POINTS_COUNT; i++) {
    points.push(getNewPoint());
}

// draw a static square in the middle of the screen
const width = window.innerWidth / 4
const height = window.innerHeight / 4
const x = window.innerWidth / 2 - width / 2
const y = window.innerHeight / 2 - height / 2

// bottom line
for (let i = 0; i < width; i++) {
    points.push(getNewPoint(x + i, y + height, true));
    points.push(getNewPoint(x + i, y + height + 4, true));
}

// left line
for (let i = 0; i < height; i++) {
    points.push(getNewPoint(x, y + i, true));
    points.push(getNewPoint(x - 4, y + i, true));
}   

// right line
for (let i = 0; i < height; i++) {
    points.push(getNewPoint(x + width, y + i, true));
    points.push(getNewPoint(x + width + 4, y + i, true));
}





const countInput = document.querySelector('input#count') as HTMLInputElement;

if (countInput) {
    countInput.value = INITIAL_POINTS_COUNT.toString();
    countInput.setAttribute('max', MAX_POINTS_COUNT.toString());
}

initControl('input#count', (e) => {
    const newCount = parseInt((e.target as HTMLInputElement).value);
    if (newCount > points.length) {
        const allowedToAdd = MAX_POINTS_COUNT - points.length;
        const toAdd = Math.min(allowedToAdd, newCount - points.length);
        for (let i = 0; i < toAdd; i++) {
            points.push(getNewPoint());
        }
    } else {
        points.splice(newCount, points.length - newCount);
    }
});

const processBorder = (point: TPoint, axis: "x" | "y", minOrMax: "min" | "max", borderValue: number) => {
    const axisVelocity = point.velocity[axis];
    const isSmall = Math.abs(axisVelocity) < 5;
    if (minOrMax === "min") {
        if (point.position[axis] <= borderValue + POINT_RADIUS - 1) {
            point.position[axis] = borderValue + POINT_RADIUS;
            if (isSmall) {
                point.velocity[axis] = 0;
                return;
            }
            point.velocity[axis] *= -REFLECTION;
            return;
        }
    }
    if (minOrMax === "max") {
        if (point.position[axis] >= borderValue - POINT_RADIUS + 1) {
            point.position[axis] = borderValue - POINT_RADIUS;
            point.velocity[axis] *= -REFLECTION;
            if (isSmall) {
                point.velocity[axis] = 0;
                return;
            }
        }
    }
}

let lastTime: number | null = null;
let paused: boolean = false;

if (location.hostname !== 'localhost') {
    window.addEventListener('blur', () => {
        paused = true;
        lastTime = Date.now();
    });

    window.addEventListener('focus', () => {
        paused = false;
        lastTime = Date.now();
    });
}

let speedMultiplier = 7;

document.body.addEventListener('keydown', (e) => {
    const isSpace = e.code === 'Space';
    const isOne = e.code === 'Digit1';
    const isTwo = e.code === 'Digit2';
    const isThree = e.code === 'Digit3';

    if (isSpace || isOne || isTwo || isThree) {
        e.preventDefault();
    }

    if (isSpace) {
        paused = !paused;
    }

    if (isOne) {
        speedMultiplier = 0.1;
    }

    if (isTwo) {
        speedMultiplier = 7;
    }

    if (isThree) {
        speedMultiplier = 10;
    }

    const input = document.querySelector('input#speed') as HTMLInputElement;
    input.value = (speedMultiplier * 10).toString();
})

initControl('input#speed', (e) => {
    speedMultiplier = parseInt((e.target as HTMLInputElement).value) / 10
})

let lastStepDuration = 0;

let slowdownPower = 999;

initControl('input#slowdown-power', (e) => {
    slowdownPower = parseInt((e.target as HTMLInputElement).value);
})

const step = () => {
    const now = Date.now();
    if (paused) {
        lastTime = now - 10;
        return;
    }

    const startTime = performance.now();
    if (!lastTime) {
        lastTime = now - 10;
    }
    const timeElapsed = Math.min(MAX_FRAME_TIME, now - lastTime);
    const timeDiff = timeElapsed * speedMultiplier;

    const nonStaticPoints: TPoint[] = [];
    const staticPoints: TPoint[] = [];

    for (const point of points) {
        if (point.isStatic) {
            staticPoints.push(point);
        } else {
            nonStaticPoints.push(point);
        }
    }

    for (const point of nonStaticPoints) {
        point.acceleration.x = 0;
        point.acceleration.y = 0;

        for (const power of powers) {
            const isParallel = !!power.isParallel;
            if (isParallel) {
                continue;
            }
            power(point, timeDiff);
        }
    }

    for (const power of powers) {
        const isParallel = !!power.isParallel;
        if (!isParallel) {
            continue;
        }
        power(points);
    }

    for (const point of staticPoints) {
        point.velocity.x = 0;
        point.velocity.y = 0;
        point.acceleration.x = 0;
        point.acceleration.y = 0;
    }

    for (const point of nonStaticPoints) {
        if (isNaN(point.velocity.x)) {
            console.count('NaN velocity X')
            point.velocity.x = point.velocity.x || 0;
        }

        if (isNaN(point.velocity.y)) {
            console.count('NaN velocity Y')
            point.velocity.y = point.velocity.y || 0;
        }

        const accelerationLength = getVectorLength(point.acceleration);
        if (accelerationLength > MAX_ACCELERATION) {
            point.acceleration = multiplyVector(point.acceleration, MAX_ACCELERATION / accelerationLength);
        }

        point.velocity = multiplyVector(point.velocity, Math.pow((slowdownPower / 1000), timeDiff / 1000));

        point.velocity.x += point.acceleration.x * timeDiff / 1000;
        point.velocity.y += point.acceleration.y * timeDiff / 1000;

        const velocityLength = getVectorLength(point.velocity);
        if (velocityLength > MAX_SPEED) {
            point.velocity = multiplyVector(point.velocity, MAX_SPEED / velocityLength);
        }

        point.position.x += point.velocity.x * timeDiff / 1000;
        point.position.y += point.velocity.y * timeDiff / 1000;

        processBorder(point, "x", "min", BORDERS.minX);
        processBorder(point, "x", "max", BORDERS.maxX);
        processBorder(point, "y", "min", BORDERS.minY);
        processBorder(point, "y", "max", BORDERS.maxY);
    }

    lastTime = now;
    fps.frame()

    const endTime = performance.now();
    lastStepDuration = endTime - startTime;
}

const waitFastest = async () => {
    let t: NodeJS.Timeout | null = null
    let f: number | null = null
    await Promise.race([
        new Promise((resolve) => t = setTimeout(resolve)),
        new Promise((resolve) => f = requestAnimationFrame(resolve)),
    ])
    if (t) {
        clearTimeout(t)
    }
    if (f) {
        cancelAnimationFrame(f)
    }
};

export const run = async () => {
    while (true) {
        step();
        if (paused) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await waitFastest();
    }
}

const statusBlock = document.querySelector('.status') as HTMLDivElement;

const updateStatus = () => {
    const text = [
        // `AVG speed: ${window.getAverageSpeed().toFixed(2)}`,
        // `Max speed: ${points.reduce((a, b) => Math.max(a, getVectorLength(b.velocity)), 0).toFixed(2)}`,
        `Points: ${points.length}`,
        // `Unique positions: ${(100 * getUniquePositionsCount() / points.length).toFixed(2)}%`,
        // process.env.VERCEL_GIT_COMMIT_MESSAGE && `Commit: <span title="${process.env.VERCEL_GIT_COMMIT_MESSAGE}">${stringToMaxLen(process.env.VERCEL_GIT_COMMIT_MESSAGE, 15)}</span>`,
        `Step: ${lastStepDuration > 16 ? '🐌' : (lastStepDuration > 10 ? '⚠️ ' : '')}${lastStepDuration.toFixed(2)}ms`,

        paused && '<hr>PAUSED',
    ].filter(Boolean).join('<br />');
    statusBlock.innerHTML = text;
}

setInterval(updateStatus, 1000);