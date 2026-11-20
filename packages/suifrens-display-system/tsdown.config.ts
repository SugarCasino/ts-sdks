// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig } from 'tsdown';

const URL_QUERY_SUFFIX = '?url';
const SVG_URL_PATTERN = new RegExp(`\\.svg${RegExp.escape(URL_QUERY_SUFFIX)}$`, 'u');

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		embed: 'src/embed.tsx',
		accessories: 'src/accessories/index.ts',
		colors: 'src/colors.ts',
		attributes: 'src/attributes.ts',
		animation: 'src/animation/index.ts',
		battle: 'src/battle.ts',
		expressions: 'src/expressions.ts',
		kits: 'src/kits.ts',
	},
	format: 'esm',
	unbundle: true,
	dts: true,
	loader: { '.svg': 'text' },
	plugins: [
		{
			name: 'external-svg-urls',
			load: {
				filter: { id: SVG_URL_PATTERN },
				async handler(id) {
					const path = id.slice(0, -URL_QUERY_SUFFIX.length);
					const referenceId = this.emitFile({
						type: 'asset',
						name: basename(path),
						source: await readFile(path),
					});
					// Rolldown replaces this emitted-file reference with its final URL at build time.
					// https://rolldown.rs/apis/plugin-api/file-urls
					return `export default import.meta.ROLLDOWN_FILE_URL_${referenceId};`;
				},
			},
		},
	],
});
