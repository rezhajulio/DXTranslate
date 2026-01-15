import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import debounce from './debounce';

describe('debounce action', () => {
	let mockNode: HTMLElement;
	let mockFunc: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers();
		mockNode = document.createElement('div');
		mockFunc = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('calls func after default duration (300ms) when update is called', () => {
		const action = debounce(mockNode, { value: 'test', func: mockFunc });

		action.update({ value: 'new', func: mockFunc });

		expect(mockFunc).not.toHaveBeenCalled();
		vi.advanceTimersByTime(300);
		expect(mockFunc).toHaveBeenCalledTimes(1);
	});

	it('uses custom duration when provided', () => {
		const action = debounce(mockNode, { value: 'test', func: mockFunc, duration: 500 });

		action.update({ value: 'new', func: mockFunc, duration: 500 });

		expect(mockFunc).not.toHaveBeenCalled();
		vi.advanceTimersByTime(300);
		expect(mockFunc).not.toHaveBeenCalled();
		vi.advanceTimersByTime(200);
		expect(mockFunc).toHaveBeenCalledTimes(1);
	});

	it('update resets timer - calling update twice quickly should only trigger func once', () => {
		const action = debounce(mockNode, { value: 'test', func: mockFunc });

		action.update({ value: 'first', func: mockFunc });
		vi.advanceTimersByTime(100);
		action.update({ value: 'second', func: mockFunc });
		vi.advanceTimersByTime(300);

		expect(mockFunc).toHaveBeenCalledTimes(1);
	});

	it('destroy clears timer - func should not be called after destroy', () => {
		const action = debounce(mockNode, { value: 'test', func: mockFunc });

		action.update({ value: 'new', func: mockFunc });
		vi.advanceTimersByTime(100);
		action.destroy();
		vi.advanceTimersByTime(300);

		expect(mockFunc).not.toHaveBeenCalled();
	});

	it('receives new params on update', () => {
		const newFunc = vi.fn();
		const action = debounce(mockNode, { value: 'test', func: mockFunc });

		action.update({ value: 'new', func: newFunc, duration: 100 });
		vi.advanceTimersByTime(100);

		expect(mockFunc).not.toHaveBeenCalled();
		expect(newFunc).toHaveBeenCalledTimes(1);
	});
});
