import { TPowerProcessor } from "./powers";

const GRAVITY_ACCELERATION = 9.8

export const gravityProcessor: TPowerProcessor = (point) => {
    point.acceleration.y += GRAVITY_ACCELERATION
}