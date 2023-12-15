import { densityProcessor } from "./density";
import { gravityProcessor } from "./gravity";
import { TPowerProcessor } from "./powers";

export const powers: Array<TPowerProcessor> = [
    gravityProcessor,
    densityProcessor,
];