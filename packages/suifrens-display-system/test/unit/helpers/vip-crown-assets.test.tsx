// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { ACCESSORIES } from '../../../src/constants/accessories.js';
import { VIP_CROWN_ACCESSORIES } from '../../../src/constants/vip-crowns.js';
import { SuiFrenImage as EmbeddedSuiFrenImage } from '../../../src/embed.js';
import { getVipCrownAssetSrc } from '../../../src/helpers/accessories/vip-crown-assets.js';
import { SuiFrenImage } from '../../../src/index.js';

const common = {
	mainColor: '6fbbee',
	secondaryColor: 'e6fbff',
	skin: 'basic',
	expression: 'happy',
} as const;
const species = [
	{ ...common, earShape: 'default' },
	{ ...common, finStyle: 'classic' },
] as const;

test.each(VIP_CROWN_ACCESSORIES)(
	'$name artwork has room for its tips and ornaments',
	(accessory) => {
		const source = readFileSync(`src/accessories/crowns/${accessory.name}.svg`, 'utf8');
		const container = document.createElement('div');
		container.innerHTML = source;
		expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('-200 -600 3209 3609');
		expect(container.querySelector('clipPath, [clip-path]')).toBeNull();
	},
);

test.each([
	['embedded', EmbeddedSuiFrenImage],
	['assets', SuiFrenImage],
] as const)(
	'%s preserves avatar framing and crown scale while letting unframed crowns overflow',
	(mode, Renderer) => {
		for (const attributes of species) {
			for (const accessory of VIP_CROWN_ACCESSORIES) {
				const container = document.createElement('div');
				container.innerHTML = renderToStaticMarkup(
					<Renderer attributes={attributes} accessories={[accessory]} renderSize={64} />,
				);
				const svg = container.querySelector('svg')!;
				expect(svg.getAttribute('viewBox')).toBe('0 -200 3000 3000');
				expect(svg.getAttribute('overflow')).toBe('visible');
				expect(svg.getAttribute('width')).toBe('64');
				const image = svg.querySelector('image')!;
				const asset = getVipCrownAssetSrc(accessory.name);
				expect.assert(typeof asset === 'string', `Missing crown: ${accessory.name}`);
				expect(asset).not.toBe('');
				const expectedHref = {
					embedded:
						'data:image/svg+xml;base64,' +
						readFileSync(`src/accessories/crowns/${accessory.name}.svg`).toString('base64'),
					assets: asset,
				}[mode];
				expect(image.getAttribute('href')).toBe(expectedHref);
				const scaleX = Number(image.getAttribute('width')) / 3209;
				const scaleY = Number(image.getAttribute('height')) / 3609;
				expect(scaleX).toBeCloseTo(3000 / 3009);
				expect(scaleY).toBeCloseTo(scaleX);
				// The old artboard origin still maps to (0, 0), so crown fit is unchanged.
				expect(Number(image.getAttribute('x')) + 200 * scaleX).toBeCloseTo(0);
				expect(Number(image.getAttribute('y')) + 600 * scaleY).toBeCloseTo(0);
			}
		}
	},
);

test.each([EmbeddedSuiFrenImage, SuiFrenImage])(
	'uncrowned portraits retain their framing',
	(Renderer) => {
		const container = document.createElement('div');
		container.innerHTML = renderToStaticMarkup(<Renderer attributes={species[0]} />);
		expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 -200 3000 3000');
		expect(container.querySelector('svg')?.hasAttribute('overflow')).toBe(false);
	},
);

const customViewport = { x: -12, y: 0, width: 420, height: 380 };

for (const Renderer of [EmbeddedSuiFrenImage, SuiFrenImage]) {
	test.each(['legend', 'baseball cap', 'runner singlet', 'left goth boot'])(
		'%s uses the explicit viewport for its catalogue artwork',
		(name) => {
			const item = ACCESSORIES.find((piece) => piece.name === name)!;
			const accessory = {
				...item,
				renderOptions: { ...item.renderOptions, viewport: customViewport },
			};
			const container = document.createElement('div');
			container.innerHTML = renderToStaticMarkup(
				<Renderer attributes={species[0]} accessories={[accessory]} />,
			);
			expect(
				container.querySelector('svg [x="-12"][y="0"][width="420"][height="380"]'),
			).not.toBeNull();
		},
	);

	test.each([
		['legend', {}, (-600 * 3000) / 3009],
		['legend', { viewport: customViewport }, customViewport.y],
		['unknown crown', {}, 0],
		['unknown crown', { viewport: customViewport }, customViewport.y],
	] as const)(
		'%s resolves the viewport independently of a custom asset URL',
		(name, options, expectedY) => {
			const assetSrc = '/custom-crown.svg';
			const accessory = {
				type: 'head',
				category: 'crowns',
				name,
				renderOptions: { assetSrc, ...options },
			};
			const container = document.createElement('div');
			container.innerHTML = renderToStaticMarkup(
				<Renderer attributes={species[0]} accessories={[accessory]} />,
			);
			const image = container.querySelector('image')!;
			expect(image.getAttribute('href')).toBe(assetSrc);
			expect(Number(image.getAttribute('y'))).toBeCloseTo(expectedY);
		},
	);
}

test.each([EmbeddedSuiFrenImage, SuiFrenImage])(
	'adding a crown preserves the native body, head and facial coordinate systems',
	(Renderer) => {
		for (const attributes of species) {
			const bare = document.createElement('div');
			const crowned = document.createElement('div');
			bare.innerHTML = renderToStaticMarkup(<Renderer attributes={attributes} renderSize={64} />);
			crowned.innerHTML = renderToStaticMarkup(
				<Renderer
					attributes={attributes}
					accessories={[VIP_CROWN_ACCESSORIES.at(-1)!]}
					renderSize={64}
				/>,
			);
			for (const selector of ['svg', 'svg svg', 'path']) {
				const geometry = (container: HTMLElement) =>
					Array.from(container.querySelectorAll(selector), (element) => ({
						viewBox: element.getAttribute('viewBox'),
						d: element.getAttribute('d'),
						transform: element.getAttribute('transform'),
					}));
				expect(geometry(crowned)).toEqual(geometry(bare));
			}
		}
	},
);
