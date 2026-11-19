// Original character types by Mysten Labs. Sugar extended them with gesture and rendering options.
// Copyright (c) Sugar (modifications)
// SPDX-License-Identifier: Apache-2.0

import type { SVGProps } from 'react';
import type { SuiFrenAppearance } from './appearance.type.js';

export type CapyEarShape = 'default' | 'quiet' | 'wild' | 'mischievous';

export type CapyAttributes = SuiFrenAppearance & {
	earShape: CapyEarShape;
};

export type CapyEarProps =
	| ({ earShape: 'default' | 'mischievous' } & SVGProps<SVGPathElement>)
	| ({ earShape: 'quiet' } & SVGProps<SVGGElement>)
	| {
			earShape: 'wild';
			outerEarProps?: SVGProps<SVGPathElement>;
			innerEarProps?: SVGProps<SVGPathElement>;
	  };

export type CapyTheme = {
	head: string;
	body: string;
	legs: string;
	arms: string;
	outerEars: string;
	innerEars: string;
	patterns: string;
	nose: string;
	appendages: string;
};
