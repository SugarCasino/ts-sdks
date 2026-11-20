// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { DEFAULT_VIEWPORT, SUIFREN_CANVAS_SIZE } from '../../constants/viewport.js';
import type { AccessoryPlacement, SvgAccessoryProps } from '../../types/accessory.type.js';
import { resolveEmbeddedSvgSymbolSource } from '../../utils/svg-symbol-data-url.js';

const DEFAULT_ORIGIN = SUIFREN_CANVAS_SIZE / 2;
const SCALE_EPSILON = 0.0001;

function buildPlacementTransform(placement?: AccessoryPlacement): string | undefined {
	if (!placement) {
		return undefined;
	}

	const transforms: Array<string> = [];
	const {
		x = 0,
		y = 0,
		rotation = 0,
		scale = 1,
		originX = DEFAULT_ORIGIN,
		originY = DEFAULT_ORIGIN,
	} = placement;

	if (x !== 0 || y !== 0) {
		transforms.push(`translate(${x} ${y})`);
	}
	if (rotation !== 0) {
		transforms.push(`rotate(${rotation} ${originX} ${originY})`);
	}
	if (Math.abs(scale - 1) > SCALE_EPSILON) {
		transforms.push(
			`translate(${originX} ${originY})`,
			`scale(${scale})`,
			`translate(${-originX} ${-originY})`,
		);
	}

	return transforms.length > 0 ? transforms.join(' ') : undefined;
}

export function SvgAccessory({
	assetSrc,
	symbolId = '',
	species,
	placement,
	viewport: { x, y, width, height } = DEFAULT_VIEWPORT,
}: SvgAccessoryProps) {
	const resolvedPlacement = placement?.[species];
	const transform = buildPlacementTransform(resolvedPlacement);
	const embeddedSymbolSrc = useMemo(
		() => (symbolId ? resolveEmbeddedSvgSymbolSource(assetSrc, symbolId) : undefined),
		[assetSrc, symbolId],
	);
	const imageSrc = embeddedSymbolSrc ?? (symbolId ? '' : assetSrc);
	const fragmentSrc = symbolId && embeddedSymbolSrc == null ? `${assetSrc}#${symbolId}` : '';

	return (
		<g transform={transform}>
			{imageSrc ? (
				<image
					href={imageSrc}
					x={x}
					y={y}
					width={width}
					height={height}
					preserveAspectRatio="xMidYMid meet"
				/>
			) : fragmentSrc ? (
				<use href={fragmentSrc} x={x} y={y} width={width} height={height} />
			) : null}
		</g>
	);
}
