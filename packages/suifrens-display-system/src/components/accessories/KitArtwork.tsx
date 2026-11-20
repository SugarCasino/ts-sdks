// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { useId } from 'react';
import {
	PATTERN_SLOT_PATTERN,
	SVG_WRAPPER_PATTERN,
	TEMPLATE_VARIABLE_PATTERN,
	UNSAFE_ID_CHARACTER_PATTERN,
} from '../../constants/patterns.js';
import { KIT_TEMPLATES } from '../../generated/accessory-assets/kit-templates.js';
import { resolveRunnerKit, RUNNER_ACCESSORY_NAMES } from '../../helpers/kits/runner-kit.js';
import { contrastColor, resolveSoccerTeamKit } from '../../helpers/kits/soccer-team-kit.js';
import type { AccessoryRendererProps } from '../../types/accessory.type.js';
import type { AnimationPart } from '../../types/animation.type.js';
import type { SoccerTeamKit } from '../../types/soccer-kit.type.js';
import { SvgArtwork } from './SvgArtwork.js';

function applyValues(source: string, values: Record<string, string | number>): string {
	// Only validated colors, codes, numbers and internal SVG transforms are substituted.
	return source.replaceAll(TEMPLATE_VARIABLE_PATTERN, (_, key: string) => String(values[key]));
}

function renderSoccerArtwork(source: string, kit: SoccerTeamKit, id: string): string {
	const code = kit.code === 'GLOBAL' ? 'GLO' : kit.code;
	const patterns = KIT_TEMPLATES['patterns/' + kit.pattern];
	source = source.replaceAll(PATTERN_SLOT_PATTERN, (_, slot: string) => {
		const pattern = patterns?.[slot];
		if (pattern == null || pattern === '') {
			throw new Error(`Missing SVG pattern ${kit.pattern}/${slot}`);
		}
		return pattern.trim().replace(SVG_WRAPPER_PATTERN, '');
	});
	return applyValues(source, {
		id,
		...kit,
		label: code,
		fontSize: (code.length > 2 ? 28 : 35) * 1.24,
		textLength: 56 * 1.24 * (code.length > 2 ? 0.74 : 0.68),
		primaryContrast: contrastColor(kit.primary),
		secondaryContrast: contrastColor(kit.secondary),
	});
}

export function KitArtwork({
	accessory: { name, renderOptions },
	species,
	layer,
	fallbackPart,
}: AccessoryRendererProps & { fallbackPart?: AnimationPart | undefined }) {
	const id = useId().replaceAll(
		UNSAFE_ID_CHARACTER_PATTERN,
		(c) => '-' + c.codePointAt(0)!.toString(16) + '-',
	);
	const layers = KIT_TEMPLATES[name];
	if (!layers) {
		return null;
	}
	let source = layers[layer ?? 'default'] ?? layers['default'];
	if (source == null) {
		return null;
	}
	const options = renderOptions.kit;
	if (RUNNER_ACCESSORY_NAMES.has(name)) {
		const kit = resolveRunnerKit(options?.type === 'runner' ? options : undefined);
		source = applyValues(layers[species] ?? source, {
			id,
			color: kit.color,
			number: kit.number,
			bibTransform: kit.mirrorBib ? 'translate(393 0) scale(-1 1)' : '',
		});
	} else {
		const soccer = options?.type === 'soccer' ? options : undefined;
		source = renderSoccerArtwork(
			source,
			resolveSoccerTeamKit(soccer?.team ?? soccer?.country, soccer?.side),
			id,
		);
	}
	return (
		<SvgArtwork viewport={renderOptions.viewport} source={source} fallbackPart={fallbackPart} />
	);
}
