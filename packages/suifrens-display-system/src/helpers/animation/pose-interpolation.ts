// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type {
	AnimationPart,
	AnimationSequence,
	AnimationTrack,
	PartPose,
} from '../../types/animation.type.js';
import { getEasing } from '../../utils/easing.js';

function blendScaleAxis(start: number, end: number, eased: number): number {
	if (start * end < 0) {
		return eased < 0.5 ? start : end;
	}
	return start + (end - start) * eased;
}

export function interpolatePartPose(
	from: PartPose | undefined,
	to: PartPose | undefined,
	eased: number,
): PartPose | undefined {
	const hasRotate = from?.rotate != null || to?.rotate != null;
	const hasTranslate = Boolean(from?.translate ?? to?.translate);
	const hasScale = Boolean(from?.scale ?? to?.scale);

	if (!hasRotate && !hasTranslate && !hasScale) {
		return undefined;
	}

	const pose: PartPose = {};

	if (hasRotate) {
		const start = from?.rotate ?? 0;
		const end = to?.rotate ?? 0;
		pose.rotate = start + (end - start) * eased;
	}

	if (hasTranslate) {
		const start = from?.translate ?? { x: 0, y: 0 };
		const end = to?.translate ?? { x: 0, y: 0 };
		pose.translate = {
			x: start.x + (end.x - start.x) * eased,
			y: start.y + (end.y - start.y) * eased,
		};
	}

	if (hasScale) {
		const start = from?.scale ?? { x: 1, y: 1 };
		const end = to?.scale ?? { x: 1, y: 1 };
		const startX = start.x ?? 1;
		const startY = start.y ?? 1;
		const endX = end.x ?? 1;
		const endY = end.y ?? 1;
		pose.scale = {
			x: blendScaleAxis(startX, endX, eased),
			y: blendScaleAxis(startY, endY, eased),
		};
	}

	return pose;
}

export function interpolatePose(track: AnimationTrack, time: number): PartPose | undefined {
	if (track.keyframes.length === 0) {
		return undefined;
	}

	const duration = track.keyframes.at(-1)?.at ?? 0;
	if (duration <= 0) {
		return track.keyframes.at(-1)?.pose;
	}

	let previous = track.keyframes[0];
	let next = track.keyframes.at(-1);

	for (const frame of track.keyframes) {
		if (frame.at <= time) {
			previous = frame;
		}
		if (frame.at >= time) {
			next = frame;
			break;
		}
	}

	if (!previous || !next) {
		return undefined;
	}

	if (next.at === previous.at) {
		return next.pose;
	}

	const localProgress = (time - previous.at) / (next.at - previous.at);
	const easing = getEasing(next.ease ?? previous.ease);
	const eased = easing(Math.min(Math.max(localProgress, 0), 1));

	return interpolatePartPose(previous.pose, next.pose, eased) ?? {};
}

export function interpolateSequencePoses(
	sequence: AnimationSequence,
	time: number,
): Map<AnimationPart, PartPose> {
	const poses = new Map<AnimationPart, PartPose>();
	const effectiveTime = Math.min(Math.max(time, 0), sequence.duration);

	for (const track of sequence.tracks) {
		const pose = interpolatePose(track, effectiveTime);
		if (pose) {
			poses.set(track.part, pose);
		}
	}

	return poses;
}
