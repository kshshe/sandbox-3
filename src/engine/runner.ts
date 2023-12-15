import { BORDERS, POINT_RADIUS } from "./constants";
import { TPoint } from "./data.t";
import { powers } from "./powers";

export const points: TPoint[] = [];

const REFLECTION = 0.8;

// @ts-ignore
window.points = points;

points.push({
    position: { x: 100, y: 100 },
    velocity: { x: 0, y: 0 },
});

points.push({
    position: { x: 200, y: 100 },
    velocity: { x: 0, y: 0 },
});

points.push({
    position: { x: 120, y: 150 },
    velocity: { x: 20, y: 0 },
});

const processBorder = (point: TPoint, axis: "x" | "y", minOrMax: "min" | "max", borderValue: number) => {
    if (minOrMax === "min") {
        if (point.position[axis] < borderValue) {
            point.position[axis] = borderValue + POINT_RADIUS;
            point.velocity[axis] *= -REFLECTION;
        }
    }
    if (minOrMax === "max") {
        if (point.position[axis] > borderValue) {
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