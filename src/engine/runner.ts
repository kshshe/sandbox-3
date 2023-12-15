import { BORDERS, POINT_RADIUS } from "./constants";
import { TPoint } from "./data.t";
import { powers } from "./powers";
import { multiplyVector } from "./utils/vector";

export const points: TPoint[] = [];

const REFLECTION = 0.2;

// @ts-ignore
window.points = points;

for (let i = 0; i < 50; i++) {
    points.push({
        position: {
            x: Math.random() * (BORDERS.maxX - BORDERS.minX) + BORDERS.minX,
            y: Math.random() * (BORDERS.maxY - BORDERS.minY) + BORDERS.minY,
        },
        velocity: {
            x: 0,
            y: 0,
        },
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
const step = () => {
    const now = Date.now();
    const timeDiff = now - lastTime;

    for (const point of points) {
        for (const power of powers) {
            power(point, timeDiff);
        }
    }

    for (const point of points) {
        point.position.x += point.velocity.x * timeDiff / 1000;
        point.position.y += point.velocity.y * timeDiff / 1000;

        point.velocity = multiplyVector(point.velocity, 0.99);

        processBorder(point, "x", "min", BORDERS.minX);
        processBorder(point, "x", "max", BORDERS.maxX);
        processBorder(point, "y", "min", BORDERS.minY);
        processBorder(point, "y", "max", BORDERS.maxY);
    }

    requestAnimationFrame(step);
}

export const run = () => {
    step();
}