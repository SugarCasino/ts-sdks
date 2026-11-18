// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { airborneShadowStyle } from '../helpers/animation/airborne-shadow.js';
import { composePartTransform } from '../helpers/animation/compose-part-transform.js';
import { getPartDefinition } from '../helpers/animation/parts.js';
import type {
	AnimationPart,
	AnimationRegistration,
	AnimationTarget,
	PartPose,
} from '../types/animation.type.js';

type ElementRegistration = {
	references: number;
	unregister: () => void;
};

const ZERO_POSE: PartPose = {};

export class AnimationStore {
	public readonly usesDirectDomTransforms = true;
	private registrations = new Map<AnimationPart, Set<AnimationRegistration>>();
	private poses = new Map<AnimationPart, PartPose>();
	private elementRegistrations = new WeakMap<
		SVGGraphicsElement,
		Map<AnimationPart, ElementRegistration>
	>();

	private airborneShadows = new Set<SVGGElement>();

	registerAirborneShadow(element: SVGGElement): () => void {
		this.airborneShadows.add(element);
		this.updateAirborneShadows();
		return () => {
			this.airborneShadows.delete(element);
		};
	}

	getAirborneShadows(): ReadonlySet<SVGGElement> {
		return this.airborneShadows;
	}

	private updateAirborneShadows(): void {
		if (this.airborneShadows.size === 0) {
			return;
		}
		const { transform, opacity } = airborneShadowStyle(this.poses.get('body'));
		for (const element of this.airborneShadows) {
			element.setAttribute('transform', transform);
			element.setAttribute('opacity', String(opacity));
		}
	}

	registerElement(
		part: AnimationPart,
		element: SVGGraphicsElement,
		pivotOverride?: { x: number; y: number },
	): () => void {
		let partRegistrations = this.elementRegistrations.get(element);
		if (!partRegistrations) {
			partRegistrations = new Map();
			this.elementRegistrations.set(element, partRegistrations);
		}
		const existing = partRegistrations.get(part);
		if (existing) {
			existing.references += 1;
			return () => {
				existing.references -= 1;
				if (!existing.references) {
					existing.unregister();
					partRegistrations.delete(part);
				}
			};
		}

		const baseTransform = element.getAttribute('transform') ?? undefined;
		const unregister = this.register(part, {
			getBaseTransform: () => baseTransform,
			setTransform: (value) => {
				element.setAttribute('transform', value);
			},
			pivotOverride,
			element,
		});
		const registration = { references: 1, unregister };
		partRegistrations.set(part, registration);
		return () => {
			registration.references -= 1;
			if (!registration.references) {
				registration.unregister();
				partRegistrations.delete(part);
			}
		};
	}

	register(part: AnimationPart, registration: AnimationRegistration): () => void {
		const existing = this.registrations.get(part);
		if (existing) {
			existing.add(registration);
		} else {
			this.registrations.set(part, new Set([registration]));
		}
		const pose = this.poses.get(part) ?? ZERO_POSE;
		this.setTransform(registration, this.compose(part, registration, pose));
		return () => {
			const collection = this.registrations.get(part);
			if (!collection) {
				return;
			}
			collection.delete(registration);
			if (collection.size === 0) {
				this.registrations.delete(part);
			}
		};
	}

	setPose(part: AnimationPart, pose: PartPose | undefined): void {
		if (!pose || (pose.rotate == null && !pose.translate && !pose.scale)) {
			this.poses.delete(part);
		} else {
			this.poses.set(part, pose);
		}
		if (part === 'body') {
			this.updateAirborneShadows();
		}
		this.notifyWithDependents(part);
	}

	setPoses(poses: Map<AnimationPart, PartPose>): void {
		this.poses = new Map(poses);
		this.updateAirborneShadows();
		for (const part of this.registrations.keys()) {
			this.notify(part);
		}
	}

	clear(): void {
		if (this.poses.size === 0) {
			return;
		}
		this.poses.clear();
		this.updateAirborneShadows();
		for (const part of this.registrations.keys()) {
			this.notify(part);
		}
	}

	getRegisteredParts(): Array<AnimationPart> {
		return Array.from(this.registrations.keys());
	}

	getAnimationTargets(): Array<AnimationTarget> {
		return Array.from(this.registrations.entries()).flatMap(([part, registrations]) =>
			Array.from(registrations, (registration) => ({
				part,
				element: registration.element,
				baseTransform: registration.getBaseTransform(),
				pivotOverride: registration.pivotOverride,
			})),
		);
	}

	getAnimationTargetsForParts(parts: ReadonlySet<AnimationPart>): Array<AnimationTarget> {
		return this.getAnimationTargets().filter(({ part }) => {
			let current: AnimationPart | undefined = part;
			while (current) {
				if (parts.has(current)) {
					return true;
				}
				current = getPartDefinition(current).parent;
			}
			return false;
		});
	}

	refresh(part: AnimationPart): void {
		this.notify(part);
	}

	private notify(part: AnimationPart): void {
		const pose = this.poses.get(part) ?? ZERO_POSE;
		const registrations = this.registrations.get(part);
		if (!registrations) {
			return;
		}
		for (const registration of registrations) {
			this.setTransform(registration, this.compose(part, registration, pose));
		}
	}

	private setTransform(registration: AnimationRegistration, value: string): void {
		if (registration.lastTransform === value) {
			return;
		}
		registration.lastTransform = value;
		registration.setTransform(value);
	}

	private notifyWithDependents(part: AnimationPart): void {
		for (const registeredPart of this.registrations.keys()) {
			if (registeredPart === part || this.isDependentOn(registeredPart, part)) {
				this.notify(registeredPart);
			}
		}
	}

	private isDependentOn(part: AnimationPart, ancestor: AnimationPart): boolean {
		let current = getPartDefinition(part).parent;
		while (current) {
			if (current === ancestor) {
				return true;
			}
			current = getPartDefinition(current).parent;
		}
		return false;
	}

	private compose(
		part: AnimationPart,
		registration: AnimationRegistration,
		pose: PartPose,
	): string {
		const poses = new Map(this.poses).set(part, pose);
		return composePartTransform(
			part,
			registration.getBaseTransform(),
			poses,
			registration.pivotOverride,
		);
	}
}
