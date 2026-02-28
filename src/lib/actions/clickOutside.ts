export default function clickOutside(node: HTMLElement, callbackFunction: () => void) {
	const handleClick = (event: Event) => {
		const target = event.target as HTMLElement;
		if (node && !node.contains(target)) {
			callbackFunction();
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			callbackFunction();
		}
	};

	document.addEventListener('click', handleClick, true);
	document.addEventListener('keydown', handleKeydown, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('keydown', handleKeydown, true);
		}
	};
}
