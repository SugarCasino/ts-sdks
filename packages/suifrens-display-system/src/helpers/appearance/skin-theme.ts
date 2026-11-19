// Adapted by Sugar from the SuiFrens Display System by Mysten Labs.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import type { SuiFrenSkin } from '../../types/appearance.type.js';
import type { BullsharkTheme } from '../../types/bullshark.type.js';
import type { CapyTheme } from '../../types/capy.type.js';
import { assertUnreachable } from '../../utils/assert-unreachable.js';

function getSkinColors(skin: SuiFrenSkin, mainColor: string, secondaryColor: string) {
	switch (skin) {
		case 'basic':
		case 'cheetah':
		case 'fox':
		case 'stripes':
		case 'dalmation':
		case 'lizard':
		case 'snake':
			return { head: mainColor, body: mainColor, patterns: secondaryColor };
		case 'panda':
			return { head: secondaryColor, body: secondaryColor, patterns: mainColor };
		default:
			return assertUnreachable(skin);
	}
}

export function getCapyTheme(
	skin: SuiFrenSkin,
	mainColor: string,
	secondaryColor: string,
	incognito: boolean,
): CapyTheme {
	const extremityColor = incognito ? '#ffffff' : '#4e4943';
	return {
		...getSkinColors(skin, mainColor, secondaryColor),
		legs: mainColor,
		arms: mainColor,
		outerEars: mainColor,
		innerEars: secondaryColor,
		nose: extremityColor,
		appendages: extremityColor,
	};
}

export function getBullsharkTheme(
	skin: SuiFrenSkin,
	mainColor: string,
	secondaryColor: string,
): BullsharkTheme {
	return {
		...getSkinColors(skin, mainColor, secondaryColor),
		legs: mainColor,
		hands: mainColor,
		fin: mainColor,
		tail: mainColor,
	};
}
