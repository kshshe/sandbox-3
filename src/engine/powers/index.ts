import { densityProcessor } from "./density";
import { gravityProcessor } from "./gravity";
import { mouseProcessor } from "./mouse";
import { TPowerProcessor } from "./powers";
import { randomnessProcessor } from "./randomness";
import { initControl } from "../controls";
import { collisionProcessor } from "./collision";

const availablePowers: Record<string, TPowerProcessor> = {
    gravity: gravityProcessor,
    density: densityProcessor,
    collision: collisionProcessor,
};

export const powers: Array<TPowerProcessor> = [
    densityProcessor,
    randomnessProcessor,
    mouseProcessor,
];

const listPowers = () => {
    console.log('Powers:');
    for (const power of powers) {
        console.log(power.name);
    }
}

initControl('input#gravity', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.checked) {
        powers.push(availablePowers.gravity);
    } else {
        powers.splice(powers.indexOf(availablePowers.gravity), 1);
    }
    listPowers();
})

initControl('input#density', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.checked) {
        powers.push(availablePowers.density);
    } else {
        powers.splice(powers.indexOf(availablePowers.density), 1);
    }
    listPowers();
})

initControl('input#collision', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.checked) {
        powers.push(availablePowers.collision);
    } else {
        powers.splice(powers.indexOf(availablePowers.collision), 1);
    }
    listPowers();
})

listPowers();