export const POINT_RADIUS = 2;

export const BORDERS = {
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight,
}

export const INITIAL_POINTS_COUNT = 1000;
export const INITIAL_ROWS = Math.ceil(Math.sqrt(INITIAL_POINTS_COUNT));
export const INITIAL_COLUMNS = Math.ceil(INITIAL_POINTS_COUNT / INITIAL_ROWS);