import { TPowerProcessorParallel } from "./powers";
import { pointsToFlatArray } from '../utils/pointsToFlatArray';

import { GPU } from '../../gpu.d'
import { initControl } from "../controls";
import { BORDERS, INITIAL_POINTS_COUNT, MAX_POINTS_COUNT } from "../constants";
import { TPoint } from "../data.t";

// @ts-ignore
const GPUClass = (window.GPU?.GPU || window.GPU);

console.log({ GPUClass })

// @ts-ignore
const gpu = new GPUClass({
    mode: 'gpu',
}) as GPU;
const getDencityAcceleration = gpu
    .createKernel(function(a: number[]) {
        function getChunkIndex(x: number, y: number, gridWidth: number, maxDistance: number) {
            const chunkX = Math.floor(x / maxDistance);
            const chunkY = Math.floor(y / maxDistance);
            return chunkX + chunkY * gridWidth;
        }

        const pointsCount = a[0];
        const maxDistance = a[1];
        const baseForce = a[2];
        const baseAntiDensityForce = a[3];
        const viscosity = a[4];
        const chunksLength = a[5];

        const pointsGlobalStartIndex = 6 + chunksLength;
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

                const distanceByX = Math.abs(x - pointPositionX);

                if (distanceByX < maxDistance) {
                    const distanceByY = Math.abs(y - pointPositionY);

                    if (distanceByY < maxDistance) {
                        const xDiff = x - pointPositionX;
                        const yDiff = y - pointPositionY;
                        let distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff)

                        if (distance <= maxDistance) {
                            closestPointsCount++;
                            let directionX = x - pointPositionX;
                            let directionY = y - pointPositionY;

                            if (distance === 0) {
                                directionX = 0.00003 * (Math.random() - 0.5);
                                directionY = 0.00003 * (Math.random() - 0.5);
                                distance = Math.sqrt(directionX * directionX + directionY * directionY);
                            }

                            const otherPointVelocityX = a[otherPointStartIndex + 2];
                            const otherPointVelocityY = a[otherPointStartIndex + 3];

                            const normalizedDirectionX = directionX / distance;
                            const normalizedDirectionY = directionY / distance;

                            const forceValue = -Math.pow(1 - Math.abs(distance / maxDistance), 3);
                            const antiForceValue = Math.pow(Math.abs(distance / maxDistance), 2)

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
    .setDynamicArguments(true)

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

    const gridWidth = Math.ceil(BORDERS.maxX / constants.maxDistance);
    const gridHeight = Math.ceil(BORDERS.maxY / constants.maxDistance);

    const chunksLength = gridWidth * gridHeight;
    const chunks: number[][] = new Array(chunksLength).fill(null).map(() => []);

    const getChunkIndex = (point: TPoint) => {
        const chunkX = Math.floor(point.position.x / constants.maxDistance);
        const chunkY = Math.floor(point.position.y / constants.maxDistance);
        return chunkX + chunkY * gridWidth;
    }

    for (const pointIndex in points) {
        const point = points[pointIndex];
        const chunkIndex = getChunkIndex(point);
        if (!chunks[chunkIndex]) {
            chunks[chunkIndex] = [];
        }

        chunks[chunkIndex].push(+pointIndex);
    }

    const flattenChunks = chunks.flat();
    const flattenChunksLength = flattenChunks.length;

    console.log({flattenChunksLength, flattenChunks})

    const kernelInput = [
        constants.pointsCount,
        constants.maxDistance,
        constants.baseForce,
        constants.baseAntiDensityForce,
        constants.viscosity,
        flattenChunksLength,
        ...flattenChunks,
        ...pointsToFlatArray(points),
    ] as number[];
    console.log({chunks, kernelInput})
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