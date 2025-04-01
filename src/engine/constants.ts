export const POINT_RADIUS = 2;

export const BORDERS = {
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight,
}

const isSmallScreen = window.innerWidth < 768;

export const INITIAL_POINTS_COUNT = isSmallScreen ? 200 : 1000;
export const MAX_POINTS_COUNT = isSmallScreen ? 2000 : 10000;
export const INITIAL_ROWS = Math.ceil(Math.sqrt(INITIAL_POINTS_COUNT));
export const INITIAL_COLUMNS = Math.ceil(INITIAL_POINTS_COUNT / INITIAL_ROWS);