import { BORDERS } from "../constants";
import { initControl } from "../controls";
import { TVector } from "../data.t";
import { getVectorLength, multiplyVector } from "../utils/vector";
import { TPowerProcessor } from "./powers";

let GRAVITY_ACCELERATION = 9.8
let isCentered = false
let isLeft = false
let isRight = false
let isTop = false

initControl('select#gravityDirection', (e) => {
    isCentered = (e.target as HTMLInputElement)?.value === 'center'
    isLeft = (e.target as HTMLInputElement)?.value === 'left'
    isRight = (e.target as HTMLInputElement)?.value === 'right'
    isTop = (e.target as HTMLInputElement)?.value === 'top'

    console.log({
        isCentered,
        isLeft,
        isRight,
        isTop
    })
})

let currentAcceleration: TVector = {
    x: 0,
    y: GRAVITY_ACCELERATION
}

initControl('input#gravityPower', (e) => {
    GRAVITY_ACCELERATION = +(((e.target as HTMLInputElement)?.value) ?? 98) / 10
    currentAcceleration.y = GRAVITY_ACCELERATION
})

function handleMotion(event) {
    currentAcceleration.x = +event.accelerationIncludingGravity.x || 0;
    currentAcceleration.y = -event.accelerationIncludingGravity.y || GRAVITY_ACCELERATION;
}

const getAccelerometerDirection = (): TVector => {
    return currentAcceleration
}

document.querySelector('input#gravityDirection')?.addEventListener('click', async () => {
    if (
        DeviceMotionEvent &&
        // @ts-ignore
        typeof DeviceMotionEvent.requestPermission === "function"
    ) {
        try {
            // @ts-ignore
            await DeviceMotionEvent.requestPermission();
            document.querySelector('.gravityPowerLabel')?.remove()
        } catch (e) {
            console.log(e.message || e.toString())
        }
    }
})

window.addEventListener("devicemotion", handleMotion, true);

const CENTER_OF_THE_SCREEN: TVector = {
    x: BORDERS.maxX / 2,
    y: BORDERS.maxY / 2
}

export const gravityProcessor: TPowerProcessor = (point) => {
    if (isCentered) {
        const directionToTheCenter: TVector = {
            x: CENTER_OF_THE_SCREEN.x - point.position.x,
            y: CENTER_OF_THE_SCREEN.y - point.position.y,
        }

        const directionToTheCenterLength = getVectorLength(directionToTheCenter)

        const directionToTheCenterNormalized = multiplyVector(directionToTheCenter, 1 / directionToTheCenterLength)

        const gravityForce = multiplyVector(directionToTheCenterNormalized, GRAVITY_ACCELERATION)

        point.acceleration.x += gravityForce.x
        point.acceleration.y += gravityForce.y
        return
    }

    const { x, y } = getAccelerometerDirection()

    if (isLeft) {
        point.acceleration.x -= GRAVITY_ACCELERATION
        return
    }

    if (isRight) {
        point.acceleration.x += GRAVITY_ACCELERATION
        return
    }

    if (isTop) {
        point.acceleration.y -= GRAVITY_ACCELERATION
        return
    }

    point.acceleration.y += y
    point.acceleration.x += x
}