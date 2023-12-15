import { BORDERS, POINT_RADIUS } from "./constants";
import { TPoint } from "./data.t";
import { powers } from "./powers";
import { multiplyVector } from "./utils/vector";
import { FPS } from 'yy-fps'
const fps = new FPS()

export const points: TPoint[] = [];

const REFLECTION = 0.45;

// @ts-ignore
window.points = points;

for (let i = 0; i < 1000; i++) {
    points.push({
        position: {
            x: Math.random() * (BORDERS.maxX - BORDERS.minX) + BORDERS.minX,
            y: Math.random() * (BORDERS.maxY - BORDERS.minY) + BORDERS.minY,
        },
        velocity: {
            x: 0,
            y: 0,
        },
        temporaryData: {},
    });
}

const processBorder = (point: TPoint, axis: "x" | "y", minOrMax: "min" | "max", borderValue: number) => {
    if (minOrMax === "min") {
        if (point.position[axis] <= borderValue + POINT_RADIUS) {
            point.position[axis] = borderValue + POINT_RADIUS;
            point.velocity[axis] *= -REFLECTION;
        }
    }
    if (minOrMax === "max") {
        if (point.position[axis] >= borderValue - POINT_RADIUS) {
            point.position[axis] = borderValue - POINT_RADIUS;
            point.velocity[axis] *= -REFLECTION;
        }
    }
}

let lastTime = Date.now();
let paused: boolean = false;

window.addEventListener('blur', () => {
    paused = true;
});

window.addEventListener('focus', () => {
    paused = false;
    lastTime = Date.now();
});

const step = () => {
    const now = Date.now();
    if (paused) {
        lastTime = now;
        requestAnimationFrame(step);
        return;
    }

    const timeDiff = (now - lastTime) * 7;

    for (const point of points) {
        for (const power of powers) {
            power(point, timeDiff);
        }
    }

    for (const point of points) {
        point.velocity = multiplyVector(point.velocity, 0.9999);

        if (Math.abs(point.velocity.x) < 0.1) {
            point.velocity.x = 0;
        }

        if (Math.abs(point.velocity.y) < 0.1) {
            point.velocity.y = 0;
        }   

        processBorder(point, "x", "min", BORDERS.minX);
        processBorder(point, "x", "max", BORDERS.maxX);
        processBorder(point, "y", "min", BORDERS.minY);
        processBorder(point, "y", "max", BORDERS.maxY);

        point.position.x += point.velocity.x * timeDiff / 1000;
        point.position.y += point.velocity.y * timeDiff / 1000;
    }

    lastTime = now;
    fps.frame()
    requestAnimationFrame(step);
}

export const run = () => {
    step();
}