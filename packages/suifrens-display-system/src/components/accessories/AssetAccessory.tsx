// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { AnimatedAccessory } from '../../animation/AnimatedAccessory.js';
import {
	ACCESSORY_ASSET_MANIFEST,
	SPLIT_LIMB_ASSET_NAMES,
} from '../../generated/accessory-assets/manifest.js';
import { getAccessoryViewport } from '../../helpers/accessories/accessory-viewport.js';
import { getVipCrownAssetSrc } from '../../helpers/accessories/vip-crown-assets.js';
import { resolveAccessoryAnimationPart } from '../../helpers/animation/accessory-animation-part.js';
import { isKitAccessory } from '../../helpers/kits/kit-accessory.js';
import type { AccessoryAssetVariant, AccessoryRendererProps } from '../../types/accessory.type.js';
import { KitArtwork } from './KitArtwork.js';
import { SvgAccessory } from './SvgAccessory.js';

function resolveAssetSrc({
	accessory: { name, category, renderOptions },
	layer,
}: AccessoryRendererProps): { assetSrc: string; symbolId?: AccessoryAssetVariant } | undefined {
	const explicitAsset =
		renderOptions.assetSrc ?? (category === 'crowns' ? getVipCrownAssetSrc(name) : undefined);
	if (explicitAsset != null && explicitAsset !== '') {
		return { assetSrc: explicitAsset };
	}

	const assets: Readonly<Record<string, string>> = ACCESSORY_ASSET_MANIFEST;
	const assetSrc = assets[name];
	return assetSrc != null && assetSrc !== ''
		? { assetSrc, symbolId: layer ?? 'default' }
		: undefined;
}

export function AssetAccessory(props: AccessoryRendererProps) {
	const { accessory, species, layer } = props;
	const {
		name,
		type,
		renderOptions: { placement },
	} = accessory;

	if (isKitAccessory(name)) {
		return <KitArtwork {...props} fallbackPart={resolveAccessoryAnimationPart(props)} />;
	}

	const viewport = getAccessoryViewport(accessory);
	const asset = resolveAssetSrc(props);
	if (!asset) {
		return null;
	}

	const { assetSrc, symbolId } = asset;
	if (
		symbolId &&
		SPLIT_LIMB_ASSET_NAMES.has(name) &&
		(type === 'feet' || (type === 'legs' && layer !== 'body'))
	) {
		return (
			<>
				{(['rightLeg', 'leftLeg'] as const).map((part) => (
					<AnimatedAccessory key={part} fallbackPart={part}>
						<SvgAccessory
							assetSrc={assetSrc}
							symbolId={part}
							viewport={viewport}
							species={species}
							placement={placement}
						/>
					</AnimatedAccessory>
				))}
			</>
		);
	}

	const fallbackPart = resolveAccessoryAnimationPart(props);

	return (
		<AnimatedAccessory fallbackPart={fallbackPart}>
			<SvgAccessory
				assetSrc={assetSrc}
				symbolId={symbolId}
				viewport={viewport}
				species={species}
				placement={placement}
			/>
		</AnimatedAccessory>
	);
}
