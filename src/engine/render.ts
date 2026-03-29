import { BORDERS } from "./constants";
import { initControl } from "./controls";
import { TVector } from "./data.t";
import { setMousePosition } from "./powers/mouse";
import { addObstacleAt, addWaterAt, points, removeObstacleAt, removeWaterAt } from "./runner";
import { getDistance, getVectorLength } from "./utils/vector";

let customSizes = true;
let showArrows = false;
let showSpeedArrows = false;
let TARGET_FPS = 45;
const maxSpeedLengthForRed = 20;
type TMouseMode = "attract" | "repel" | "draw-obstacles" | "erase-obstacles" | "add-water" | "erase-water";
const BRUSH_STEP = 10;
const DRAW_OBSTACLES_INTERVAL_MS = 16;
const ADD_WATER_INTERVAL_MS = 20;
let activeMouseMode: TMouseMode = "attract";

const getMouseModeLabel = (mode: TMouseMode) => {
    switch (mode) {
        case "repel":
            return "Repel";
        case "draw-obstacles":
            return "Draw obstacles";
        case "erase-obstacles":
            return "Erase obstacles";
        case "add-water":
            return "Add water";
        case "erase-water":
            return "Erase water";
        case "attract":
        default:
            return "Attract";
    }
};

const getPairedMouseMode = (mode: TMouseMode): TMouseMode => {
    switch (mode) {
        case "repel":
            return "attract";
        case "draw-obstacles":
            return "erase-obstacles";
        case "erase-obstacles":
            return "draw-obstacles";
        case "add-water":
            return "erase-water";
        case "erase-water":
            return "add-water";
        case "attract":
        default:
            return "repel";
    }
};

initControl('input#maxFps', (e) => {
    const input = e.target as HTMLInputElement;
    TARGET_FPS = parseInt(input.value);
})

initControl('input#custom-sizes', (e) => {
    const input = e.target as HTMLInputElement;
    customSizes = input.checked;
})

initControl('input#show-arrows', (e) => {
    const input = e.target as HTMLInputElement;
    showArrows = input.checked;
})

initControl('input#show-arrows-2', (e) => {
    const input = e.target as HTMLInputElement;
    showSpeedArrows = input.checked;
})

initControl('select#mouse-mode', (e) => {
    activeMouseMode = (e.target as HTMLSelectElement).value as TMouseMode;
    setMousePosition(null);
    const leftMouseHint = document.querySelector('#left-mouse-hint') as HTMLSpanElement | null;
    const rightMouseHint = document.querySelector('#right-mouse-hint') as HTMLSpanElement | null;
    if (leftMouseHint) {
        leftMouseHint.textContent = getMouseModeLabel(activeMouseMode);
    }
    if (rightMouseHint) {
        rightMouseHint.textContent = getMouseModeLabel(getPairedMouseMode(activeMouseMode));
    }
}, false)

