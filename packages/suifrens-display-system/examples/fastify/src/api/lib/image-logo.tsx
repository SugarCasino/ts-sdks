// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { type Static, Type } from 'typebox';
import { SugarLogo } from '../../components/logos/SugarLogo.js';
import { SuiLogo } from '../../components/logos/SuiLogo.js';

export const IMAGE_LOGO_SCHEMA = Type.Optional(
	Type.Union([Type.Literal('sui'), Type.Literal('sugar')]),
);

export function renderImageLogo(logo: Static<typeof IMAGE_LOGO_SCHEMA> | undefined) {
	if (!logo) {
		return null;
	}
	return logo === 'sui' ? <SuiLogo /> : <SugarLogo />;
}
