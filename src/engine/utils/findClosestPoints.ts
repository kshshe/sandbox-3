import { BORDERS } from "../constants";
import { TPoint, TVector } from "../data.t";
import { points } from "../runner";
import { getDistance, getMaxDistance, getVectorLength } from "./vector";

export const MAX_DISTANCE = 15;

export const findClosestPoints = (point: TPoint, includeBorders = false, maxDistance = MAX_DISTANCE): Array<{
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

        const maxPossibleDistance = getMaxDistance(point.position, otherPoint.position)
        if (maxPossibleDistance >= maxDistance) {
            continue;
        }

        const distance = getDistance(point.position, otherPoint.position);

        if (distance < maxDistance) {
            const direction = {
                x: otherPoint.position.x - point.position.x,
                y: otherPoint.position.y - point.position.y,
            };
    
            const directionLength = getVectorLength(direction);
            direction.x /= directionLength;
            direction.y /= directionLength;
    
            closestPoints.push({
                point: otherPoint,
                distance,
                direction,
            });
        }
    }

    if (includeBorders) {
        if (point.position.x - BORDERS.minX <= maxDistance) {
            closestPoints.push({
                point: {
                    position: {
                        x: BORDERS.minX,
                        y: point.position.y,
                    },
                    velocity: {
                        x: 0,
                        y: 0,
                    },
                    acceleration: {
                        x: 0,
                        y: 0,
                    },
                    temporaryData: {},
                },
                distance: point.position.x - BORDERS.minX,
                direction: {
                    x: -1,
                    y: 0,
                },
            });
        }

        if (BORDERS.maxX - point.position.x <= maxDistance) {
            closestPoints.push({
                point: {
                    position: {
                        x: BORDERS.maxX,
                        y: point.position.y,
                    },
                    velocity: {
                        x: 0,
                        y: 0,
                    },
                    acceleration: {
                        x: 0,
                        y: 0,
                    },
                    temporaryData: {},
                },
                distance: BORDERS.maxX - point.position.x,
                direction: {
                    x: 1,
                    y: 0,
                },
            });
        }

        if (point.position.y - BORDERS.minY <= maxDistance) {
            closestPoints.push({
                point: {
                    position: {
                        x: point.position.x,
                        y: BORDERS.minY,
                    },
                    velocity: {
                        x: 0,
                        y: 0,
                    },
                    acceleration: {
                        x: 0,
                        y: 0,
                    },
                    temporaryData: {},
                },
                distance: point.position.y - BORDERS.minY,
                direction: {
                    x: 0,
                    y: -1,
                },
            });
        }

        if (BORDERS.maxY - point.position.y <= maxDistance) {
            closestPoints.push({
                point: {
                    position: {
                        x: point.position.x,
                        y: BORDERS.maxY,
                    },
                    velocity: {
                        x: 0,
                        y: 0,
                    },
                    acceleration: {
                        x: 0,
                        y: 0,
                    },
                    temporaryData: {},
                },
                distance: BORDERS.maxY - point.position.y,
                direction: {
                    x: 0,
                    y: 1,
                },
            });
        }
    }

    point.temporaryData.closestPoints = closestPoints;
    point.temporaryData.closestPointsCount = closestPoints.length;

    return closestPoints;
}