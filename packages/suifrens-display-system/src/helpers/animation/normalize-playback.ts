// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { NormalizedPlayback, PlaybackOptions } from '../../types/animation.type.js';

export function normalizePlayback(playback?: PlaybackOptions): NormalizedPlayback {
	const speed = playback?.speed ?? 1;
	return {
		iterations:
			playback?.iterations === 'infinite' ? Infinity : Math.max(1, playback?.iterations ?? 1),
		alternate: Boolean(playback?.alternate),
		speed: speed > 0 ? speed : 1,
	};
}
