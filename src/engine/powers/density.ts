import { TPowerProcessor } from "./powers";
import { findClosestPoints, MAX_DISTANCE } from "../utils/findClosestPoints";
import { TVector } from "../data.t";

const BASE_FORCE = 40;
const BASE_ANTI_DENSITY_FORCE = BASE_FORCE / 40;
const VISCOSITY = 0.05;

const getForceValue = (distance: number) => {
    const normalizedDistance = distance / MAX_DISTANCE;
    const result = 1 - Math.abs(normalizedDistance);
    return Math.pow(result, 3);
}

const getAntiForceValue = (distance: number) => {
    const normalizedDistance = distance / MAX_DISTANCE;
    return Math.pow(Math.abs(normalizedDistance), 2);
}

export const densityProcessor: TPowerProcessor = (point) => {
    const closestPoints = findClosestPoints(point, true);
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

        const forceValue = -getForceValue(distance);
        const antiForceValue = getAntiForceValue(distance);
        
        if (distance === 0) {
            direction.x = Math.random() - 0.5;
            direction.y = Math.random() - 0.5;
        }

        const xAccelerationChange = (direction.x * forceValue * BASE_FORCE);
        const yAccelerationChange = (direction.y * forceValue * BASE_FORCE);

        const xAntiAccelerationChange = (direction.x * antiForceValue * BASE_ANTI_DENSITY_FORCE);
        const yAntiAccelerationChange = (direction.y * antiForceValue * BASE_ANTI_DENSITY_FORCE);

        const xViscosityChange = (otherPoint.velocity.x - point.velocity.x) * VISCOSITY;
        const yViscosityChange = (otherPoint.velocity.y - point.velocity.y) * VISCOSITY;

        totalForce.x += xAccelerationChange + xAntiAccelerationChange + xViscosityChange;
        totalForce.y += yAccelerationChange + yAntiAccelerationChange + yViscosityChange;

        otherPoint.acceleration.x -= xAccelerationChange + xAntiAccelerationChange + xViscosityChange;
        otherPoint.acceleration.y -= yAccelerationChange + yAntiAccelerationChange + yViscosityChange;
    }

    point.acceleration.x += totalForce.x;
    point.acceleration.y += totalForce.y;
}