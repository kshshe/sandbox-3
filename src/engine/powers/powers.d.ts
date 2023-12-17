import { TPoint } from "../data.t";

export interface TPowerProcessorParallel {
    (points: TPoint[]): void
    isParallel: true
}

export interface TPowerProcessorSerial {
    (point: TPoint, timeDiff: number): void
    isParallel?: false | undefined
}

export type TPowerProcessor = TPowerProcessorParallel | TPowerProcessorSerial