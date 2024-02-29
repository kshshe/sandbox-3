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
// const gpu = new GPUClass({
//     mode: 'cpu',
// }) as GPU;
const getDencityAcceleration = function(config: number[], chunksAndChunksStartingIndicesAndLengths: number[], points: number[]) {
        // const pointsCount = config[0];
        const maxDistance = config[1];
        const baseForce = config[2];
        const baseAntiDensityForce = config[3];
        const viscosity = config[4];
        // const chunksLength = config[5];
        const chunksStartingIndicesAndLengthsLength = config[6];
        const gridWidth = config[7]
        const gridHeight = config[8];

        const pointIndex = this.thread.x;
        const pointStartIndex = pointIndex * 4;
        const pointPositionX = points[pointStartIndex];
        const pointPositionY = points[pointStartIndex + 1];
        const pointVelocityX = points[pointStartIndex + 2];
        const pointVelocityY = points[pointStartIndex + 3];

        const chunkX = Math.floor(pointPositionX / maxDistance);
        const chunkY = Math.floor(pointPositionY / maxDistance);
        
        let totalAccelerationX = 0;
        let totalAccelerationY = 0;

        let closestPointsCount = 0;

        for (let xChunkDiff = -1; xChunkDiff <= 1; xChunkDiff++) {
            for (let yChunkDiff = -1; yChunkDiff <= 1; yChunkDiff++) {
                const neighborChunkX = chunkX + xChunkDiff;
                const neighborChunkY = chunkY + yChunkDiff;

                if (neighborChunkX >= 0 && neighborChunkX < gridWidth) {
                    if (neighborChunkY >= 0 && neighborChunkY < gridHeight) {
                        const targetChunkIndex = neighborChunkX + neighborChunkY * gridWidth;

                        const targetChunkStartingIndex = chunksAndChunksStartingIndicesAndLengths[targetChunkIndex * 2];
                        const targetChunkLength = chunksAndChunksStartingIndicesAndLengths[targetChunkIndex * 2 + 1];
    
                        for (let cellIndex = targetChunkStartingIndex; cellIndex < targetChunkStartingIndex + targetChunkLength; cellIndex++) {
                            const otherPointStartIndex = chunksAndChunksStartingIndicesAndLengths[chunksStartingIndicesAndLengthsLength + cellIndex] * 4;
    
                            const x = points[otherPointStartIndex];
                            const y = points[otherPointStartIndex + 1];

                            if (otherPointStartIndex !== pointStartIndex) {
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
                                
                                    const otherPointVelocityX = points[otherPointStartIndex + 2];
                                    const otherPointVelocityY = points[otherPointStartIndex + 3];
    
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
                }
            }
        }

        return [
            totalAccelerationX,
            totalAccelerationY,
            closestPointsCount,
        ];
    }//)
    // // @ts-ignore
    // .setArgumentTypes([
    //     'Array', // config
    //     'Array', // chunks and chunksStartingIndicesAndLengths
    //     'Array', // points
    // ])
    // .setOutput([INITIAL_POINTS_COUNT])
    // .setLoopMaxIterations(MAX_POINTS_COUNT + 1)
    // .setDynamicOutput(true)
    // .setDynamicArguments(true)

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
    const input = document.querySelector(selector) as HTMLInputElement;
    if (!input) {
        return
    }

    initControl(selector, (e) => {
        const input = e.target as HTMLInputElement;
        const modifier = inputModifiers[constantKey] || 1;
        const value = parseInt(input.value) * modifier;
        console.log(`Set ${constantKey} to ${value}`)
        constants[constantKey] = value;
    });
    input.value = `${constants[constantKey]}`;
}

initRangeControl('input#dencity-power', 'baseForce');
initRangeControl('input#anti-dencity-power', 'baseAntiDensityForce');
initRangeControl('input#viscosity-power', 'viscosity');
initRangeControl('input#influence-radius', 'maxDistance');

export const densityProcessor: TPowerProcessorParallel = (points) => {
    // const kernelOutputSize = getDencityAcceleration.output[0];
    // const neededSize = points.length;
    // if (kernelOutputSize != neededSize) {
    //     getDencityAcceleration
    //         .setOutput([neededSize])       

    //     constants.pointsCount = neededSize;
    // }

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

    const chunksStartingIndicesAndLengths: number[] = [];
    const flattenChunks = chunks.flatMap((chunk) => {
        const lastChunkIndex = chunksStartingIndicesAndLengths?.[chunksStartingIndicesAndLengths.length - 2] || 0;
        const lastChunkLength = chunksStartingIndicesAndLengths?.[chunksStartingIndicesAndLengths.length - 1] || 0;
        const currentChunkStartingIndex = lastChunkIndex + lastChunkLength;
        chunksStartingIndicesAndLengths.push(currentChunkStartingIndex, chunk.length);
        return chunk;
    });
    const flattenChunksLength = flattenChunks.length;
    const chunksStartingIndicesAndLengthsLength = chunksStartingIndicesAndLengths.length;

    const kernelInput = [
        [
            constants.pointsCount,
            constants.maxDistance,
            constants.baseForce,
            constants.baseAntiDensityForce,
            constants.viscosity,
            flattenChunksLength,
            chunksStartingIndicesAndLengthsLength,
            gridWidth,
            gridHeight,
        ],
        [
            ...chunksStartingIndicesAndLengths,
            ...flattenChunks,
        ],
        pointsToFlatArray(points),
    ] as number[][];

    // const kernelResult = getDencityAcceleration(kernelInput[0], kernelInput[1], kernelInput[2]) as [number, number, number][];

    const kernelResult = points.map((point, pointIndex) => {
        const resultForThePoint = getDencityAcceleration.call({
            thread: {
                x: pointIndex,
            }
        }, kernelInput[0], kernelInput[1], kernelInput[2]) as [number, number, number];

        return resultForThePoint;
    })

    for (const index in points) {
        const pointAcceleration = kernelResult[index] as [number, number, number];
        const point = points[index];
        point.acceleration.x += pointAcceleration[0];
        point.acceleration.y += pointAcceleration[1];
        point.temporaryData.closestPointsCount = pointAcceleration[2];
    }
}

densityProcessor.isParallel = true;