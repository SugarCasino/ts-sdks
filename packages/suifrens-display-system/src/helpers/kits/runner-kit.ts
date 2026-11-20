// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { HEX_COLOR_PATTERN } from '../../constants/patterns.js';
import type { AccessoryMetadata } from '../../types/accessory.type.js';
import type { RunnerKitOptions } from '../../types/runner-kit.type.js';

export const RUNNER_ACCESSORY_NAMES = new Set([
	'runner singlet',
	'runner shorts',
	'runner headband',
	'runner shoes',
]);

export function resolveRunnerKit(value: unknown): Required<RunnerKitOptions> {
	const {
		color,
		number: bibNumber,
		mirrorBib,
	} = value != null && typeof value === 'object' ? (value as RunnerKitOptions) : {};
	return {
		color: typeof color === 'string' && HEX_COLOR_PATTERN.test(color) ? color : '#ef8fae',
		number:
			typeof bibNumber === 'number' &&
			Number.isInteger(bibNumber) &&
			bibNumber >= 1 &&
			bibNumber <= 99
				? bibNumber
				: 1,
		mirrorBib: mirrorBib === true,
	};
}
export function buildRunnerAccessories(options: RunnerKitOptions = {}): Array<AccessoryMetadata> {
	const kit = { type: 'runner', ...resolveRunnerKit(options) } as const;
	return [...RUNNER_ACCESSORY_NAMES].map((name) => ({
		name,
		type:
			name === 'runner singlet'
				? 'torso'
				: name === 'runner shorts'
					? 'legs'
					: name === 'runner headband'
						? 'head'
						: 'feet',
		category: 'runner',
		collection: 'runner',
		description: 'Athletics kit with native animated limb registration.',
		price: 0,
		quantity: null,
		renderOptions: { kit, showEars: true, showFin: true },
	}));
}
