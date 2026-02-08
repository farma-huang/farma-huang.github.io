export function initCodeCopy() {
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach((block) => {
        // Check if button already exists to prevent duplicates
        if (block.querySelector('.copy-btn')) return;

        const button = document.createElement('button');
        button.className = 'copy-btn absolute top-2 right-2 text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded opacity-0 transition-opacity group-hover:opacity-100';
        button.textContent = 'Copy';

        // Wrap pre in relative group container if not already
        if (!block.parentElement?.classList.contains('relative')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative group';
            block.parentNode?.insertBefore(wrapper, block);
            wrapper.appendChild(block);
            wrapper.appendChild(button);
        } else {
            block.parentElement.classList.add('group');
            block.parentElement.appendChild(button);
        }

        button.addEventListener('click', async () => {
            const code = block.querySelector('code')?.innerText;
            if (code) {
                await navigator.clipboard.writeText(code);
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            }
        });
    });
}
