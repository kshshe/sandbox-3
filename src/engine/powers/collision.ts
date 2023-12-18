import { TPowerProcessorParallel } from "./powers";
import { pointsToFlatArray } from '../utils/pointsToFlatArray';

import { GPU } from '../../gpu.d'
import { initControl } from "../controls";

// @ts-ignore
const GPUClass = (window.GPU?.GPU || window.GPU);

console.log({ GPUClass })

// @ts-ignore
const gpu = new GPUClass() as GPU;
const getCollisionAcceleration = gpu
    .createKernel(function(a: number[]) {
        function getVectorLength(x: number, y: number) {
            return Math.sqrt(x * x + y * y);
        }

        const pointsCount = a[0];
        const maxDistance = 6;
        const COLLISION_SAVES = 0.3;

        const pointsGlobalStartIndex = 1;
        const pointIndex = this.thread.x;
        const pointStartIndex = pointIndex * 4 + pointsGlobalStartIndex;
        const pointPositionX = a[pointStartIndex];
        const pointPositionY = a[pointStartIndex + 1];
        const pointVelocityX = a[pointStartIndex + 2];
        const pointVelocityY = a[pointStartIndex + 3];

        let totalVelocityX = 0;
        let totalVelocityY = 0;
        let totalPositionChangeX = 0;
        let totalPositionChangeY = 0;

        for (let i = 0; i < pointsCount; i += 1) {
            const otherPointStartIndex = 4 * i + pointsGlobalStartIndex;
            if (pointIndex !== i) {
                const x = a[otherPointStartIndex];
                const y = a[otherPointStartIndex + 1];

                const oPointLeftSide = x - maxDistance;
                const oPointRightSide = x + maxDistance;
                const oPointTopSide = y - maxDistance;
                const oPointBottomSide = y + maxDistance;

                const currentX = (pointPositionX + totalPositionChangeX)
                const currentY = (pointPositionY + totalPositionChangeY)

                const isInXRange = currentX >= oPointLeftSide && currentX <= oPointRightSide;
                const isInYRange = currentY >= oPointTopSide && currentY <= oPointBottomSide;

                const isInRange = isInXRange && isInYRange;

                if (isInRange) {
                    // reflect velocity
                    const velocityX = pointVelocityX + totalVelocityX;
                    const velocityY = pointVelocityY + totalVelocityY;
                    const velocityLength = getVectorLength(velocityX, velocityY);
                    const velocityXNormalized = velocityX / velocityLength;
                    const velocityYNormalized = velocityY / velocityLength;
                    const velocityXNormalizedInverted = velocityXNormalized * -1;
                    const velocityYNormalizedInverted = velocityYNormalized * -1;

                    const velocityXNormalizedInvertedWithSave = velocityXNormalizedInverted * COLLISION_SAVES;
                    const velocityYNormalizedInvertedWithSave = velocityYNormalizedInverted * COLLISION_SAVES;

                    totalVelocityX += velocityXNormalizedInvertedWithSave;
                    totalVelocityY += velocityYNormalizedInvertedWithSave;
                }
            }
        }

        return [
            totalVelocityX,
            totalVelocityY,
            totalPositionChangeX,
            totalPositionChangeY,
        ];
    })
    .setOutput([1000])
    .setDynamicOutput(true)
    .setDynamicArguments(true);

// @ts-ignore
window.getDencityAcceleration = getDencityAcceleration;

const constants = {
    pointsCount: 1000,
}

export const collisionProcessor: TPowerProcessorParallel = (points) => {
    const kernelOutputSize = getCollisionAcceleration.output[0];
    const neededSize = points.length;
    if (kernelOutputSize != neededSize) {
        getCollisionAcceleration
            .setOutput([neededSize])

        constants.pointsCount = neededSize;
    }

    const kernelResult = getCollisionAcceleration([
        constants.pointsCount,
        ...pointsToFlatArray(points),
    ] as number[]);

    for (const index in points) {
        const pointAcceleration = kernelResult[index] as [number, number, number, number];
        const point = points[index];
        point.velocity.x += pointAcceleration[0];
        point.velocity.y += pointAcceleration[1];
        point.position.x += pointAcceleration[2];
        point.position.y += pointAcceleration[3];
    }
}

collisionProcessor.isParallel = true;