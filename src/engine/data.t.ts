export type TVector = {
    x: number,
    y: number
}

export type TPoint = {
    position: TVector,
    velocity: TVector,
    temporaryData: Record<string, any>,
}