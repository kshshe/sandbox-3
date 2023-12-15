import { TPowerProcessor } from "./powers";
import { findClosestPoints, MAX_DISTANCE } from "../utils/findClosestPoints";
import { TVector } from "../data.t";

const BASE_FORCE = 40;
const BASE_ANTI_DENSITY_FORCE = BASE_FORCE / 20;
const VISCOSITY = 0.01;

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

        const xViscosityChange = (otherPoint.velocity.x - point.velocity.x) * VISCOSITY * timeDiff / 1000;
        const yViscosityChange = (otherPoint.velocity.y - point.velocity.y) * VISCOSITY * timeDiff / 1000;

        totalForce.x += xVelocityChange + xAntiVelocityChange + xViscosityChange;
        totalForce.y += yVelocityChange + yAntiVelocityChange + yViscosityChange;

        otherPoint.velocity.x -= xVelocityChange + xAntiVelocityChange + xViscosityChange;
        otherPoint.velocity.y -= yVelocityChange + yAntiVelocityChange + yViscosityChange;
    }

    point.velocity.x += totalForce.x;
    point.velocity.y += totalForce.y;
}