export const initRender = () => {
    const canvas = document.createElement("canvas");
    canvas.width = BORDERS.maxX;
    canvas.height = BORDERS.maxY;
    document.body.appendChild(canvas);

    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = BORDERS.maxX;
    overlayCanvas.height = BORDERS.maxY;
    overlayCanvas.style.pointerEvents = 'none';
    document.body.appendChild(overlayCanvas);

    let currentMousePosition: TVector | null = null;
    let isPressed = false;
    let activeMouseButton: 0 | 2 | null = null;
    let lastPaintPosition: TVector | null = null;
    let lastPaintAt = 0;

    const cursorCircle = document.querySelector('.cursor-circle') as HTMLDivElement;
    const cursorInfo = document.querySelector('.info') as HTMLDivElement;
    const leftMouseHint = document.querySelector('#left-mouse-hint') as HTMLSpanElement | null;
    const rightMouseHint = document.querySelector('#right-mouse-hint') as HTMLSpanElement | null;
    const radius = 20;
    const renderMouse = () => {
        if (!currentMousePosition) {
            cursorCircle.style.display = 'none';
            cursorInfo.style.display = 'none';
        } else {
            cursorCircle.style.display = 'block';
            cursorInfo.style.display = 'block';
            const transform = `translate(${currentMousePosition.x - radius}px, ${currentMousePosition.y - radius}px)`;
            cursorCircle.style.transform = transform;
            cursorInfo.style.transform = transform;
            const mousePosition = currentMousePosition;

            const pointsInMouseRadius = points.map((point, pointIndex) => {
                const distance = getVectorLength({
                    x: point.position.x - mousePosition.x,
                    y: point.position.y - mousePosition.y,
                });
                return {
                    condition: distance < radius,
                    point,
                    pointIndex,
                };
            })
                .filter(({ condition }) => condition)

            const dataParts = [
                `Points: ${pointsInMouseRadius.length}`,
                pointsInMouseRadius.length < 5 && pointsInMouseRadius.map(({
                    point,
                    pointIndex,
                }) => {
                    return [
                        `P ${point.position.x.toFixed(0)}x${point.position.y.toFixed(0)}`,
                        `A ${getVectorLength(point.acceleration).toFixed(2)}`,
                        `V ${getVectorLength(point.velocity).toFixed(2)}`,
                        `I ${pointIndex}`,
                        ''
                    ]
                }).flat().join('<br />'),
            ].filter(Boolean)

            cursorInfo.innerHTML = dataParts.join('<br />');
        }
    }

    const updateMouseHints = () => {
        if (leftMouseHint) {
            leftMouseHint.textContent = getMouseModeLabel(activeMouseMode);
        }

        if (rightMouseHint) {
            rightMouseHint.textContent = getMouseModeLabel(getPairedMouseMode(activeMouseMode));
        }
    };

    const renderMouseLoop = () => {
        if (isPressed && currentMousePosition && !isForceMode(getCurrentPointerMode())) {
            applyMouseMode(currentMousePosition);
        }
        renderMouse();
        requestAnimationFrame(renderMouseLoop);
    }
    updateMouseHints();

    const getCurrentPointerMode = (): TMouseMode => {
        if (activeMouseButton === 2) {
            return getPairedMouseMode(activeMouseMode);
        }

        return activeMouseMode;
    };

    const isForceMode = (mode: TMouseMode): mode is "attract" | "repel" => {
        return mode === "attract" || mode === "repel";
    };

    const paintAt = (position: TVector, mode: TMouseMode) => {
        if (mode === "draw-obstacles") {
            addObstacleAt(position);
        }

        if (mode === "erase-obstacles") {
            removeObstacleAt(position);
        }

        if (mode === "add-water") {
            addWaterAt(position);
        }

        if (mode === "erase-water") {
            removeWaterAt(position);
        }
    };

    const paintBetween = (from: TVector | null, to: TVector, mode: TMouseMode, force = false) => {
        const now = Date.now();
        const brushInterval = mode === "add-water" ? ADD_WATER_INTERVAL_MS : DRAW_OBSTACLES_INTERVAL_MS;
        if (!force && now - lastPaintAt < brushInterval) {
            return;
        }

        const distance = from ? getDistance(from, to) : 0;
        const steps = from ? Math.max(1, Math.ceil(distance / BRUSH_STEP)) : 1;

        for (let step = 0; step <= steps; step++) {
            const progress = step / steps;
            const position = from ? {
                x: from.x + (to.x - from.x) * progress,
                y: from.y + (to.y - from.y) * progress,
            } : to;
            paintAt(position, mode);
        }

        lastPaintAt = now;
        lastPaintPosition = to;
    };

    const applyMouseMode = (position: TVector | null, force = false) => {
        if (!position) {
            setMousePosition(null);
            return;
        }

        const currentMode = getCurrentPointerMode();

        if (isForceMode(currentMode)) {
            setMousePosition(position, currentMode);
            return;
        }

        setMousePosition(null);
        paintBetween(lastPaintPosition, position, currentMode, force);
    };

    const stopInteraction = (clearCursor = false) => {
        setMousePosition(null);
        isPressed = false;
        activeMouseButton = null;
        lastPaintPosition = null;
        lastPaintAt = 0;

        if (clearCursor) {
            currentMousePosition = null;
            renderMouse();
        }
    };

    renderMouse();
    requestAnimationFrame(renderMouseLoop);

    canvas.addEventListener("mousemove", (event) => {
        const pixelX = event.clientX;
        const pixelY = event.clientY;

        currentMousePosition = {
            x: pixelX,
            y: pixelY,
        };
        renderMouse();
        if (isPressed) {
            applyMouseMode(currentMousePosition);
        }
    });

    canvas.addEventListener("mouseleave", () => {
        stopInteraction(true);
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })

    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (!currentMousePosition) {
            return;
        }
        activeMouseButton = e.button === 2 ? 2 : 0;
        isPressed = true;
        applyMouseMode(currentMousePosition, true);
    })

    canvas.addEventListener('mouseup', (e) => {
        if (activeMouseButton !== null && e.button !== activeMouseButton) {
            return;
        }
        stopInteraction();
    })

    canvas.addEventListener("touchmove", (event) => {
        const touch = event.touches[0];
        const pixelX = touch.clientX;
        const pixelY = touch.clientY;

        currentMousePosition = {
            x: pixelX,
            y: pixelY,
        };
        if (isPressed) {
            applyMouseMode(currentMousePosition);
        }
    });

    canvas.addEventListener("touchend", () => {
        stopInteraction(true);
    });

    canvas.addEventListener("touchcancel", () => {
        stopInteraction(true);
    });

    canvas.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];
        const pixelX = touch.clientX;
        const pixelY = touch.clientY;

        currentMousePosition = { x: pixelX, y: pixelY };
        isPressed = true;
        renderMouse();
        applyMouseMode(currentMousePosition, true);
    });

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');

    if (!ctx) {
        throw new Error("Can't get canvas context");
    }

    if (!overlayCtx) {
        throw new Error("Can't get overlay canvas context");
    }

    let lastFrameTime = Date.now();

    const bigPointSize = 30;
    const render = () => {
        const now = Date.now();
        const isEnoughtToTargetFps = now - lastFrameTime > 1000 / TARGET_FPS;
        if (!isEnoughtToTargetFps) {
            requestAnimationFrame(render);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        const size = customSizes ? bigPointSize : 4;
        const color = `rgb(0, 0, 255)`;

        const nonStaticPoints = points.filter(point => !point.isStatic);

        // Draw points
        nonStaticPoints.forEach((point) => {
            const x = point.position.x - size / 2;
            const y = point.position.y - size / 2;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);

            if (customSizes) {
                const size = 2
                const halfSize = 1
                overlayCtx.fillStyle = `rgb(162, 198, 255)`;
                overlayCtx.fillRect(point.position.x - halfSize, point.position.y - halfSize, size, size);

                // Draw an extra dot at the opposite side of point.velocity vector
                const oppositeVelocity = {
                    x: -point.velocity.x,
                    y: -point.velocity.y,
                };

                const maxCoordinateInOppositeVelocity = Math.max(Math.abs(oppositeVelocity.x), Math.abs(oppositeVelocity.y));

                if (maxCoordinateInOppositeVelocity > bigPointSize * 1.25) {
                    const factor = bigPointSize / maxCoordinateInOppositeVelocity;
                    oppositeVelocity.x *= factor;
                    oppositeVelocity.y *= factor;
                }

                const oppositePosition = {
                    x: point.position.x + oppositeVelocity.x / 2,
                    y: point.position.y + oppositeVelocity.y / 2,
                };

                const velocitySize = bigPointSize * 0.75;
                ctx.fillStyle = color;
                ctx.fillRect(oppositePosition.x - velocitySize / 2, oppositePosition.y - velocitySize / 2, velocitySize, velocitySize);
            }
        });

        if (customSizes) {
            canvas.classList.add('filtered');
        } else {
            canvas.classList.remove('filtered');
        }

        if (showArrows) {
            // reg arrows to represent acceleration
            nonStaticPoints.forEach(point => {
                const color = `rgb(200, 0, 0)`;
                overlayCtx.beginPath();
                overlayCtx.moveTo(point.position.x, point.position.y);
                overlayCtx.lineTo(point.position.x + point.acceleration.x, point.position.y + point.acceleration.y);
                overlayCtx.strokeStyle = color;
                overlayCtx.stroke();
            });
        }

        if (showSpeedArrows) {
            nonStaticPoints.forEach(point => {
                const color = `rgb(0, 0, 200)`;
                overlayCtx.beginPath();
                overlayCtx.moveTo(point.position.x, point.position.y);
                overlayCtx.lineTo(point.position.x + point.velocity.x, point.position.y + point.velocity.y);
                overlayCtx.strokeStyle = color;
                overlayCtx.stroke();
            });
        }

        const staticPoints = points.filter(point => point.isStatic);

        const staticSize = customSizes ? 10 : 1;
        const width = staticSize / 2;
        staticPoints.forEach(point => {
            overlayCtx.fillStyle = `rgb(0, 0, 0)`;
            const x = point.position.x - width;
            const y = point.position.y - width;
            overlayCtx.fillRect(x, y, staticSize, staticSize);
            if (customSizes) {
                ctx.fillStyle = `rgb(255, 255, 255)`;
                ctx.fillRect(point.position.x, point.position.y, 1, 1);
            }
        });

        lastFrameTime = now;

        requestAnimationFrame(render);
    }

    render();
}
