// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ACCESSORIES } from '@sugar/suifrens-display-system/accessories';
import { PRESET_CATALOG, type PresetCatalogEntry } from '../../animation/preset-catalog.js';
import { CatalogueDocs } from '../CatalogueDocs.js';
import { CataloguePreview } from './CataloguePreview.js';

const microphoneAccessory = ACCESSORIES.find((accessory) => accessory.name === 'microphone');

function getPreviewAccessories(presetName: string) {
	return presetName === 'talkMicrophone' && microphoneAccessory ? [microphoneAccessory] : [];
}

function PresetPreview({ preset }: { preset: PresetCatalogEntry }) {
	return (
		<CataloguePreview
			title={preset.label}
			subtitle={preset.name}
			animation={preset.config}
			accessories={getPreviewAccessories(preset.name)}
		/>
	);
}

const meta = {
	title: 'Suifrens/Animations/Presets',
	parameters: { controls: { disable: true }, docs: { page: CatalogueDocs } },
	tags: [],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Presets: Story = {
	render: () => (
		<div className="flex flex-col gap-10">
			{PRESET_CATALOG.map((group) => (
				<section key={group.title}>
					<h2 className="story-heading mb-4">{group.title}</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{group.presets.map((preset) => (
							<PresetPreview key={preset.name} preset={preset} />
						))}
					</div>
				</section>
			))}
		</div>
	),
};

function presetStory(name: string): Story {
	const preset = PRESET_CATALOG.flatMap((group) => group.presets).find(
		(entry) => entry.name === name,
	);
	if (!preset) {
		throw new Error(`Unknown animation preset: ${name}`);
	}
	return { render: () => <PresetPreview preset={preset} /> };
}
export const Idle: Story = { ...presetStory('idle'), tags: [] };
export const Walk: Story = { ...presetStory('walk'), tags: [] };
export const GoalkeeperCrab: Story = {
	...presetStory('goalkeeperCrab'),
	tags: [],
};
export const Sit: Story = { ...presetStory('sit'), tags: [] };
export const Stand: Story = { ...presetStory('stand'), tags: [] };
export const Run: Story = presetStory('run');
export const Sprint: Story = presetStory('sprint');
export const Jump: Story = { ...presetStory('jump'), tags: [] };
export const WalkJumpSit: Story = {
	...presetStory('walkJumpSit'),
	tags: [],
};
export const Celebrate: Story = {
	...presetStory('celebrate'),
	tags: [],
};
export const Jackpot: Story = { ...presetStory('jackpot'), tags: [] };
export const SlotPull: Story = {
	...presetStory('slotPull'),
	tags: [],
};
export const Suspense: Story = {
	...presetStory('suspense'),
	tags: [],
};
export const TalkMicrophone: Story = {
	tags: [],
	...presetStory('talkMicrophone'),
	name: 'Talk Mic · talkMicrophone',
};
export const Crouch: Story = presetStory('crouch');
export const CrouchWalk: Story = presetStory('crouchWalk');
export const Slide: Story = presetStory('slide');
export const Ourah: Story = presetStory('ourah');
export const Showing: Story = presetStory('showing');
export const Punch: Story = presetStory('punch');
export const Kick: Story = presetStory('kick');
export const Melee: Story = presetStory('melee');
export const Hit: Story = { ...presetStory('hit'), name: 'Hit Reaction · hit' };
export const Knockdown: Story = {
	...presetStory('knockdown'),
	name: 'Knockdown / Get Up · knockdown',
};
export const Revive: Story = presetStory('revive');
export const Death: Story = { ...presetStory('death'), name: 'Death (Alt 1) · death' };
export const Death2: Story = { ...presetStory('death2'), name: 'Death (Alt 2) · death2' };
export const Death3: Story = { ...presetStory('death3'), name: 'Death (Alt 3) · death3' };
export const Victory: Story = presetStory('victory');
export const Floss: Story = { ...presetStory('floss'), name: 'Floss (Victory Alt) · floss' };
