import { BORDERS, INITIAL_POINTS_COUNT, MAX_ACCELERATION, MAX_POINTS_COUNT, POINT_RADIUS } from "./constants";
import { initControl } from "./controls";
import { TPoint } from "./data.t";
import { powers } from "./powers";
import { getVectorLength, multiplyVector } from "./utils/vector";
import { FPS } from 'yy-fps'
const fps = new FPS({
    FPS: 200,
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
    for (const point of points) {
        sum += getVectorLength(point.velocity);
    }
    return sum / points.length;
}

const REFLECTION = 0.45;

const getNewPoint = (x?: number, y?: number): TPoint => ({
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
});

for (let i = 0; i < INITIAL_POINTS_COUNT; i++) {
    points.push(getNewPoint());
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

const MAX_SPEED = 300;

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
    const timeDiff = (now - lastTime) * speedMultiplier;

    for (const point of points) {
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

    for (const point of points) {
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

export const run = async () => {
    while (true) {
        step();
        await new Promise((resolve) => setTimeout(resolve, paused ? 100 : 0));
    }
}

const statusBlock = document.querySelector('.status') as HTMLDivElement;

const getUniquePositionsCount = () => {
    const positions = new Set<string>();
    for (const point of points) {
        positions.add(`${point.position.x.toFixed(1)}:${point.position.y.toFixed(1)}`);
    }
    return positions.size;
}

const stringToMaxLen = (str: string, len: number) => {
    if (str.length > len) {
        return str.slice(0, len - 3) + '...';
    }
    return str;
}

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