import { TPowerProcessor } from "./powers";

const BASE_FORCE = 0.3;

export const randomnessProcessor: TPowerProcessor = (point) => {
    const shouldChange = Math.random() > 0.9;

    if (!shouldChange) {
        return;
    }

    const xAccelerationChange = (Math.random() - 0.5) * BASE_FORCE;
    const yAccelerationChange = (Math.random() - 0.5) * BASE_FORCE;

    point.acceleration.x += xAccelerationChange;
    point.acceleration.y += yAccelerationChange;
}