import { TPowerProcessor } from "./powers";

const GRAVITY_ACCELERATION = 0;//9.8;

export const gravityProcessor: TPowerProcessor = (point, timeDiff) => {
    point.velocity.y += GRAVITY_ACCELERATION * timeDiff / 1000;
}