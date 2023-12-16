import { TVector } from "../data.t";
import { TPowerProcessor } from "./powers";

const GRAVITY_ACCELERATION = 9.8

let currentAcceleration: TVector = {
    x: 0,
    y: GRAVITY_ACCELERATION
}

function handleMotion(event) {
    console.log({
        x: event.accelerationIncludingGravity.x,
        y: event.accelerationIncludingGravity.y,
        z: event.accelerationIncludingGravity.z
    })
    currentAcceleration.x = +event.accelerationIncludingGravity.x || 0;
    currentAcceleration.y = +event.accelerationIncludingGravity.y || GRAVITY_ACCELERATION;
}

const getAccelerometerDirection = (): TVector => {
    return currentAcceleration
}

window.document.body.addEventListener('touchstart', () => {
    if (
        DeviceMotionEvent &&
        // @ts-ignore
        typeof DeviceMotionEvent.requestPermission === "function"
    ) {
        console.log("requesting permission")
        try {
            // @ts-ignore
            DeviceMotionEvent.requestPermission();
        } catch (e) {
            console.log(e.message || e.toString())
        }
    } else {
        console.log("no permission function")
    }
})

window.addEventListener("devicemotion", handleMotion);

export const gravityProcessor: TPowerProcessor = (point) => {
    const { x, y } = getAccelerometerDirection()
    point.acceleration.y += y
    point.acceleration.x += x
}