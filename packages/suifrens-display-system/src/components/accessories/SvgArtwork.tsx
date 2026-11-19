// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { AnimatedAccessory } from '../../animation/AnimatedAccessory.js';
import {
	BETWEEN_TAGS_WHITESPACE_PATTERN,
	SVG_ATTRIBUTE_PATTERN,
} from '../../constants/patterns.js';
import type { AccessoryViewport } from '../../types/accessory.type.js';
import type { AnimationPart } from '../../types/animation.type.js';

type ArtworkProps = { source: string; viewport?: AccessoryViewport | undefined };

// Preserve the authored viewBox and expose limb groups to the animation store.
function ArtworkElement({ source, viewport }: ArtworkProps) {
	const { attributes: svgAttributes, content } = useMemo(() => {
		const svg = source.trim().replace(BETWEEN_TAGS_WHITESPACE_PATTERN, '><');
		const end = svg.indexOf('>');
		const attributes: Record<string, string> = {};
		for (const [, name, value] of svg.slice(0, end).matchAll(SVG_ATTRIBUTE_PATTERN)) {
			if (name == null || name === '' || value == null) {
				continue;
			}
			attributes[name === 'xml:space' ? 'xmlSpace' : name === 'xmlns:xlink' ? 'xmlnsXlink' : name] =
				value;
		}
		return { attributes, content: { __html: svg.slice(end + 1, -'</svg>'.length) } };
	}, [source]);
	return (
		<svg
			{...svgAttributes}
			x={viewport?.x ?? svgAttributes['x']}
			y={viewport?.y ?? svgAttributes['y']}
			width={viewport?.width ?? svgAttributes['width']}
			height={viewport?.height ?? svgAttributes['height']}
			dangerouslySetInnerHTML={content}
		/>
	);
}

// A new SVG subtree needs fresh limb registrations when the outfit or its colors change.
export function SvgArtwork({
	source,
	viewport,
	fallbackPart,
}: ArtworkProps & {
	fallbackPart?: AnimationPart | undefined;
}) {
	return (
		<AnimatedAccessory key={source} fallbackPart={fallbackPart}>
			<ArtworkElement source={source} viewport={viewport} />
		</AnimatedAccessory>
	);
}
