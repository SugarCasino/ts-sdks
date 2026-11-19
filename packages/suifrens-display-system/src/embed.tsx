// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { EmbeddedAccessory } from './components/accessories/EmbeddedAccessory.js';
import { SuiFrenImageView } from './components/SuiFrenImageView.js';
import type { SuiFrenImageProps } from './types/suifren.type.js';

export function SuiFrenImage(props: SuiFrenImageProps) {
	return <SuiFrenImageView {...props} accessoryRenderer={EmbeddedAccessory} />;
}
