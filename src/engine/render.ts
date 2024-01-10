import { BORDERS } from "./constants";
import { initControl } from "./controls";
import { TVector } from "./data.t";
import { setMousePosition } from "./powers/mouse";
import { points } from "./runner";
import { getVectorLength } from "./utils/vector";

let customSizes = false;
let showArrows = false;
let showSpeedArrows = false;

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
                `Точек: ${pointsInMouseRadius.length}`,
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

    if (!ctx) {
        throw new Error("Can't get canvas context");
    }

    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        // Draw points
        points.forEach((point, pointIn) => {
            const size = !customSizes ? 4 : Math.max(6, Math.min(point.temporaryData.closestPointsCount / 2, 20));
            const velocity = getVectorLength(point.velocity);
            const normalizedVelocity = Math.min(velocity / 20, 1);
            const color = `rgb(${255 * normalizedVelocity}, 0, ${255 * (1 - normalizedVelocity)})`;

            ctx.beginPath();
            ctx.rect(point.position.x - size / 2, point.position.y - size / 2, size, size);
            ctx.fillStyle = color;
            ctx.fill();
        });
        
        if (showArrows) {
            // reg arrows to represent acceleration
            points.forEach(point => {
                const color = `rgb(200, 0, 0)`;
                ctx.beginPath();
                ctx.moveTo(point.position.x, point.position.y);
                ctx.lineTo(point.position.x + point.acceleration.x, point.position.y + point.acceleration.y);
                ctx.strokeStyle = color;
                ctx.stroke();
            });
        }

        if (showSpeedArrows) {
            points.forEach(point => {
                const color = `rgb(0, 0, 200)`;
                ctx.beginPath();
                ctx.moveTo(point.position.x, point.position.y);
                ctx.lineTo(point.position.x + point.velocity.x, point.position.y + point.velocity.y);
                ctx.strokeStyle = color;
                ctx.stroke();
            });
        }

        requestAnimationFrame(render);
    }

    render();
}