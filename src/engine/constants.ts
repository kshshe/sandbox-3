export const POINT_RADIUS = 2;

export const BORDERS = {
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight,
}

const isSmallScreen = window.innerWidth < 768;

export const INITIAL_POINTS_COUNT = isSmallScreen ? 800 : 2600;
export const MAX_POINTS_COUNT = isSmallScreen ? 1500 : 4000;

export const MAX_ACCELERATION = 400;
export const MAX_SPEED = 100;

export const MAX_FRAME_TIME = 1000 / 60;