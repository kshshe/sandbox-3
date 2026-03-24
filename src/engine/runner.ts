import { BORDERS, INITIAL_POINTS_COUNT, MAX_ACCELERATION, MAX_FRAME_TIME, MAX_POINTS_COUNT, MAX_SPEED, POINT_RADIUS } from "./constants";
import { initControl } from "./controls";
import { TPoint } from "./data.t";
import { powers } from "./powers";
import { getVectorLength, multiplyVector } from "./utils/vector";
import { FPS } from 'yy-fps'
const fps = new FPS({
    FPS: 1000,
    meter: false,
    text: ' processings per second',
})
let paused: boolean = false;
let speedMultiplier = 7;

export let points: TPoint[] = [];
const getNonStaticPointsCount = () => points.filter(point => !point.isStatic).length;

declare global {
    interface Window {
        getAverageSpeed: () => number;
        points: TPoint[];
    }
}

window.points = points;
window.getAverageSpeed = () => {
    let sum = 0;
    const nonStaticPoints = points.filter(point => !point.isStatic);
    for (const point of nonStaticPoints) {
        sum += getVectorLength(point.velocity);
    }
    return sum / points.length;
}

const REFLECTION = 0.45;
const SPAWN_HALF_SIZE = 100;
const SPAWN_BOTTOM_LEFT_GAP = 50;
const SPAWN_BORDER_THICKNESS_ROWS = 2;
const SPAWN_BORDER_LAYER_OFFSET_PX = 3;
const SPAWN_POINT_JITTER = 0.1;

const getNewPoint = (x?: number, y?: number, isStatic?: boolean, rotating = false): TPoint => ({
    position: {
        x: x || (Math.random() * (BORDERS.maxX - BORDERS.minX) + BORDERS.minX),
        y: y || (Math.random() * (BORDERS.maxY - BORDERS.minY) + BORDERS.minY),
    },
    velocity: {
        x: 0,
        y: 0,
    },
    acceleration: {
        x: 0,
        y: 0,
    },
    temporaryData: {},
    isStatic,
});

const newPointX = 100
const newPointY = window.innerHeight * 0.25

const addingInterval = setInterval(() => {
    if (paused) {
        return;
    }
    if (getNonStaticPointsCount() < INITIAL_POINTS_COUNT) {
        const x = newPointX + Math.random() * (SPAWN_HALF_SIZE * 2) - SPAWN_HALF_SIZE
        const y = newPointY + Math.random() * (SPAWN_HALF_SIZE * 2) - SPAWN_HALF_SIZE
        points.push(getNewPoint(x, y));
    } else {
        clearInterval(addingInterval);
    }
});

const createRow = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    spacing: number = 3,
    rotating = false,
    jitter: number = 0,
) => {
    // Calculate the number of points to create
    const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const count = Math.floor(distance / spacing);
    
    if (count <= 0) return;
    
    // Calculate increment for each step
    const xIncrement = (toX - fromX) / count;
    const yIncrement = (toY - fromY) / count;

    const rowPoints: TPoint[] = [];
    
    for (let i = 0; i <= count; i++) {
        const x = fromX + xIncrement * i + (Math.random() * 2 - 1) * jitter;
        const y = fromY + yIncrement * i + (Math.random() * 2 - 1) * jitter;
        const newPoint = getNewPoint(x, y, true, rotating);
        rowPoints.push(newPoint);
        points.push(newPoint);
    }

    if (rotating) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const originalPoints = JSON.parse(JSON.stringify(rowPoints));
        let startingAngle = 0;
        let lastTime = Date.now();
        setInterval(() => {
            const timeElapsed = Date.now() - lastTime;
            lastTime = Date.now();
            if (paused) {
                return;
            }
            const timeDiff = timeElapsed / 4000;
            startingAngle += timeDiff * direction * speedMultiplier
            for (let i = 0; i < rowPoints.length; i++) {
                const point = rowPoints[i];
                const originalPoint = originalPoints[i];
                const relativeX = originalPoint.position.x - fromX
                const relativeY = originalPoint.position.y - fromY
                const angle = Math.atan2(relativeY, relativeX) + startingAngle
                const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY)
                const newX = fromX + Math.cos(angle) * distance
                const newY = fromY + Math.sin(angle) * distance
                point.position.x = newX
                point.position.y = newY
            }
        }, 2);
    }
};

const STATIC_BORDER_THICKNESS_ROWS = 2;
const STAIR_STEPS_MIN = 2;
const STAIR_STEPS_MAX = 7;
const STAIR_LAYER_OFFSET_PX = 3;

const stairStepsCount = Math.floor(Math.random() * (STAIR_STEPS_MAX - STAIR_STEPS_MIN + 1)) + STAIR_STEPS_MIN;

