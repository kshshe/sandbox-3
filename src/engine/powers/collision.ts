import { POINT_RADIUS } from "../constants";
import { findClosestPoints } from "../utils/findClosestPoints";
import { TPowerProcessor } from "./powers";

export const collisionProcessor: TPowerProcessor = (point) => {
    const collidedPoints = findClosestPoints(point, false, POINT_RADIUS);
    for (const { distance, direction } of collidedPoints) {
        const distanceToMove = POINT_RADIUS - distance;
        point.position.x -= direction.x * distanceToMove;
        point.position.y -= direction.y * distanceToMove;
        const velocityProjection = point.velocity.x * direction.x + point.velocity.y * direction.y;
        if (velocityProjection > 0) {
            point.velocity.x -= direction.x * velocityProjection;
            point.velocity.y -= direction.y * velocityProjection;
        }
    }
}