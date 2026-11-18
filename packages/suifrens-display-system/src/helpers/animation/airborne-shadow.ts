// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { PartPose } from '../../types/animation.type.js';

// Pose translations use negative y above ground. Keep a faint footprint at large heights.
export function airborneShadowStyle(pose?: PartPose) {
	const height = Math.max(0, -(pose?.translate?.y ?? 0));
	const scale = Math.max(0.4, 1 - height / 100);
	return { transform: `scale(${scale})`, opacity: scale * scale };
}
