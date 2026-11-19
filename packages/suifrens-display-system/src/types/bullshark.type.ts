// Original character types by Mysten Labs. Sugar extended them with gesture and rendering options.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import type { SuiFrenAppearance } from './appearance.type.js';

export type BullsharkFinStyle = 'classic';

export type BullsharkAttributes = SuiFrenAppearance & {
	finStyle: BullsharkFinStyle;
};

export type BullsharkTheme = {
	head: string;
	body: string;
	legs: string;
	hands: string;
	fin: string;
	tail: string;
	patterns: string;
};
