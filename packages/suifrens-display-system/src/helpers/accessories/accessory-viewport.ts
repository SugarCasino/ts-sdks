// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { SUIFREN_CANVAS_SIZE } from '../../constants/viewport.js';
import { VIP_CROWN_ACCESSORY_NAMES } from '../../constants/vip-crowns.js';
import type { AccessoryViewport, SuiFrenAccessory } from '../../types/accessory.type.js';

// The authored crown paths extend above and left of their original 3009px artboard.
// Match the padded SVG viewport at the original 3000 / 3009 rendering scale.
const viewBox = { x: -200, y: -600, width: 3209, height: 3609 };
const ORIGINAL_CROWN_ARTBOARD_SIZE = 3009;
const CROWN_SCALE = SUIFREN_CANVAS_SIZE / ORIGINAL_CROWN_ARTBOARD_SIZE;
const VIP_CROWN_IMAGE_VIEWPORT = {
	x: viewBox.x * CROWN_SCALE,
	y: viewBox.y * CROWN_SCALE,
	width: viewBox.width * CROWN_SCALE,
	height: viewBox.height * CROWN_SCALE,
};

export function getAccessoryViewport({
	renderOptions: { viewport },
	category,
	name,
}: SuiFrenAccessory): AccessoryViewport | undefined {
	if (viewport != null) {
		return viewport;
	}
	return category === 'crowns' && VIP_CROWN_ACCESSORY_NAMES.some((crown) => crown === name)
		? VIP_CROWN_IMAGE_VIEWPORT
		: undefined;
}
