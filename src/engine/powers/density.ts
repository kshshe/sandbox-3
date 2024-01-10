import { TPowerProcessorParallel } from "./powers";
import { pointsToFlatArray } from '../utils/pointsToFlatArray';

import { GPU } from '../../gpu.d'
import { initControl } from "../controls";
import { INITIAL_POINTS_COUNT, MAX_POINTS_COUNT } from "../constants";

// @ts-ignore
const GPUClass = (window.GPU?.GPU || window.GPU);

console.log({ GPUClass })

// @ts-ignore
const gpu = new GPUClass({
    mode: 'gpu',
}) as GPU;
const getDencityAcceleration = gpu
    .createKernel(function(a: number[]) {
        function getForceValue(normalizedDistance: number) {
            const result = 1 - Math.abs(normalizedDistance);
            return Math.pow(result, 3);
        }
        
        function getAntiForceValue(normalizedDistance: number) {
            return Math.pow(Math.abs(normalizedDistance), 2);
        }

        function getVectorLength(x: number, y: number) {
            return Math.sqrt(x * x + y * y);
        }

        const pointsCount = a[0];
        const maxDistance = a[1];
        const baseForce = a[2];
        const baseAntiDensityForce = a[3];
        const viscosity = a[4];

        const pointsGlobalStartIndex = 5;
        const pointIndex = this.thread.x;
        const pointStartIndex = pointIndex * 4 + pointsGlobalStartIndex;
        const pointPositionX = a[pointStartIndex];
        const pointPositionY = a[pointStartIndex + 1];
        const pointVelocityX = a[pointStartIndex + 2];
        const pointVelocityY = a[pointStartIndex + 3];

        let totalAccelerationX = 0;
        let totalAccelerationY = 0;

        let closestPointsCount = 0;
        
        let i = 0;
        while (i < pointsCount) {
            const otherPointStartIndex = 4 * i + pointsGlobalStartIndex;
            if (pointIndex !== i) {
                const x = a[otherPointStartIndex];
                const y = a[otherPointStartIndex + 1];

                const otherPointVelocityX = a[otherPointStartIndex + 2];
                const otherPointVelocityY = a[otherPointStartIndex + 3];

                let distance = getVectorLength(x - pointPositionX, y - pointPositionY)

                if (distance <= maxDistance) {
                    closestPointsCount++;
                    let directionX = x - pointPositionX;
                    let directionY = y - pointPositionY;

                    if (distance === 0) {
                        directionX = 0.00003 * (Math.random() - 0.5);
                        directionY = 0.00003 * (Math.random() - 0.5);
                        distance = Math.sqrt(directionX * directionX + directionY * directionY);
                    }

                    const normalizedDirectionX = directionX / distance;
                    const normalizedDirectionY = directionY / distance;

                    const forceValue = -getForceValue(distance / maxDistance);
                    const antiForceValue = getAntiForceValue(distance / maxDistance);

                    const xAccelerationChange = normalizedDirectionX * forceValue * baseForce;
                    const yAccelerationChange = normalizedDirectionY * forceValue * baseForce;

                    const xAntiAccelerationChange = normalizedDirectionX * antiForceValue * baseAntiDensityForce;
                    const yAntiAccelerationChange = normalizedDirectionY * antiForceValue * baseAntiDensityForce;

                    const xViscosityChange = (otherPointVelocityX - pointVelocityX) * -viscosity * forceValue;
                    const yViscosityChange = (otherPointVelocityY - pointVelocityY) * -viscosity * forceValue;

                    totalAccelerationX += xAccelerationChange + xAntiAccelerationChange + xViscosityChange;
                    totalAccelerationY += yAccelerationChange + yAntiAccelerationChange + yViscosityChange;
                }
            }

            i += 1;
        }

        return [
            totalAccelerationX,
            totalAccelerationY,
            closestPointsCount,
        ];
    })
    .setOutput([INITIAL_POINTS_COUNT])
    .setLoopMaxIterations(MAX_POINTS_COUNT + 1)
    .setDynamicOutput(true)
    .setDynamicArguments(true);

// @ts-ignore
window.getDencityAcceleration = getDencityAcceleration;

const constants = {
    pointsCount: INITIAL_POINTS_COUNT,
    maxDistance: 40,
    baseForce: 40,
    baseAntiDensityForce: 1,
    viscosity: 0.7,
}

const inputModifiers = {
    viscosity: 0.1,
}

const initRangeControl = (selector: string, constantKey: string) => {
    initControl(selector, (e) => {
        const input = e.target as HTMLInputElement;
        const modifier = inputModifiers[constantKey] || 1;
        const value = parseInt(input.value) * modifier;
        console.log(`Set ${constantKey} to ${value}`)
        constants[constantKey] = value;
    });

    const input = document.querySelector(selector) as HTMLInputElement;
    input.value = `${constants[constantKey]}`;
}

initRangeControl('input#dencity-power', 'baseForce');
initRangeControl('input#anti-dencity-power', 'baseAntiDensityForce');
initRangeControl('input#viscosity-power', 'viscosity');
initRangeControl('input#influence-radius', 'maxDistance');

export const densityProcessor: TPowerProcessorParallel = (points) => {
    const kernelOutputSize = getDencityAcceleration.output[0];
    const neededSize = points.length;
    if (kernelOutputSize != neededSize) {
        getDencityAcceleration
            .setOutput([neededSize])       

        constants.pointsCount = neededSize;
    }

    const kernelInput = [
        constants.pointsCount,
        constants.maxDistance,
        constants.baseForce,
        constants.baseAntiDensityForce,
        constants.viscosity,
        ...pointsToFlatArray(points),
    ] as number[];
    const kernelResult = getDencityAcceleration(kernelInput);

    for (const index in points) {
        const pointAcceleration = kernelResult[index] as [number, number, number];
        const point = points[index];
        point.acceleration.x += pointAcceleration[0];
        point.acceleration.y += pointAcceleration[1];
        point.temporaryData.closestPointsCount = pointAcceleration[2];
    }
}

densityProcessor.isParallel = true;