// Adapted by Sugar from the SuiFrens Display System by Mysten Labs.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import type { StorybookConfig } from '@storybook/react-vite';
import { withReleaseFilters } from './release-tags.js';

// Sugar starts with an empty release history; future releases come from the changelog.
const changelog = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');
const releases = Array.from(
	changelog.matchAll(/^## (\d+\.\d+\.\d+)$/gm),
	([, version]) => version!,
).reverse();

const config: StorybookConfig = {
	staticDirs: ['../public'],
	stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	experimental_indexers: (indexers = []) =>
		indexers.map((indexer) => ({
			...indexer,
			async createIndex(file, options) {
				const entries = await indexer.createIndex(file, options);
				return entries.map((entry) => ({
					...entry,
					tags: withReleaseFilters(entry.tags ?? [], releases),
				}));
			},
		})),
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-docs',
		'@storybook/addon-vitest',
		'@storybook/addon-a11y',
		'storybook-addon-tag-badges',
	],
	framework: '@storybook/react-vite',
};

export default config;
