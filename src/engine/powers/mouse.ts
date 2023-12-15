import { TVector } from "../data.t";
import { TPowerProcessor } from "./powers";
import { getDistance } from "../utils/vector";

let mousePosition: TVector | null = null;

export const setMousePosition = (position: TVector | null) => {
    mousePosition = position;
}

export const MAX_MOUSE_DISTANCE = 300;
const BASE_FORCE = 20;

export const mouseProcessor: TPowerProcessor = (point, timeDiff) => {
    if (!mousePosition) {
        return;
    }

    const distance = getDistance(point.position, mousePosition);
    if (distance > MAX_MOUSE_DISTANCE) {
        return;
    }

    const force = BASE_FORCE * timeDiff / 1000;
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