import { BORDERS, POINT_RADIUS } from "./constants";
import { TPoint, TVector } from "./data.t";
import { MAX_MOUSE_DISTANCE, setMousePosition } from "./powers/mouse";
import { points } from "./runner";
import { MAX_DISTANCE } from "./utils/findClosestPoints";

export const initRender = () => {
    const canvas = document.createElement("canvas");
    canvas.width = BORDERS.maxX;
    canvas.height = BORDERS.maxY;
    document.body.appendChild(canvas);

    let currentMousePosition: TVector | null = null;
    let isPressed = false;
    canvas.addEventListener("mousemove", (event) => {
        const pixelX = event.clientX;
        const pixelY = event.clientY;

        currentMousePosition = {
            x: pixelX,
            y: pixelY,
        };
        if (isPressed) {
            setMousePosition(currentMousePosition);
        }
    });

    canvas.addEventListener("mouseleave", () => {
        currentMousePosition = null;
        setMousePosition(null);
        isPressed = false;
    });

    canvas.addEventListener('mousedown', () => {
        setMousePosition(currentMousePosition);
        isPressed = true;
    })

    canvas.addEventListener('mouseup', () => {
        setMousePosition(null);
        isPressed = false;
    })

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Can't get canvas context");
    }

    const renderPoint = (point: TPoint, index: string) => {
        ctx.beginPath();
        ctx.arc(point.position.x, point.position.y, POINT_RADIUS * 6, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(0, 0, 170)`;
        if (index === "0") {
            ctx.fillStyle = "rgb(255, 0, 255)";
        }
        ctx.fill();

        // circle for area of influence
        ctx.beginPath();
        ctx.arc(point.position.x, point.position.y, MAX_DISTANCE, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.stroke();
    }

    const render = () => {
        ctx.clearRect(0, 0, BORDERS.maxX, BORDERS.maxY);

        ctx.beginPath();
        ctx.moveTo(BORDERS.minX, BORDERS.minY);
        ctx.lineTo(BORDERS.maxX, BORDERS.minY);
        ctx.lineTo(BORDERS.maxX, BORDERS.maxY);
        ctx.lineTo(BORDERS.minX, BORDERS.maxY);
        ctx.lineTo(BORDERS.minX, BORDERS.minY);
        ctx.strokeStyle = "black";
        ctx.stroke();

        for (const pointIndex in points) {
            renderPoint(points[pointIndex], pointIndex);
        }

        if (currentMousePosition) {
            ctx.beginPath();
            ctx.arc(currentMousePosition.x * BORDERS.maxX, currentMousePosition.y * BORDERS.maxY, MAX_MOUSE_DISTANCE, 0, 2 * Math.PI);
            ctx.strokeStyle = "black";
            ctx.stroke();
        }

        requestAnimationFrame(render);
    }

    render();
}