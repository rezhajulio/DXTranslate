import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import clickOutside from './clickOutside';

describe('clickOutside', () => {
	let node: HTMLElement;
	let outsideElement: HTMLElement;
	let callback: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		node = document.createElement('div');
		outsideElement = document.createElement('div');
		document.body.appendChild(node);
		document.body.appendChild(outsideElement);
		callback = vi.fn();
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('calls callback when clicking outside the node', () => {
		clickOutside(node, callback);

		outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('does NOT call callback when clicking inside the node', () => {
		const childElement = document.createElement('span');
		node.appendChild(childElement);
		clickOutside(node, callback);

		node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(callback).not.toHaveBeenCalled();

		childElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(callback).not.toHaveBeenCalled();
	});

	it('destroy removes the event listener', () => {
		const action = clickOutside(node, callback);

		action.destroy();

		outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		expect(callback).not.toHaveBeenCalled();
	});
});
