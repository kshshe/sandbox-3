import { GPU } from 'gpu.js';

import { TPowerProcessorParallel } from "./powers";
import { MAX_DISTANCE } from "../utils/findClosestPoints";
import { TVector } from "../data.t";
import { pointsToFlatArray } from '../utils/pointsToFlatArray';

const BASE_FORCE = 40;
const BASE_ANTI_DENSITY_FORCE = 1;
const VISCOSITY = 0.5;

const gpu = new GPU();
const getDencityAcceleration = gpu
    .createKernel(function(a) {
        const pointIndex = this.thread.x;
        const pointStartIndex = pointIndex * 4;
        const pointPositionX = a[pointStartIndex];
        const pointPositionY = a[pointStartIndex + 1];
        const pointVelocityX = a[pointStartIndex + 2];
        const pointVelocityY = a[pointStartIndex + 3];

        let x = Math.random() - 0.5;
        let y = Math.random() - 0.5;

        return [x, y];
    })
    .setOutput([1000])
    .setDynamicOutput(true)
    .setDynamicArguments(true);

const getForceValue = (distance: number) => {
    const normalizedDistance = distance / MAX_DISTANCE;
    const result = 1 - Math.abs(normalizedDistance);
    return Math.pow(result, 3);
}

const getAntiForceValue = (distance: number) => {
    const normalizedDistance = distance / MAX_DISTANCE;
    return Math.pow(Math.abs(normalizedDistance), 2);
}

export const densityProcessor: TPowerProcessorParallel = (points) => {
    const kernelOutputSize = getDencityAcceleration.output[0];
    const neededSize = points.length;
    if (kernelOutputSize != neededSize) {
        getDencityAcceleration.setOutput([neededSize]);
    }

    const kernelResult = getDencityAcceleration(pointsToFlatArray(points));

    for (const index in points) {
        const pointAcceleration = kernelResult[index] as [number, number];
        const point = points[index];
        point.acceleration.x += pointAcceleration[0];
        point.acceleration.y += pointAcceleration[1];
    }
}

densityProcessor.isParallel = true;