import { TPowerProcessor } from "./powers";

const BASE_FORCE = 1;

export const randomnessProcessor: TPowerProcessor = (point, timeDiff) => {
    const shouldChange = Math.random() > 0.9;

    if (!shouldChange) {
        return;
    }

    const xVelocityChange = (Math.random() - 0.5) * BASE_FORCE * timeDiff / 1000;
    const yVelocityChange = (Math.random() - 0.5) * BASE_FORCE * timeDiff / 1000;

    point.velocity.x += xVelocityChange;
    point.velocity.y += yVelocityChange;
}