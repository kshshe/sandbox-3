import { densityProcessor } from "./density";
import { gravityProcessor } from "./gravity";
import { mouseProcessor } from "./mouse";
import { TPowerProcessor } from "./powers";
import { randomnessProcessor } from "./randomness";
import { initControl } from "../controls";

const availablePowers: Record<string, TPowerProcessor> = {
    gravity: gravityProcessor,
    density: densityProcessor,
    randomness: randomnessProcessor,
    mouse: mouseProcessor,
};

export const powers: Array<TPowerProcessor> = [
    gravityProcessor,
    densityProcessor,
    randomnessProcessor,
    mouseProcessor,
];

initControl('input#gravity', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.checked) {
        powers.push(availablePowers.gravity);
    } else {
        powers.splice(powers.indexOf(availablePowers.gravity), 1);
    }
})

initControl('input#density', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.checked) {
        powers.push(availablePowers.density);
    } else {
        powers.splice(powers.indexOf(availablePowers.density), 1);
    }
})