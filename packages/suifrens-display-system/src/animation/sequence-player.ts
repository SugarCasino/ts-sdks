// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { normalizePlayback } from '../helpers/animation/normalize-playback.js';
import { interpolatePose } from '../helpers/animation/pose-interpolation.js';
import type {
	AnimationPart,
	AnimationSequence,
	NormalizedPlayback,
	PartPose,
	PlaybackOptions,
} from '../types/animation.type.js';

const EPSILON = 0.0001;

export class SequencePlayer {
	private sequence: AnimationSequence | null = null;
	private playback: NormalizedPlayback = normalizePlayback();
	private time = 0;
	private direction: 1 | -1 = 1;
	private completedIterations = 0;
	private playing = false;
	private currentPoses = new Map<AnimationPart, PartPose>();

	load(
		sequence: AnimationSequence,
		playback?: PlaybackOptions,
		options?: { direction?: 1 | -1; startAt?: 'start' | 'end' },
	): void {
		this.sequence = sequence;
		this.playback = normalizePlayback(playback);
		this.direction = options?.direction ?? 1;
		this.time =
			options?.startAt === 'end' || (this.direction === -1 && options?.startAt !== 'start')
				? sequence.duration
				: 0;
		this.completedIterations = 0;
		this.playing = false;
		this.currentPoses.clear();
		this.recalculate();
	}

	play(): void {
		if (!this.sequence) {
			return;
		}
		this.playing = true;
	}

	pause(): void {
		this.playing = false;
	}

	stop(resetTime = true): void {
		this.playing = false;
		if (resetTime && this.sequence) {
			this.time = this.direction === -1 ? this.sequence.duration : 0;
		}
		this.direction = 1;
		this.completedIterations = 0;
		this.currentPoses.clear();
	}

	isPlaying(): boolean {
		return this.playing;
	}

	hasSequence(): boolean {
		return Boolean(this.sequence);
	}

	setPlayback(playback?: PlaybackOptions): void {
		this.playback = normalizePlayback(playback);
		this.completedIterations = 0;
		this.recalculate();
	}

	setDirection(
		direction: 1 | -1,
		resetTime = false,
		position: 'start' | 'end' = direction === -1 ? 'end' : 'start',
	): void {
		if (!this.sequence) {
			return;
		}
		this.direction = direction;
		if (resetTime) {
			this.time = position === 'end' ? this.sequence.duration : 0;
			this.completedIterations = 0;
			this.recalculate();
		}
	}

	restart(position: 'start' | 'end' = this.direction === -1 ? 'end' : 'start'): void {
		if (!this.sequence) {
			return;
		}
		this.completedIterations = 0;
		this.time = position === 'end' ? this.sequence.duration : 0;
		this.currentPoses.clear();
		this.recalculate();
	}

	getDuration(): number {
		return this.sequence?.duration ?? 0;
	}

	getTime(): number {
		return this.time;
	}

	setTime(time: number): void {
		if (!this.sequence) {
			return;
		}
		this.time = Math.min(Math.max(time, 0), this.sequence.duration);
		this.recalculate();
	}

	hasActivePose(): boolean {
		return this.currentPoses.size > 0;
	}

	update(deltaMs: number): boolean {
		if (!this.sequence || !this.playing) {
			return false;
		}

		const duration = this.sequence.duration;
		if (duration <= 0) {
			return false;
		}

		const advanceBy = deltaMs * this.playback.speed;

		if (this.direction === 1) {
			this.time += advanceBy;
			if (this.time >= duration - EPSILON) {
				this.time = duration;
				this.handleIterationEnd();
			}
		} else {
			this.time -= advanceBy;
			if (this.time <= EPSILON) {
				this.time = 0;
				this.handleIterationEnd();
			}
		}

		this.recalculate();
		return true;
	}

	getCurrentPoses(): Map<AnimationPart, PartPose> {
		return this.currentPoses;
	}

	private handleIterationEnd(): void {
		this.completedIterations += 1;

		if (this.completedIterations >= this.playback.iterations) {
			this.playing = false;
			return;
		}

		if (this.playback.alternate) {
			this.direction = this.direction === 1 ? -1 : 1;
		} else if (this.sequence) {
			this.time = this.direction === 1 ? 0 : this.sequence.duration;
		} else {
			this.time = 0;
		}
	}

	private recalculate(): void {
		if (!this.sequence) {
			return;
		}

		const effectiveTime =
			this.playback.alternate && this.direction === -1
				? this.sequence.duration - this.time
				: this.time;

		this.currentPoses.clear();

		for (const track of this.sequence.tracks) {
			const pose = interpolatePose(track, effectiveTime);
			if (pose) {
				this.currentPoses.set(track.part, pose);
			}
		}
	}
}
