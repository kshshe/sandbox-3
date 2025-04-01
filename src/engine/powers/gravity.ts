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
let isMotion = false

initControl('select#gravityDirection', async (e) => {
    isCentered = (e.target as HTMLInputElement)?.value === 'center'
    isLeft = (e.target as HTMLInputElement)?.value === 'left'
    isRight = (e.target as HTMLInputElement)?.value === 'right'
    isTop = (e.target as HTMLInputElement)?.value === 'top'
    isMotion = (e.target as HTMLInputElement)?.value === 'motion'

    console.log({
        isCentered,
        isLeft,
        isRight,
        isTop,
        isMotion
    })
})

const currentMotionSensor = {
    x: 0,
    y: GRAVITY_ACCELERATION
}

let currentAcceleration: TVector = {
    x: 0,
    y: GRAVITY_ACCELERATION
}

initControl('input#gravityPower', (e) => {
    GRAVITY_ACCELERATION = +(((e.target as HTMLInputElement)?.value) ?? 98) / 10
    currentAcceleration.y = GRAVITY_ACCELERATION
})

function handleMotion(event) {
    currentMotionSensor.x = +event.accelerationIncludingGravity.x || 0;
    currentMotionSensor.y = -event.accelerationIncludingGravity.y || 0;
    console.log(currentMotionSensor)
}

const getAccelerometerDirection = (): TVector => {
    return currentAcceleration
}

const gravityInput = document.querySelector('select#gravityDirection') as HTMLInputElement;
if (gravityInput) {
    try {
        gravityInput.addEventListener('click', () => {
            console.log(gravityInput.value)
            if (
                DeviceMotionEvent &&
                // @ts-ignore
                typeof DeviceMotionEvent.requestPermission === "function" &&
                isSecureContext
            ) {
                const newOption = document.createElement('option');
                newOption.value = 'motion';
                newOption.textContent = 'Accelerometer';
                gravityInput.appendChild(newOption);

                console.log(gravityInput.value)
                try {
                    // @ts-ignore
                    await DeviceMotionEvent.requestPermission();
                    console.log('Motion permission granted')
                } catch (e) {
                    console.log(e.message || e.toString())
                }

                window.addEventListener("devicemotion", handleMotion, true);
            }
        })
    } catch (e) {
        console.log(e.message || e.toString())
    }
}

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
    if (isMotion) {
        point.acceleration.x += currentMotionSensor.x
        point.acceleration.y += currentMotionSensor.y
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