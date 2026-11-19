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

const meta = {
	title: 'Suifrens/Accessories/Viewport',
	tags: ['0.1.0'],
	parameters: {
		docs: {
			description: {
				component:
					'Use `renderOptions.viewport` to position and size an accessory in the 3000 × 3000 SVG coordinate system. The left portrait uses the default Legend crown framing. Adjust the viewport controls to position and size the crown on the right.',
			},
		},
	},
	args: { x: 390, y: -320, width: 2160, height: 2430 },
	argTypes: {
		x: {
			description:
				'Horizontal position of the left edge of the viewport in SVG units. Increase to move the crown right.',
			control: { type: 'range', min: -1200, max: 1200, step: 10 },
		},
		y: {
			description:
				'Vertical position of the top edge of the viewport in SVG units. Increase to move the crown down.',
			control: { type: 'range', min: -1200, max: 1200, step: 10 },
		},
		width: {
			description: 'Width of the area available to the crown, in SVG units.',
			control: { type: 'range', min: 500, max: 4500, step: 10 },
		},
		height: {
			description: 'Height of the area available to the crown, in SVG units.',
			control: { type: 'range', min: 500, max: 4500, step: 10 },
		},
	},
	render: ({ x, y, width, height }) => {
		const customCrown = {
			...crown,
			renderOptions: { ...crown.renderOptions, viewport: { x, y, width, height } },
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
} satisfies Meta<AccessoryViewport>;

export default meta;
export const LegendCrown: StoryObj<typeof meta> = {};
