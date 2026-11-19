// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { AccessorySlots, SuiFrenAccessory } from '../../types/accessory.type.js';
import type { AnimationConfig } from '../../types/animation.type.js';

// Wings straddle the body. Individual shoes take precedence over a paired accessory.
export function getAccessoryLayers(
	accessories: AccessorySlots,
): Record<'wings' | 'back' | 'feet', SuiFrenAccessory | undefined> {
	const back = accessories['back'];
	const hasWings = back?.category === 'wings';
	return {
		wings: hasWings ? back : undefined,
		back: hasWings ? undefined : back,
		feet: accessories['rightFeet'] || accessories['leftFeet'] ? undefined : accessories['feet'],
	};
}

export function shouldRenderMicrophoneArmInForeground(
	animation: AnimationConfig | null,
	accessoriesByType?: AccessorySlots,
): boolean {
	const objectAccessory = accessoriesByType?.['object'];
	if (
		objectAccessory?.renderOptions.foreground === true &&
		objectAccessory.renderOptions.animationPart === 'leftArm'
	) {
		return true;
	}
	if (objectAccessory?.name !== 'microphone' || !animation) {
		return false;
	}

	if ('preset' in animation) {
		return animation.preset === 'talkMicrophone';
	}

	return animation.sequence.name === 'talkMicrophone';
}
