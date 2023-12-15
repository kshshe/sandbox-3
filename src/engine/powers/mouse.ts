import { TVector } from "../data.t";
import { TPowerProcessor } from "./powers";
import { getDistance } from "../utils/vector";

let mousePosition: TVector | null = null;

export const setMousePosition = (position: TVector | null) => {
    mousePosition = position;
}

export const MAX_MOUSE_DISTANCE = 200;
const BASE_FORCE = 30;

const getForceValue = (distance: number) => {
    const normalizedDistance = distance / MAX_MOUSE_DISTANCE;
    const result = 1 - Math.abs(normalizedDistance);
    return result;
}

export const mouseProcessor: TPowerProcessor = (point, timeDiff) => {
    if (!mousePosition) {
        return;
    }

    const distance = getDistance(point.position, mousePosition);
    if (distance > MAX_MOUSE_DISTANCE) {
        return;
    }

    const force = getForceValue(distance) * BASE_FORCE * timeDiff / 1000;
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