for (let layer = 0; layer < STATIC_BORDER_THICKNESS_ROWS; layer++) {
    const startX = BORDERS.minX + 0.1;
    const startY = window.innerHeight * 0.5 - layer * STAIR_LAYER_OFFSET_PX;
    const endY = window.innerHeight - layer * STAIR_LAYER_OFFSET_PX;
    const stepWidth = (window.innerWidth - startX) / (stairStepsCount + 1);
    const endX = BORDERS.maxX - stepWidth;
    const stepHeight = (endY - startY) / stairStepsCount;
    let currentX = startX;
    let currentY = startY;

    for (let step = 0; step < stairStepsCount; step++) {
        const nextX = Math.min(endX, startX + stepWidth * (step + 1));
        createRow(currentX, currentY, nextX, currentY);
        currentX = nextX;

        const nextY = startY + stepHeight * (step + 1);
        createRow(currentX, currentY, currentX, nextY);
        currentY = nextY;
    }
}

const spawnMinX = newPointX - SPAWN_HALF_SIZE;
const spawnMaxX = newPointX + SPAWN_HALF_SIZE;
const spawnMinY = newPointY - SPAWN_HALF_SIZE;
const spawnMaxY = newPointY + SPAWN_HALF_SIZE;

for (let layer = 0; layer < SPAWN_BORDER_THICKNESS_ROWS; layer++) {
    const layerOffset = layer * SPAWN_BORDER_LAYER_OFFSET_PX;
    const minX = spawnMinX - layerOffset;
    const maxX = spawnMaxX + layerOffset;
    const minY = spawnMinY - layerOffset;
    const maxY = spawnMaxY + layerOffset;

    createRow(minX, minY, maxX, minY, 3, false, SPAWN_POINT_JITTER);
    createRow(minX, minY, minX, maxY, 3, false, SPAWN_POINT_JITTER);
    createRow(maxX, minY, maxX, maxY, 3, false, SPAWN_POINT_JITTER);
    createRow(minX + SPAWN_BOTTOM_LEFT_GAP, maxY, maxX, maxY, 3, false, SPAWN_POINT_JITTER);
}

const staticPoints = points.filter(point => point.isStatic).length
console.log(`Static points: ${staticPoints}`)

const countInput = document.querySelector('input#count') as HTMLInputElement;
const deleteObstaclesButton = document.querySelector('button#delete-obstacles') as HTMLButtonElement;

if (countInput) {
    countInput.value = INITIAL_POINTS_COUNT.toString();
    countInput.setAttribute('max', MAX_POINTS_COUNT.toString());
}

if (deleteObstaclesButton) {
    deleteObstaclesButton.addEventListener('click', () => {
        points = points.filter(point => !point.isStatic);
        deleteObstaclesButton.remove();
    });
}

initControl('input#count', (e) => {
    const newCount = parseInt((e.target as HTMLInputElement).value);
    const nonStaticPointsCount = getNonStaticPointsCount();
    if (newCount > nonStaticPointsCount) {
        const allowedToAdd = Math.max(0, MAX_POINTS_COUNT - nonStaticPointsCount);
        const toAdd = Math.min(allowedToAdd, newCount - nonStaticPointsCount);
        for (let i = 0; i < toAdd; i++) {
            points.push(getNewPoint());
        }
    } else {
        const nonStaticPoints = points.filter(point => !point.isStatic).slice(0, newCount);
        points = [...nonStaticPoints, ...points.filter(point => point.isStatic)];
    }
});

const processBorder = (point: TPoint, axis: "x" | "y", minOrMax: "min" | "max", borderValue: number) => {
    const axisVelocity = point.velocity[axis];
    const isSmall = Math.abs(axisVelocity) < 5;
    if (minOrMax === "min") {
        if (point.position[axis] <= borderValue + POINT_RADIUS - 1) {
            point.position[axis] = borderValue + POINT_RADIUS;
            if (isSmall) {
                point.velocity[axis] = 0;
                return;
            }
            point.velocity[axis] *= -REFLECTION;
            return;
        }
    }
    if (minOrMax === "max") {
        if (point.position[axis] >= borderValue - POINT_RADIUS + 1) {
            point.position[axis] = borderValue - POINT_RADIUS;
            point.velocity[axis] *= -REFLECTION;
            if (isSmall) {
                point.velocity[axis] = 0;
                return;
            }
        }
    }
}

let lastTime: number | null = null;

if (location.hostname !== 'localhost') {
    window.addEventListener('blur', () => {
        paused = true;
        lastTime = Date.now();
    });

    window.addEventListener('focus', () => {
        paused = false;
        lastTime = Date.now();
    });
}

document.body.addEventListener('keydown', (e) => {
    const isSpace = e.code === 'Space';
    const isOne = e.code === 'Digit1';
    const isTwo = e.code === 'Digit2';
    const isThree = e.code === 'Digit3';

    if (isSpace || isOne || isTwo || isThree) {
        e.preventDefault();
    }

    if (isSpace) {
        paused = !paused;
    }

    if (isOne) {
        speedMultiplier = 0.1;
    }

    if (isTwo) {
        speedMultiplier = 7;
    }

    if (isThree) {
        speedMultiplier = 10;
    }

    const input = document.querySelector('input#speed') as HTMLInputElement;
    input.value = (speedMultiplier * 10).toString();
})

