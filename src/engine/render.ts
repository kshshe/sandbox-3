import { BORDERS, POINT_RADIUS } from "./constants";
import { TPoint } from "./data.t";
import { points } from "./runner";

export const initRender = () => {
    const canvas = document.createElement("canvas");
    canvas.width = BORDERS.maxX;
    canvas.height = BORDERS.maxY;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Can't get canvas context");
    }

    const renderPoint = (point: TPoint) => {
        ctx.beginPath();
        ctx.arc(point.position.x, point.position.y, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = "blue";
        ctx.fill();
    }

    const render = () => {
        ctx.clearRect(0, 0, BORDERS.maxX, BORDERS.maxY);

        for (const point of points) {
            renderPoint(point);
        }

        requestAnimationFrame(render);
    }

    render();
}