// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { build } from 'vite';
import { test } from 'vitest';

test('an application importing only /embed emits no external SVG assets', async () => {
	const result = await build({
		configFile: false,
		logLevel: 'silent',
		build: {
			assetsInlineLimit: 0,
			write: false,
			rolldownOptions: {
				input: '@sugarcasino/suifrens-display-system/embed',
				preserveEntrySignatures: 'strict',
			},
		},
	});
	assert.ok('output' in result);
	const outputs = result.output;
	assert.ok(
		outputs
			.filter((file) => file.type === 'chunk')
			.flatMap((file) => file.exports)
			.includes('SuiFrenImage'),
	);
	assert.deepEqual(
		outputs.filter((file) => file.fileName.endsWith('.svg')).map((file) => file.fileName),
		[],
	);
});
