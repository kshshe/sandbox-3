import { TVector } from "../data.t";

export const sumVectors = (vectorA: TVector, vectorB: TVector): TVector => ({
    x: vectorA.x + vectorB.x,
    y: vectorA.y + vectorB.y,
});

export const multiplyVector = (vector: TVector, scalar: number): TVector => ({
    x: vector.x * scalar,
    y: vector.y * scalar,
});

export const getVectorLength = (vector: TVector): number => {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2);
}

export const getDistance = (vectorA: TVector, vectorB: TVector): number => {
    const diffVector = sumVectors(vectorA, multiplyVector(vectorB, -1));
    return getVectorLength(diffVector);
}

export const getMaxDistance = (vectorA: TVector, vectorB: TVector): number => {
    return Math.max(Math.abs(vectorA.x - vectorB.x), Math.abs(vectorA.y - vectorB.y));
}