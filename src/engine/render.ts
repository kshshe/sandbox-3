import { BORDERS, POINT_RADIUS } from "./constants";
import { TPoint, TVector } from "./data.t";
import { MAX_MOUSE_DISTANCE, setMousePosition } from "./powers/mouse";
import { points } from "./runner";
import { MAX_DISTANCE, findClosestPoints } from "./utils/findClosestPoints";

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

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })

    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const isRightClick = e.button === 2;
        setMousePosition(currentMousePosition, isRightClick ? -1 : 1);
        isPressed = true;
    })

    canvas.addEventListener('mouseup', () => {
        setMousePosition(null);
        isPressed = false;
    })

    const gl = canvas.getContext("webgl");

    if (!gl) {
        throw new Error("Can't get canvas context");
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Ошибка компиляции шейдера:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // Вершинный шейдер
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute float a_size;
        varying float v_size;
      
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          gl_PointSize = a_size; 
          v_size = a_size;
        }
      `;

    // Фрагментный шейдер
    const fragmentShaderSource = `
        precision mediump float;
      
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Цвет точки (синий)
        }
      `;

    // Загружаем вершинный и фрагментный шейдеры
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Создаем программу и прикрепляем шейдеры
    const program = gl.createProgram();
    if (!program) {
        throw new Error("Can't create program");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Ошибка при создании программы:', gl.getProgramInfoLog(program));
    }

    // Используем программу
    gl.useProgram(program);

    const render = () => {
        const waterPoints = points.map((point) => {
            const normalizedXCord = 2 * point.position.x / BORDERS.maxX - 1;
            const normalizedYCord = 1 - 2 * point.position.y / BORDERS.maxY;
            return [
                normalizedXCord,
                normalizedYCord,
            ]
        }).flat();

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(waterPoints), gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const sizes = points.map((point) => {
            const closestPoints = point.temporaryData.closestPoints as unknown[]
            return Math.max(6, closestPoints?.length || 0)
        });

        const sizeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);

        const sizeAttributeLocation = gl.getAttribLocation(program, 'a_size');
        gl.enableVertexAttribArray(sizeAttributeLocation);
        gl.vertexAttribPointer(sizeAttributeLocation, 1, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.POINTS, 0, waterPoints.length / 2);

        requestAnimationFrame(render);
    }

    render();
}