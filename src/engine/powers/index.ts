import { densityProcessor } from "./density";
import { gravityProcessor } from "./gravity";
import { TPowerProcessor } from "./powers";
import { randomnessProcessor } from "./randomness";

export const powers: Array<TPowerProcessor> = [
    gravityProcessor,
    densityProcessor,
    randomnessProcessor,
];