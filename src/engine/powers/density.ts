import { TPowerProcessor } from "./powers";
import { findClosestPoints, MAX_DISTANCE } from "../utils/findClosestPoints";
import { TVector } from "../data.t";

const BASE_FORCE = 60;
const BASE_ANTI_DENSITY_FORCE = 3;

const getForceValue = (distance: number) => {
    const normalizedDistance = distance / MAX_DISTANCE;
    const result = 1 - Math.abs(normalizedDistance);
    return Math.pow(result, 3);
}

const getAntiForceValue = (distance: number) => {
    const normalizedDistance = distance / MAX_DISTANCE;
    return Math.pow(Math.abs(normalizedDistance), 2);
}

export const densityProcessor: TPowerProcessor = (point, timeDiff) => {
    const closestPoints = findClosestPoints(point);
    const pointsCount = closestPoints.length;

    if (pointsCount === 0) {
        return;
    }

    const totalForce: TVector = {
        x: 0,
        y: 0,
    }

    for (const closestPoint of closestPoints) {
        const { distance, direction, point: otherPoint } = closestPoint;
        if (distance === 0) {
            debugger
            continue;
        }
        const forceValue = -getForceValue(distance);
        const antiForceValue = getAntiForceValue(distance);

        const xVelocityChange = (direction.x * forceValue * BASE_FORCE * timeDiff / 1000);
        const yVelocityChange = (direction.y * forceValue * BASE_FORCE * timeDiff / 1000);

        const xAntiVelocityChange = (direction.x * antiForceValue * BASE_ANTI_DENSITY_FORCE * timeDiff / 1000);
        const yAntiVelocityChange = (direction.y * antiForceValue * BASE_ANTI_DENSITY_FORCE * timeDiff / 1000);

        totalForce.x += xVelocityChange + xAntiVelocityChange;
        totalForce.y += yVelocityChange + yAntiVelocityChange;

        otherPoint.velocity.x -= xVelocityChange + xAntiVelocityChange;
        otherPoint.velocity.y -= yVelocityChange + yAntiVelocityChange;
    }

    point.velocity.x += totalForce.x;
    point.velocity.y += totalForce.y;
}