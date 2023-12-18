import { BORDERS, POINT_RADIUS } from "./constants";
import { initControl } from "./controls";
import { TPoint } from "./data.t";
import { powers } from "./powers";
import { getVectorLength, multiplyVector } from "./utils/vector";
import { FPS } from 'yy-fps'
const fps = new FPS()

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

const getRandomPoint = (): TPoint => ({
    position: {
        x: Math.random() * (BORDERS.maxX - BORDERS.minX) + BORDERS.minX,
        y: Math.random() * (BORDERS.maxY - BORDERS.minY) + BORDERS.minY,
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

for (let i = 0; i < 1000; i++) {
    points.push(getRandomPoint());
}

initControl('input#count', (e) => {
    const newCount = parseInt((e.target as HTMLInputElement).value);
    if (newCount > points.length) {
        for (let i = 0; i < newCount - points.length; i++) {
            points.push(getRandomPoint());
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

let lastTime = Date.now();
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

initControl('input#speed', (e) => {
    speedMultiplier = parseInt((e.target as HTMLInputElement).value) / 10
})

const times: number[] = [];

const step = () => {
    const now = Date.now();
    if (paused) {
        lastTime = now - 10;
        requestAnimationFrame(step);
        return;
    }

    const startTime = performance.now();
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
        if (isNaN(point.velocity.x) || isNaN(point.velocity.y)) {
            // console.log(point)
            // debugger
            point.velocity.x = point.velocity.x || 0;
            point.velocity.y = point.velocity.y || 0;
        }

        point.velocity = multiplyVector(point.velocity, 0.9999);

        point.velocity.x += point.acceleration.x * timeDiff / 1000;
        point.velocity.y += point.acceleration.y * timeDiff / 1000;

        if (Math.abs(point.velocity.x) < 0.1) {
            point.velocity.x = 0;
        }

        if (Math.abs(point.velocity.y) < 0.1) {
            point.velocity.y = 0;
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
    times.push(endTime - startTime);

    if (times.length > 100) {
        times.shift();
    }

    requestAnimationFrame(step);
}

export const run = () => {
    step();
}

const statusBlock = document.querySelector('.status') as HTMLDivElement;

const getUniquePositionsCount = () => {
    const positions = new Set<string>();
    for (const point of points) {
        positions.add(`${point.position.x.toFixed(3)}:${point.position.y.toFixed(3)}`);
    }
    return positions.size;
}

const updateStatus = () => {
    const text = [
        `AVG speed: ${window.getAverageSpeed().toFixed(2)}`,
        `Points: ${points.length}`,
        `Unique positions: ${(100 * getUniquePositionsCount() / points.length).toFixed(2)}%`,
        process.env.VERCEL_GIT_COMMIT_MESSAGE && `Commit: ${process.env.VERCEL_GIT_COMMIT_MESSAGE}`,
        `AVG time: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)}ms`,
    ].filter(Boolean).join('<br />');
    statusBlock.innerHTML = text;
}

setInterval(updateStatus, 1000);