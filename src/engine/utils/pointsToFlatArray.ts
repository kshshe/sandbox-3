import { TPoint } from "../data.t";

const pointToFlatArray = (point: TPoint) => [
    point.position.x,
    point.position.y,
    point.velocity.x,
    point.velocity.y,
]

export const pointsToFlatArray = (points: TPoint[]): number[] => {
    const result: number[] = [];

    for (const point of points) {
        result.push(...pointToFlatArray(point));
    }

    return result;
}