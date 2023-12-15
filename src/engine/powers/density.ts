import { TPowerProcessor } from "./powers";
import { findClosestPoints, MAX_DISTANCE } from "../utils/findClosestPoints";

const BASE_FORCE = 0.01;

const getForceValue = (distance: number) => {
    if (distance === 0) {
        return 0;
    }
    const normalizedDistance = distance / MAX_DISTANCE;
    const result = 1 - Math.pow(normalizedDistance, 2);
    return result;
}

export const densityProcessor: TPowerProcessor = (point, timeDiff) => {
    const closestPoints = findClosestPoints(point);

    for (const closestPoint of closestPoints) {
        const { distance, direction, point: otherPoint } = closestPoint;
        const forceValue = getForceValue(distance);

        const xVelocityChange = (direction.x * forceValue * BASE_FORCE * timeDiff / 1000) / 2;
        const yVelocityChange = (direction.y * forceValue * BASE_FORCE * timeDiff / 1000) / 2;

        point.velocity.x -= xVelocityChange;
        point.velocity.y -= yVelocityChange;
    }
}