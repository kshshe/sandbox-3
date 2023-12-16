import { TVector } from "../data.t";
import { TPowerProcessor } from "./powers";

const GRAVITY_ACCELERATION = 9.8

let currentAcceleration: TVector = {
    x: 0,
    y: GRAVITY_ACCELERATION
}

function handleMotion(event) {
    currentAcceleration.x = event.accelerationIncludingGravity.x || 0;
    currentAcceleration.y = event.accelerationIncludingGravity.y || GRAVITY_ACCELERATION;
}

const getAccelerometerDirection = (): TVector => {
    return currentAcceleration
}


// Request permission for iOS 13+ devices
if (
    DeviceMotionEvent &&
    // @ts-ignore
    typeof DeviceMotionEvent.requestPermission === "function"
) {
    // @ts-ignore
    DeviceMotionEvent.requestPermission();
}

window.addEventListener("devicemotion", handleMotion);

export const gravityProcessor: TPowerProcessor = (point) => {
    const { x, y } = getAccelerometerDirection()
    point.acceleration.y += y
    point.acceleration.x += x
}