import { TPowerProcessorParallel } from "./powers";
import { pointsToFlatArray } from '../utils/pointsToFlatArray';

import { GPU } from '../../gpu.d'

// @ts-ignore
const GPUClass = (window.GPU?.GPU || window.GPU);

console.log({ GPUClass })

// @ts-ignore
const gpu = new GPUClass() as GPU;
const getDencityAcceleration = gpu
    .createKernel(function(a: number[]) {
        function getForceValue(distance: number) {
            const MAX_DISTANCE = 150;
            const normalizedDistance = distance / MAX_DISTANCE;
            const result = 1 - Math.abs(normalizedDistance);
            return Math.pow(result, 3);
        }
        
        function getAntiForceValue(distance: number) {
            const MAX_DISTANCE = 150;
            const normalizedDistance = distance / MAX_DISTANCE;
            return Math.pow(Math.abs(normalizedDistance), 2);
        }

        function getVectorLength(x: number, y: number) {
            return Math.sqrt(x * x + y * y);
        }

        const MAX_DISTANCE = 40;
        const BASE_FORCE = 15;
        const BASE_ANTI_DENSITY_FORCE = 1;
        const VISCOSITY = 0.5;

        const pointIndex = this.thread.x;
        const pointStartIndex = pointIndex * 4;
        const pointPositionX = a[pointStartIndex];
        const pointPositionY = a[pointStartIndex + 1];
        const pointVelocityX = a[pointStartIndex + 2];
        const pointVelocityY = a[pointStartIndex + 3];

        let totalAccelerationX = 0;
        let totalAccelerationY = 0;

        let closestPointsCount = 0;

        const pointsMaxIndex = (this.constants.pointsCount as number) * 4;
        for (let i = 0; i < pointsMaxIndex; i += 4) {
            const x = a[i];
            const y = a[i + 1];

            const otherPointVelocityX = a[i + 2];
            const otherPointVelocityY = a[i + 3];

            let distance = getVectorLength(x - pointPositionX, y - pointPositionY)

            if (distance <= MAX_DISTANCE) {
                closestPointsCount++;
                let directionX = x - pointPositionX;
                let directionY = y - pointPositionY;

                if (distance === 0) {
                    directionX = 3 * (Math.random() - 0.5);
                    directionY = 3 * (Math.random() - 0.5);
                    distance = 1;
                }

                const normalizedDirectionX = directionX / distance;
                const normalizedDirectionY = directionY / distance;

                const forceValue = -getForceValue(distance);
                const antiForceValue = getAntiForceValue(distance);

                const xAccelerationChange = normalizedDirectionX * forceValue * BASE_FORCE;
                const yAccelerationChange = normalizedDirectionY * forceValue * BASE_FORCE;

                const xAntiAccelerationChange = normalizedDirectionX * antiForceValue * BASE_ANTI_DENSITY_FORCE;
                const yAntiAccelerationChange = normalizedDirectionY * antiForceValue * BASE_ANTI_DENSITY_FORCE;

                const xViscosityChange = (otherPointVelocityX - pointVelocityX) * -VISCOSITY * forceValue;
                const yViscosityChange = (otherPointVelocityY - pointVelocityY) * -VISCOSITY * forceValue;

                totalAccelerationX += xAccelerationChange + xAntiAccelerationChange + xViscosityChange;
                totalAccelerationY += yAccelerationChange + yAntiAccelerationChange + yViscosityChange;
            }
        }

        return [
            totalAccelerationX,
            totalAccelerationY,
            closestPointsCount,
        ];
    })
    .setOutput([1000])
    .setDynamicOutput(true)
    .setDynamicArguments(true)
    .setConstants({
        pointsCount: 1000,
    })
    .setConstantTypes({
        pointsCount: 'Integer',
    })

export const densityProcessor: TPowerProcessorParallel = (points) => {
    const kernelOutputSize = getDencityAcceleration.output[0];
    const neededSize = points.length;
    if (kernelOutputSize != neededSize) {
        getDencityAcceleration
            .setOutput([neededSize])
            .setConstants({
                pointsCount: neededSize,
            });
    }

    const kernelResult = getDencityAcceleration(pointsToFlatArray(points));

    for (const index in points) {
        const pointAcceleration = kernelResult[index] as [number, number, number];
        const point = points[index];
        point.acceleration.x += pointAcceleration[0];
        point.acceleration.y += pointAcceleration[1];
        point.temporaryData.closestPointsCount = pointAcceleration[2];
    }
}

densityProcessor.isParallel = true;