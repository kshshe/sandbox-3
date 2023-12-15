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