initControl('input#speed', (e) => {
    speedMultiplier = parseInt((e.target as HTMLInputElement).value) / 10
})

let lastStepDuration = 0;

let slowdownPower = 999;

initControl('input#slowdown-power', (e) => {
    slowdownPower = parseInt((e.target as HTMLInputElement).value);
})

const step = () => {
    const now = Date.now();
    if (paused) {
        lastTime = now - 10;
        return;
    }

    const startTime = performance.now();
    if (!lastTime) {
        lastTime = now - 10;
    }
    const timeElapsed = Math.min(MAX_FRAME_TIME, now - lastTime);
    const timeDiff = timeElapsed * speedMultiplier;

    const nonStaticPoints: TPoint[] = [];
    const staticPoints: TPoint[] = [];

    for (const point of points) {
        if (point.isStatic) {
            staticPoints.push(point);
        } else {
            nonStaticPoints.push(point);
        }
    }

    for (const point of nonStaticPoints) {
        point.acceleration.x = 0;
        point.acceleration.y = 0;

        for (const power of powers) {
            const isParallel = !!power.isParallel;
            if (isParallel) {
                continue;
            }
            power(point, timeDiff);
        }
    }

    for (const power of powers) {
        const isParallel = !!power.isParallel;
        if (!isParallel) {
            continue;
        }
        power(points);
    }

    for (const point of staticPoints) {
        point.velocity.x = 0;
        point.velocity.y = 0;
        point.acceleration.x = 0;
        point.acceleration.y = 0;
    }

    for (const point of nonStaticPoints) {
        if (isNaN(point.velocity.x)) {
            console.count('NaN velocity X')
            point.velocity.x = point.velocity.x || 0;
        }

        if (isNaN(point.velocity.y)) {
            console.count('NaN velocity Y')
            point.velocity.y = point.velocity.y || 0;
        }

        const accelerationLength = getVectorLength(point.acceleration);
        if (accelerationLength > MAX_ACCELERATION) {
            point.acceleration = multiplyVector(point.acceleration, MAX_ACCELERATION / accelerationLength);
        }

        point.velocity = multiplyVector(point.velocity, Math.pow((slowdownPower / 1000), timeDiff / 1000));

        point.velocity.x += point.acceleration.x * timeDiff / 1000;
        point.velocity.y += point.acceleration.y * timeDiff / 1000;

        const velocityLength = getVectorLength(point.velocity);
        if (velocityLength > MAX_SPEED) {
            point.velocity = multiplyVector(point.velocity, MAX_SPEED / velocityLength);
        }

        point.position.x += point.velocity.x * timeDiff / 1000;
        point.position.y += point.velocity.y * timeDiff / 1000;

        processBorder(point, "x", "min", BORDERS.minX);
        processBorder(point, "x", "max", BORDERS.maxX);
        processBorder(point, "y", "min", BORDERS.minY);
        processBorder(point, "y", "max", BORDERS.maxY);
    }

    lastTime = now;
    fps.frame()

    const endTime = performance.now();
    lastStepDuration = endTime - startTime;
}

const waitFastest = async () => {
    let t: NodeJS.Timeout | null = null
    let f: number | null = null
    await Promise.race([
        new Promise((resolve) => t = setTimeout(resolve)),
        new Promise((resolve) => f = requestAnimationFrame(resolve)),
    ])
    if (t) {
        clearTimeout(t)
    }
    if (f) {
        cancelAnimationFrame(f)
    }
};

export const run = async () => {
    while (true) {
        step();
        if (paused) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        await waitFastest();
    }
}

const statusBlock = document.querySelector('.status') as HTMLDivElement;

let pointsCountChangedOn = Date.now();
let lastPointsCount = points.length;
const updateStatus = () => {
    const isRecentlyChanged = Date.now() - pointsCountChangedOn < 1000;

    if (points.length !== lastPointsCount) {
        pointsCountChangedOn = Date.now();
        lastPointsCount = points.length;
    }

    const text = [
        // `AVG speed: ${window.getAverageSpeed().toFixed(2)}`,
        // `Max speed: ${points.reduce((a, b) => Math.max(a, getVectorLength(b.velocity)), 0).toFixed(2)}`,
        `Points: <span style="font-weight: ${isRecentlyChanged ? 'bold' : 'normal'}">${points.length}${isRecentlyChanged ? ' ➕' : ''}</span>`,
        // `Unique positions: ${(100 * getUniquePositionsCount() / points.length).toFixed(2)}%`,
        // process.env.VERCEL_GIT_COMMIT_MESSAGE && `Commit: <span title="${process.env.VERCEL_GIT_COMMIT_MESSAGE}">${stringToMaxLen(process.env.VERCEL_GIT_COMMIT_MESSAGE, 15)}</span>`,
        `Step: ${lastStepDuration > 16 ? '🐌' : (lastStepDuration > 10 ? '⚠️ ' : '')}${lastStepDuration.toFixed(2)}ms`,

        paused && '<hr>PAUSED',
    ].filter(Boolean).join('<br />');
    statusBlock.innerHTML = text;
}

setInterval(updateStatus, 300);