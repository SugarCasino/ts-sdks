// Adapted by Sugar from the SuiFrens Display System by Mysten Labs.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import type { AccessorySlots, SuiFrenAccessory } from '../types/accessory.type.js';

export const EMPTY_ACCESSORY_SLOTS: Readonly<AccessorySlots> = Object.freeze({});

function getAccessorySlotKey({ type, renderOptions }: SuiFrenAccessory): string {
	if (type === 'feet') {
		const { animationPart } = renderOptions;
		if (animationPart === 'leftLeg') {
			return 'leftFeet';
		}
		if (animationPart === 'rightLeg') {
			return 'rightFeet';
		}
	}

	return type;
}

export function getAccessoriesByType<T extends SuiFrenAccessory>(
	accessories: ReadonlyArray<T>,
): AccessorySlots<T> {
	return accessories.reduce<AccessorySlots<T>>(
		(accumulator, accessory) => {
			accumulator[getAccessorySlotKey(accessory)] = accessory;
			return accumulator;
		},
		// oxlint-disable-next-line typescript/no-unsafe-argument -- Object.create(null) is the intentional reduce seed.
		Object.create(null),
	);
}
