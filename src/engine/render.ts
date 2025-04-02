import { BORDERS } from "./constants";
import { initControl } from "./controls";
import { TVector } from "./data.t";
import { setMousePosition } from "./powers/mouse";
import { points } from "./runner";
import { getVectorLength } from "./utils/vector";

let customSizes = true;
let showArrows = false;
let showSpeedArrows = false;
let TARGET_FPS = 45;

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

    const cursorCircle = document.querySelector('.cursor-circle') as HTMLDivElement;
    const cursorInfo = document.querySelector('.info') as HTMLDivElement;
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

    const renderMouseLoop = () => {
        renderMouse();
        requestAnimationFrame(renderMouseLoop);
    }

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
            setMousePosition(currentMousePosition);
        }
    });

    canvas.addEventListener("mouseleave", () => {
        currentMousePosition = null;
        setMousePosition(null);
        isPressed = false;
        renderMouse();
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })

    canvas.addEventListener('mousedown', (e) => {
        console.log(e.button);
        e.preventDefault();
        const isRightClick = e.button === 2;
        setMousePosition(currentMousePosition, isRightClick ? -1 : 1);
        isPressed = true;
    })

    canvas.addEventListener('mouseup', () => {
        setMousePosition(null);
        isPressed = false;
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
            setMousePosition(currentMousePosition);
        }
    });

    canvas.addEventListener("touchend", () => {
        currentMousePosition = null;
        setMousePosition(null);
        isPressed = false;
    });

    canvas.addEventListener("touchcancel", () => {
        currentMousePosition = null;
        setMousePosition(null);
        isPressed = false;
    });

    canvas.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];
        const pixelX = touch.clientX;
        const pixelY = touch.clientY;

        setMousePosition({ x: pixelX, y: pixelY }, 1);
        isPressed = true;
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

    const render = () => {
        const now = Date.now();
        const isEnoughtToTargetFps = now - lastFrameTime > 1000 / TARGET_FPS;
        if (!isEnoughtToTargetFps) {
            requestAnimationFrame(render);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        const size = customSizes ? 30 : 4;
        const color = `rgb(0, 0, 255)`;

        const nonStaticPoints = points.filter(point => !point.isStatic);

        // Draw points
        nonStaticPoints.forEach((point) => {
            const x = point.position.x - size / 2;
            const y = point.position.y - size / 2;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, size, size);
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
                ctx.beginPath();
                ctx.moveTo(point.position.x, point.position.y);
                ctx.lineTo(point.position.x + point.acceleration.x, point.position.y + point.acceleration.y);
                ctx.strokeStyle = color;
                ctx.stroke();
            });
        }

        if (showSpeedArrows) {
            nonStaticPoints.forEach(point => {
                const color = `rgb(0, 0, 200)`;
                ctx.beginPath();
                ctx.moveTo(point.position.x, point.position.y);
                ctx.lineTo(point.position.x + point.velocity.x, point.position.y + point.velocity.y);
                ctx.strokeStyle = color;
                ctx.stroke();
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