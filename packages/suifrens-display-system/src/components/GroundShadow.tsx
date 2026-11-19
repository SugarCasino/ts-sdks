// Original character renderer by Mysten Labs. Sugar adapted it and added gesture support.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from 'react';
import { AnimatedAccessory } from '../animation/AnimatedAccessory.js';
import { useAnimationShadow, useAnimationStore } from '../animation/AnimationContext.js';

export function StandingGroundShadow() {
	return <ellipse opacity={0.3} cx="1400.4" cy="2615.2" rx="472.8" ry="130.6" />;
}

function AirborneGroundShadow({ visible }: { visible: boolean }) {
	const store = useAnimationStore();
	const ref = useRef<SVGGElement>(null);
	useEffect(() => {
		if (!ref.current || !store) {
			return;
		}
		return store.registerAirborneShadow(ref.current);
	}, [store]);

	return (
		<g transform="translate(1400.4 2615.2)">
			<g ref={ref}>{visible && <ellipse opacity={0.3} rx="472.8" ry="130.6" />}</g>
		</g>
	);
}

export function AnimatedGroundShadow({ visible }: { visible: boolean }) {
	const shadow = useAnimationShadow();
	if (shadow === 'airborne') {
		return <AirborneGroundShadow visible={visible} />;
	}
	if (shadow === 'static') {
		return visible ? <StandingGroundShadow /> : null;
	}

	// Project the rotating silhouette's footprint onto the ground plane.
	// At rest this has the same center and radii as the standing shadow.
	return (
		<g transform="translate(0 2435.2) scale(1 0.12)">
			<AnimatedAccessory fallbackPart="body">
				<g>
					{visible && <ellipse opacity={0.3} cx="1400.4" cy="1500" rx="472.8" ry={130.6 / 0.12} />}
				</g>
			</AnimatedAccessory>
		</g>
	);
}
