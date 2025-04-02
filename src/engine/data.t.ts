export type TVector = {
    x: number,
    y: number
}

export type TPoint = {
    isStatic?: boolean,
    position: TVector,
    velocity: TVector,
    acceleration: TVector,
    temporaryData: Record<string, any>,
}