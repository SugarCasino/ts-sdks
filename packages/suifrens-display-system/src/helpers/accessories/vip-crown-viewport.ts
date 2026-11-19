// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

// The authored crown paths extend above and left of their original 3009px artboard.
// Match the padded SVG viewport at the original 3000 / 3009 rendering scale.
const CROWN_SCALE = 3000 / 3009;
export const VIP_CROWN_IMAGE_VIEWPORT = {
	x: -200 * CROWN_SCALE,
	y: -600 * CROWN_SCALE,
	width: 3209 * CROWN_SCALE,
	height: 3609 * CROWN_SCALE,
};

// Only the external renderer supplies asset URLs. The embedded entry can recognize an
// explicit reference from that renderer without importing its SVG files.
const externalCrownUrls = new Set<string>();

export function registerVipCrownAssetUrls(urls: Array<string>) {
	for (const url of urls) {
		externalCrownUrls.add(url);
	}
}

export function getVipCrownAssetViewport(
	assetSrc: string,
): typeof VIP_CROWN_IMAGE_VIEWPORT | undefined {
	return externalCrownUrls.has(assetSrc) ? VIP_CROWN_IMAGE_VIEWPORT : undefined;
}
