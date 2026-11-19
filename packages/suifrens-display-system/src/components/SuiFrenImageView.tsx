// Original character renderer by Mysten Labs. Sugar adapted it and added gesture support.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { AnimationProvider } from '../animation/AnimationContext.js';
import { shouldRenderMicrophoneArmInForeground } from '../helpers/accessories/foreground-layering.js';
import type { AccessoryRenderer } from '../types/accessory.type.js';
import type { SpeciesImageProps, SuiFrenImageProps } from '../types/suifren.type.js';
import { getAccessoriesByType } from '../utils/accessories.js';
import { assertUnreachable } from '../utils/assert-unreachable.js';
import { AccessoryRendererProvider } from './accessories/AccessorySlot.js';
import { BullsharkImage } from './bullshark/BullsharkImage.js';
import { CapyImage } from './capy/CapyImage.js';
import { AnimatedGroundShadow, StandingGroundShadow } from './GroundShadow.js';

function SpeciesImage({ attributes, ...props }: SpeciesImageProps) {
	if ('finStyle' in attributes) {
		return <BullsharkImage attributes={attributes} {...props} />;
	}
	if ('earShape' in attributes) {
		return <CapyImage attributes={attributes} {...props} />;
	}
	return assertUnreachable(attributes);
}

export function SuiFrenImageView({
	accessoryRenderer,
	attributes,
	gesture,
	accessories,
	detail = 'full',
	renderSize,
	incognito = false,
	shadow = false,
	logo,
	className,
	style,
	animation = null,
}: SuiFrenImageProps & { accessoryRenderer: AccessoryRenderer }) {
	const accessoriesByType = useMemo(
		() => (accessories ? getAccessoriesByType(accessories) : undefined),
		[accessories],
	);

	const renderMicrophoneArmInForeground = shouldRenderMicrophoneArmInForeground(
		animation,
		accessoriesByType,
	);

	const resolvedSize =
		typeof renderSize === 'number' ? { width: renderSize, height: renderSize } : renderSize;
	const renderedContent = (
		<AccessoryRendererProvider renderer={accessoryRenderer}>
			<SpeciesImage
				attributes={attributes}
				detail={detail}
				gesture={gesture}
				incognito={incognito}
				{...(accessoriesByType && { accessoriesByType })}
				renderMicrophoneArmInForeground={renderMicrophoneArmInForeground}
			/>
		</AccessoryRendererProvider>
	);

	return (
		<svg
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			x="0px"
			y="0px"
			width={resolvedSize?.width}
			height={resolvedSize?.height}
			viewBox="0 -200 3000 3000"
			overflow={accessoriesByType?.['head']?.category === 'crowns' ? 'visible' : undefined}
			className={['suifren-image', className].filter(Boolean).join(' ')}
			style={style}
		>
			{shadow && !animation && <StandingGroundShadow />}
			{animation ? (
				<AnimationProvider
					key={'finStyle' in attributes ? 'bullshark' : 'capy'}
					animation={animation}
				>
					<AnimatedGroundShadow visible={shadow} />
					{renderedContent}
				</AnimationProvider>
			) : (
				renderedContent
			)}
			{logo}
		</svg>
	);
}
