export const initControl = (selector: string, callback: (e: Event) => void) => {
    const element = document.querySelector(selector);
    if (!element) {
        return;
    }
    element.addEventListener('input', callback);

    const firstChildDiv = element.parentElement?.children[0];
    if (firstChildDiv && firstChildDiv.tagName === 'DIV') {
        const label = firstChildDiv.textContent?.trim();
        if (label) {
            element.addEventListener('input', (e) => {
                const input = e.target as HTMLInputElement;
                const value = input.value;
                firstChildDiv.textContent = `${label}: ${value}`;
            });

            const value = (element as HTMLInputElement).value;
            firstChildDiv.textContent = `${label}: ${value}`;
        }
    }
}
