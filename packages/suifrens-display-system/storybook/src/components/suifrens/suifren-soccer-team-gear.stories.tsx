// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ACCESSORIES, type AccessoryKit } from '@sugarcasino/suifrens-display-system/accessories';
import { SuiFrenImage } from '@sugarcasino/suifrens-display-system/embed';
import {
	resolveSoccerCountryCode,
	SOCCER_TEAM_KITS,
	type SoccerTeamCountryCode,
	type SoccerTeamSide,
} from '@sugarcasino/suifrens-display-system/kits';
import { KitRendererComparison } from './KitRendererComparison.js';

const capyAttributes = {
	mainColor: '6fbbee',
	secondaryColor: 'e6fbff',
	skin: 'basic',
	earShape: 'default',
	expression: 'happy',
} as const;

const bullsharkAttributes = {
	mainColor: '6fbbee',
	secondaryColor: 'e6fbff',
	skin: 'basic',
	finStyle: 'classic',
	expression: 'happy',
} as const;

const teamShirt = ACCESSORIES.find((accessory) => accessory.name === 'soccer team shirt')!;
const teamTrunks = ACCESSORIES.find((accessory) => accessory.name === 'soccer team swim trunks')!;
const leftGothBoot = ACCESSORIES.find((accessory) => accessory.name === 'left goth boot')!;
const rightGothBoot = ACCESSORIES.find((accessory) => accessory.name === 'right goth boot')!;

const countries = Object.keys(SOCCER_TEAM_KITS)
	.filter((code) => code !== 'GLOBAL')
	.map((code) => resolveSoccerCountryCode(code));

function buildTeamGear(country: SoccerTeamCountryCode, side: SoccerTeamSide = 'home') {
	const kit: AccessoryKit = { type: 'soccer', country, side };
	return [
		{
			...teamShirt,
			renderOptions: { ...teamShirt.renderOptions, kit },
		},
		{
			...teamTrunks,
			renderOptions: { ...teamTrunks.renderOptions, kit },
		},
		leftGothBoot,
		rightGothBoot,
	];
}

const meta = {
	title: 'Suifrens/Accessories/Kits/Soccer Team Kit',
	parameters: { controls: { disable: true } },
	tags: ['0.0.1'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllCountries: Story = {
	render: () => (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
			{countries.map((country) => (
				<div key={country} className="story-tile p-3">
					<div className="mb-1 flex items-center justify-between">
						<span className="story-heading">{country}</span>
						<span className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
							Embedded accessories
						</span>
					</div>
					<div className="h-36">
						<SuiFrenImage
							attributes={capyAttributes}
							accessories={buildTeamGear(country)}
							shadow
							style={{ width: '100%', height: '100%' }}
						/>
					</div>
				</div>
			))}
		</div>
	),
};

export const CompareSvgRenderers: Story = {
	name: 'Compare SVG Renderers',
	render: () => {
		const showcaseCountries: Array<SoccerTeamCountryCode> = [
			'AR',
			'BR',
			'FR',
			'GB',
			'JP',
			'MX',
			'US',
		];

		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{showcaseCountries.map((country) => (
					<div key={country} className="story-panel">
						<h2 className="story-heading mb-2">{country}</h2>
						{(
							[
								{ label: 'Capy · Home', attributes: capyAttributes, side: 'home' },
								{ label: 'Bullshark · Away', attributes: bullsharkAttributes, side: 'away' },
							] as const
						).map(({ label, attributes, side }) => (
							<div key={side} className="mt-3">
								<h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
									{label}
								</h3>
								<KitRendererComparison
									attributes={attributes}
									accessories={buildTeamGear(country, side)}
									shadow
								/>
							</div>
						))}
					</div>
				))}
			</div>
		);
	},
};
