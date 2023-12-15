import { TPoint, TVector } from "../data.t";
import { points } from "../runner";
import { getDistance, getVectorLength } from "./vector";

export const MAX_DISTANCE = 150;

export const findClosestPoints = (point: TPoint): Array<{
    point: TPoint,
    distance: number,
    direction: TVector,
}> => {
    const closestPoints: Array<{
        point: TPoint,
        distance: number,
        direction: TVector,
    }> = [];

    for (const otherPoint of points) {
        if (otherPoint === point) {
            continue;
        }

        const distance = getDistance(point.position, otherPoint.position);
        const direction = {
            x: otherPoint.position.x - point.position.x,
            y: otherPoint.position.y - point.position.y,
        };

        const directionLength = getVectorLength(direction);
        direction.x /= directionLength;
        direction.y /= directionLength;

        if (distance < MAX_DISTANCE) {
            closestPoints.push({
                point: otherPoint,
                distance,
                direction,
            });
        }
    }

    return closestPoints;
}