// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { AnimatedAccessory } from '../../animation/AnimatedAccessory.js';
import { CROWN_DATA_URLS } from '../../generated/accessory-assets/crown-data-urls.js';
import { EMBEDDED_ACCESSORY_LAYERS } from '../../generated/accessory-assets/embedded-layers.js';
import { getAccessoryViewport } from '../../helpers/accessories/accessory-viewport.js';
import { resolveAccessoryAnimationPart } from '../../helpers/animation/accessory-animation-part.js';
import { isKitAccessory } from '../../helpers/kits/kit-accessory.js';
import type { AccessoryRendererProps } from '../../types/accessory.type.js';
import { KitArtwork } from './KitArtwork.js';
import { SvgAccessory } from './SvgAccessory.js';
import { SvgArtwork } from './SvgArtwork.js';

export function EmbeddedAccessory(props: AccessoryRendererProps) {
	const { accessory, species, layer } = props;
	const { name, category, renderOptions } = accessory;
	const layers = Object.hasOwn(EMBEDDED_ACCESSORY_LAYERS, name)
		? EMBEDDED_ACCESSORY_LAYERS[name]
		: undefined;
	const source = layers?.[layer ?? 'default'] ?? layers?.['default'];
	const crownDataUrl =
		category === 'crowns' && Object.hasOwn(CROWN_DATA_URLS, name)
			? CROWN_DATA_URLS[name]
			: undefined;
	const assetSrc = renderOptions.assetSrc ?? crownDataUrl;
	const fallbackPart = resolveAccessoryAnimationPart(props);

	if (isKitAccessory(name)) {
		return <KitArtwork {...props} fallbackPart={fallbackPart} />;
	}
	if ((assetSrc == null || assetSrc === '') && source != null && source !== '') {
		return (
			<SvgArtwork viewport={renderOptions.viewport} source={source} fallbackPart={fallbackPart} />
		);
	}
	if (assetSrc == null || assetSrc === '') {
		return null;
	}
	return (
		<AnimatedAccessory fallbackPart={fallbackPart}>
			<SvgAccessory
				assetSrc={assetSrc}
				viewport={getAccessoryViewport(accessory)}
				species={species}
				placement={renderOptions.placement}
			/>
		</AnimatedAccessory>
	);
}
