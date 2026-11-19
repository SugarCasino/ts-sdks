// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuiFrenImage } from '@sugarcasino/suifrens-display-system';
import {
	type AccessoryViewport,
	VIP_CROWN_ACCESSORIES,
} from '@sugarcasino/suifrens-display-system/accessories';

const crown = VIP_CROWN_ACCESSORIES.find(({ name }) => name === 'legend')!;
const attributes = {
	mainColor: '6fbbee',
	secondaryColor: 'e6fbff',
	skin: 'basic',
	expression: 'happy',
	earShape: 'default',
} as const;

type ViewportArgs = AccessoryViewport & { crownScale: number };

const meta = {
	title: 'Suifrens/Accessories/Viewport',
	tags: ['0.1.0'],
	parameters: {
		docs: {
			description: {
				component:
					'Use `renderOptions.viewport` to position and size an accessory in the character’s 3000 × 3000 SVG coordinate system. The left portrait uses the default Legend crown framing. Use Crown scale to resize the crown on the right proportionally, or adjust its viewport below.',
			},
		},
	},
	args: { crownScale: 1, x: 390, y: -320, width: 2160, height: 2430 },
	argTypes: {
		crownScale: {
			name: 'Crown scale',
			description:
				'Uniform placement scale. A value of 1 uses the chosen viewport at its original size.',
			control: { type: 'range', min: 0.5, max: 1.5, step: 0.05 },
		},
		x: { control: { type: 'range', min: -1200, max: 1200, step: 10 } },
		y: { control: { type: 'range', min: -1200, max: 1200, step: 10 } },
		width: { control: { type: 'range', min: 500, max: 4500, step: 10 } },
		height: { control: { type: 'range', min: 500, max: 4500, step: 10 } },
	},
	render: ({ crownScale, x, y, width, height }) => {
		const viewport = { x, y, width, height };
		const { renderOptions } = crown;
		const customCrown = {
			...crown,
			renderOptions: {
				...renderOptions,
				viewport,
				placement: {
					...renderOptions.placement,
					capy: { ...renderOptions.placement?.capy, scale: crownScale },
				},
			},
		};
		return (
			<div className="grid max-w-2xl grid-cols-2 gap-3">
				{[
					{ label: 'Default VIP viewport', accessory: crown },
					{ label: 'Custom viewport', accessory: customCrown },
				].map(({ label, accessory }) => (
					<figure key={label} className="story-tile grid justify-items-center gap-3 p-4">
						<SuiFrenImage
							attributes={attributes}
							accessories={[accessory]}
							className="h-auto w-full max-w-60"
							renderSize={240}
						/>
						<figcaption className="text-center text-sm font-semibold">{label}</figcaption>
					</figure>
				))}
			</div>
		);
	},
} satisfies Meta<ViewportArgs>;

export default meta;
export const LegendCrown: StoryObj<typeof meta> = {};
