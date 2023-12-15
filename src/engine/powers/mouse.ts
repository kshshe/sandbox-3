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
const BASE_FORCE = 20;

export const mouseProcessor: TPowerProcessor = (point, timeDiff) => {
    if (!mousePosition) {
        return;
    }

    const distance = getDistance(point.position, mousePosition);
    if (distance > MAX_MOUSE_DISTANCE) {
        return;
    }

    const force = mouseDirection * BASE_FORCE * timeDiff / 1000;
    const direction = {
        x: mousePosition.x - point.position.x,
        y: mousePosition.y - point.position.y,
    };

    const length = getDistance({ x: 0, y: 0 }, direction);
    const normalizedDirection = {
        x: direction.x / length,
        y: direction.y / length,
    };

    point.velocity.x += normalizedDirection.x * force;
    point.velocity.y += normalizedDirection.y * force;
}