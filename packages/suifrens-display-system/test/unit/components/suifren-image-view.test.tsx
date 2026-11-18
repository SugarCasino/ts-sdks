// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vitest';
import { ACCESSORIES, getAccessoriesByType } from '../../../src/accessories/index.js';
import { AnimationStore } from '../../../src/animation/animation-store.js';
import { SuiFrenImageInline } from '../../../src/image-inline/index.js';
import { SuiFrenImage } from '../../../src/index.js';
import type { SuiFrenAttributes } from '../../../src/types/suifren.type.js';
import { createTestRoot } from '../../helpers/react-dom.js';

vi.mock('../../../src/animation/waapi-backend.js', () => ({
	startWaapiAnimation: () => ({ handled: false }),
}));

const attributes = {
	mainColor: '6fbbee',
	secondaryColor: 'e6fbff',
	skin: 'basic',
	expression: 'happy',
} as const;
const capy = { ...attributes, earShape: 'default' } satisfies SuiFrenAttributes;
const bullshark = { ...attributes, finStyle: 'classic' } satisfies SuiFrenAttributes;
let view: ReturnType<typeof createTestRoot> | undefined;
afterEach(async () => {
	await view?.unmount();
	view = undefined;
});

test.each([
	['inline', SuiFrenImageInline],
	['assets', SuiFrenImage],
] as const)('species changes rebuild animation registrations for %s', async (_name, Renderer) => {
	view = createTestRoot();
	const register = vi.spyOn(AnimationStore.prototype, 'registerElement');
	await view.render(
		<Renderer attributes={capy} animation={{ preset: 'idle', playState: 'idle' }} />,
	);
	const capyStore = register.mock.contexts[0];
	expect.assert(capyStore instanceof AnimationStore);
	register.mockClear();
	await view.render(
		<Renderer attributes={bullshark} animation={{ preset: 'idle', playState: 'idle' }} />,
	);
	expect(register.mock.calls.length).toBeGreaterThan(0);
	expect(register.mock.contexts[0]).not.toBe(capyStore);
	const bullsharkStore = register.mock.contexts[0];
	expect.assert(bullsharkStore instanceof AnimationStore);
	const finTargets = bullsharkStore.getAnimationTargets().filter(({ part }) => part === 'fin');
	expect(finTargets.length).toBeGreaterThan(0);
	for (const { element } of finTargets) {
		expect(element?.isConnected).toBe(true);
		expect(element?.dataset['suifrenAnimationPart']).toBe('fin');
	}
	register.mockClear();
	await view.render(
		<Renderer attributes={capy} animation={{ preset: 'idle', playState: 'idle' }} />,
	);
	expect(register.mock.calls.length).toBeGreaterThan(0);
	const restoredStore = register.mock.contexts[0];
	expect.assert(restoredStore instanceof AnimationStore);
	expect(restoredStore.getAnimationTargets().some(({ part }) => part === 'fin')).toBe(false);
});

test.each([
	['inline', SuiFrenImageInline],
	['assets', SuiFrenImage],
] as const)('%s uses an explicit SVG instead of the catalogue cap', async (_name, Renderer) => {
	const cap = ACCESSORIES.find((item) => item.name === 'baseball cap');
	expect.assert(cap);
	const assetSrc = '/custom-cap.svg';
	view = createTestRoot();
	await view.render(
		<Renderer
			attributes={capy}
			accessories={[{ ...cap, renderOptions: { ...cap.renderOptions, assetSrc } }]}
		/>,
	);
	expect(view.container.querySelector('image')?.getAttribute('href')).toBe(assetSrc);
});

test.each([SuiFrenImage, SuiFrenImageInline])(
	'renders a custom accessory with only visual fields',
	async (Renderer) => {
		const hat = {
			name: 'custom hat',
			type: 'head',
			category: 'hats',
			renderOptions: { assetSrc: '/custom.svg' },
		};
		view = createTestRoot();
		await view.render(<Renderer attributes={capy} accessories={[hat]} />);
		expect(view.container.querySelector('image')?.getAttribute('href')).toBe('/custom.svg');
	},
);

test('slot lookup preserves catalogue metadata and returns undefined for empty slots', () => {
	const slots = getAccessoriesByType(ACCESSORIES.filter((item) => item.name === 'baseball cap'));
	expect(slots['head']?.price).toBe(2000000000);
	expect(slots['feet']).toBeUndefined();
	expect(slots['constructor']).toBeUndefined();
});

test('selects the ground shadow from the resolved sequence when animations change', async () => {
	view = createTestRoot();
	const fallingShadow = () =>
		view?.container.querySelector('g[data-suifren-animation-part="body"] > ellipse');
	const sequence = { duration: 100, tracks: [] };
	await view.render(
		<SuiFrenImageInline
			attributes={capy}
			shadow
			animation={{ sequence: { ...sequence, shadow: 'falling' } }}
		/>,
	);
	expect(fallingShadow()).toBeTruthy();
	await view.render(
		<SuiFrenImageInline
			attributes={capy}
			shadow
			animation={{ sequence: { ...sequence, name: 'death' } }}
		/>,
	);
	expect(fallingShadow()).toBeNull();
});

test.each(['death', 'death2', 'death3'])(
	'%s uses a falling shadow after resolving the preset',
	async (preset) => {
		view = createTestRoot();
		const fallingShadow = () =>
			view?.container.querySelector('g[data-suifren-animation-part="body"] > ellipse');
		await view.render(<SuiFrenImageInline attributes={capy} shadow animation={{ preset }} />);
		await vi.waitFor(() => {
			expect(fallingShadow()).toBeTruthy();
		});
		await view.render(
			<SuiFrenImageInline attributes={capy} shadow animation={{ preset: 'knockdown' }} />,
		);
		expect(fallingShadow()).toBeNull();
	},
);

test('an airborne shadow stays grounded and follows body height through takeoff and landing', async () => {
	view = createTestRoot();
	const register = vi.spyOn(AnimationStore.prototype, 'registerAirborneShadow');
	const animation = { preset: 'jump', playState: 'paused' } as const;
	await view.render(<SuiFrenImageInline attributes={bullshark} animation={animation} />);
	const target = register.mock.calls[0]?.[0];
	const store = register.mock.contexts[0];
	expect.assert(target);
	expect.assert(store instanceof AnimationStore);
	expect(target.querySelector('ellipse')).toBeNull();

	await view.render(<SuiFrenImageInline attributes={bullshark} animation={animation} shadow />);
	expect(target.querySelector('ellipse')).toBeTruthy();
	const groundPosition = target.parentElement?.getAttribute('transform');
	store.setPoses(new Map([['body', { translate: { x: 0, y: -26 } }]]));
	expect(target.getAttribute('transform')).toBe('scale(0.74)');
	expect(Number(target.getAttribute('opacity'))).toBeLessThan(1);
	expect(target.parentElement?.getAttribute('transform')).toBe(groundPosition);

	store.clear();
	expect(target.getAttribute('transform')).toBe('scale(1)');
	expect(target.getAttribute('opacity')).toBe('1');
});
