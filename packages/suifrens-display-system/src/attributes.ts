// Adapted by Sugar from the SuiFrens Display System by Mysten Labs.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import type { CapyEarShape } from './types/capy.type.js';

export const EAR_GENE_TO_EAR_SHAPE: Record<string, CapyEarShape> = {
	ear1: 'default',
	ear2: 'wild',
	ear3: 'quiet',
	ear4: 'mischievous',
};

export { SUIFREN_SKINS } from './constants/skins.js';
export type { SuiFrenSpecies } from './types/accessory.type.js';
export type { BullsharkAttributes, BullsharkFinStyle } from './types/bullshark.type.js';
export type { CapyAttributes, CapyEarShape } from './types/capy.type.js';
export type { SuiFrenAttributes } from './types/suifren.type.js';
export type { SuiFrenAppearance, SuiFrenSkin } from './types/appearance.type.js';
