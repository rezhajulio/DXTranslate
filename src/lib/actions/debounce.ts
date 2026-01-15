interface DebounceParams {
	value: unknown;
	func: () => void;
	duration?: number;
}

export default function debounce(_node: HTMLElement, params: DebounceParams) {
	let timer: ReturnType<typeof setTimeout> | undefined;

	return {
		update(newParams: DebounceParams) {
			params = newParams;
			if (timer) clearTimeout(timer);
			timer = setTimeout(params.func, params.duration ?? 300);
		},
		destroy() {
			if (timer) clearTimeout(timer);
		}
	};
}
