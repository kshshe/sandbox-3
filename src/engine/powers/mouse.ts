import { TVector } from "../data.t";
import { TPowerProcessor } from "./powers";
import { getDistance } from "../utils/vector";

let mousePosition: TVector | null = null;
let mouseDirection: 1 | -1 = 1;

export const setMousePosition = (position: TVector | null, direction: typeof mouseDirection = mouseDirection) => {
    mousePosition = position;
    mouseDirection = direction;
}

export const MAX_MOUSE_DISTANCE = 150;
const BASE_FORCE = 40;

export const mouseProcessor: TPowerProcessor = (point) => {
    if (!mousePosition) {
        return;
    }

    const distance = getDistance(point.position, mousePosition);
    if (distance > MAX_MOUSE_DISTANCE) {
        return;
    }

    const force = mouseDirection * BASE_FORCE;
    const direction = {
        x: mousePosition.x - point.position.x,
        y: mousePosition.y - point.position.y,
    };

    const length = getDistance({ x: 0, y: 0 }, direction) + 1;
    const normalizedDirection = {
        x: direction.x / length,
        y: direction.y / length,
    };

    if (isNaN(normalizedDirection.x) || isNaN(normalizedDirection.y)) {
        return
    }

    point.acceleration.x += normalizedDirection.x * force;
    point.acceleration.y += normalizedDirection.y * force;
}