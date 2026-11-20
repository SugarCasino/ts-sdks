// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { airborneShadowStyle } from '../helpers/animation/airborne-shadow.js';
import { composePartTransform } from '../helpers/animation/compose-part-transform.js';
import { normalizePlayback } from '../helpers/animation/normalize-playback.js';
import {
	interpolatePose,
	interpolateSequencePoses,
} from '../helpers/animation/pose-interpolation.js';
import type {
	AnimationConfig,
	AnimationSequence,
	AnimationTarget,
} from '../types/animation.type.js';
import { matrixToAnimationTransform, parseMatrix } from '../utils/matrix.js';
import type { AnimationStore } from './animation-store.js';

type BackendPreference = 'auto' | 'waapi' | 'fallback';

type WaapiTarget = AnimationTarget & {
	element: SVGGraphicsElement;
};

type WaapiStartResult =
	| {
			handled: true;
			cleanup: () => void;
			pause: () => void;
			play: () => void;
	  }
	| {
			handled: false;
	  };

const SAMPLE_INTERVAL_MS = 1000 / 30;

declare global {
	var __SUIFREN_ANIMATION_BACKEND__: BackendPreference | undefined;
}

function resolveBackendPreference(): BackendPreference {
	return globalThis.__SUIFREN_ANIMATION_BACKEND__ ?? 'auto';
}

function supportsSvgWaapi(): boolean {
	return (
		typeof SVGElement !== 'undefined' &&
		typeof Element !== 'undefined' &&
		typeof Element.prototype.animate === 'function'
	);
}

function getTargets(store: AnimationStore, sequence: AnimationSequence): Array<WaapiTarget> {
	const animatedParts = new Set(sequence.tracks.map((track) => track.part));
	return store
		.getAnimationTargetsForParts(animatedParts)
		.filter((target): target is WaapiTarget => Boolean(target.element));
}

function playbackDirection(
	direction: AnimationConfig['direction'],
	alternate: boolean,
): PlaybackDirection {
	if (direction === 'reverse') {
		return alternate ? 'alternate-reverse' : 'reverse';
	}
	return alternate ? 'alternate' : 'normal';
}

function buildOffsets({ duration, tracks }: AnimationSequence): Array<number> {
	const offsets = new Set<number>([0, duration]);
	for (let time = SAMPLE_INTERVAL_MS; time < duration; time += SAMPLE_INTERVAL_MS) {
		offsets.add(Math.min(duration, time));
	}
	for (const track of tracks) {
		for (const frame of track.keyframes) {
			offsets.add(Math.min(Math.max(frame.at, 0), duration));
		}
	}
	return Array.from(offsets).toSorted((a, b) => a - b);
}

function buildTargetKeyframes(
	{ part, baseTransform, pivotOverride }: WaapiTarget,
	sequence: AnimationSequence,
	offsets: Array<number>,
): Array<Keyframe> {
	const duration = Math.max(sequence.duration, 1);
	return offsets.map((time) => ({
		offset: time / duration,
		transform: matrixToAnimationTransform(
			parseMatrix(
				composePartTransform(
					part,
					baseTransform,
					interpolateSequencePoses(sequence, time),
					pivotOverride,
				),
			)!,
		),
		easing: 'linear',
	}));
}

const SEQUENCE_KEYFRAME_CACHE = new WeakMap<AnimationSequence, Map<string, Array<Keyframe>>>();

function getTargetKeyframes(
	target: WaapiTarget,
	sequence: AnimationSequence,
	offsets: Array<number>,
): Array<Keyframe> {
	let cache = SEQUENCE_KEYFRAME_CACHE.get(sequence);
	if (!cache) {
		cache = new Map();
		SEQUENCE_KEYFRAME_CACHE.set(sequence, cache);
	}
	const { part, baseTransform, pivotOverride: pivot } = target;
	const key = `${part}|${baseTransform ?? ''}|${pivot?.x ?? ''}|${pivot?.y ?? ''}`;
	const cached = cache.get(key);
	if (cached) {
		return cached;
	}
	const keyframes = buildTargetKeyframes(target, sequence, offsets);
	cache.set(key, keyframes);
	return keyframes;
}

function setBaseTransforms(targets: Array<WaapiTarget>): void {
	for (const { element, baseTransform } of targets) {
		if (baseTransform != null && baseTransform !== '') {
			element.setAttribute('transform', baseTransform);
		} else {
			element.removeAttribute('transform');
		}
	}
}

export function startWaapiAnimation(
	store: AnimationStore,
	config: AnimationConfig | null,
): WaapiStartResult {
	const preference = resolveBackendPreference();
	if (preference === 'fallback') {
		return { handled: false };
	}

	if (!config) {
		store.clear();
		return {
			handled: true,
			cleanup: () => {},
			pause: () => {},
			play: () => {},
		};
	}

	if (!('sequence' in config)) {
		return { handled: false };
	}

	if (!supportsSvgWaapi()) {
		return preference === 'waapi'
			? {
					handled: true,
					cleanup: () => {},
					pause: () => {},
					play: () => {},
				}
			: { handled: false };
	}

	const playState = config.playState ?? 'running';
	const targets = getTargets(store, config.sequence);

	if (playState === 'idle' || playState === 'stopped') {
		store.clear();
		setBaseTransforms(targets);
		return {
			handled: true,
			cleanup: () => {},
			pause: () => {},
			play: () => {},
		};
	}

	if (targets.length === 0) {
		return { handled: false };
	}

	const sequence = config.sequence;
	if (sequence.duration <= 0) {
		return { handled: false };
	}

	store.clear();
	setBaseTransforms(targets);

	const offsets = buildOffsets(sequence);
	const { speed, iterations, alternate } = normalizePlayback(config.playback);
	const duration = sequence.duration / speed;
	const direction = playbackDirection(config.direction, alternate);
	const effects = targets.map((target) => ({
		element: target.element,
		frames: getTargetKeyframes(target, sequence, offsets),
	}));
	const shadows = store.getAirborneShadows();
	const bodyTrack = sequence.tracks.findLast((track) => track.part === 'body');
	if (shadows.size > 0 && bodyTrack) {
		const frames = offsets.map((time) => ({
			offset: time / sequence.duration,
			...airborneShadowStyle(interpolatePose(bodyTrack, time)),
		}));
		for (const element of shadows) {
			effects.push({ element, frames });
		}
	}

	const animations = effects.map(({ element, frames }) => {
		const animation = element.animate(frames, {
			duration,
			iterations,
			direction,
			easing: 'linear',
			fill: config.holdOnComplete === true ? 'forwards' : 'none',
		});

		if (config.startAt === 'end') {
			animation.currentTime = duration;
		}
		if (playState === 'paused') {
			animation.pause();
		}

		if (config.holdOnComplete !== true) {
			animation.finished
				.then(() => {
					animation.cancel();
				})
				.catch(() => {});
		}

		return animation;
	});

	return {
		handled: true,
		pause: () => {
			for (const animation of animations) {
				animation.pause();
			}
		},
		play: () => {
			if (playState !== 'running') {
				return;
			}
			for (const animation of animations) {
				if (animation.currentTime != null) {
					animation.play();
				}
			}
		},
		cleanup: () => {
			for (const animation of animations) {
				animation.cancel();
			}
			setBaseTransforms(targets);
		},
	};
}
