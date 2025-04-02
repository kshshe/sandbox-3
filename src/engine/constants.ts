export const POINT_RADIUS = 2;

export const BORDERS = {
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight,
}

const isSmallScreen = window.innerWidth < 768;

export const INITIAL_POINTS_COUNT = isSmallScreen ? 600 : 2000;
export const MAX_POINTS_COUNT = isSmallScreen ? 1500 : 4000;