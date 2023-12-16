export const initControl = (selector: string, callback: (e: Event) => void) => {
    const element = document.querySelector(selector);
    if (!element) {
        return;
    }
    element.addEventListener('input', callback);
}
