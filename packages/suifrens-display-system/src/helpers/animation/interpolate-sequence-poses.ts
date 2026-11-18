// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type {
	AnimationPart,
	AnimationSequence,
	AnimationTrack,
	PartPose,
} from '../../types/animation.type.js';
import { getEasing } from '../../utils/easing.js';
import { interpolatePartPose } from './interpolate-part-pose.js';

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
