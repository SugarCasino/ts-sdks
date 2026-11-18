// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import {
	createSugarClient,
	type ReadConfigResult,
	type ToolTextResult,
} from '../../runtime/index.js';
import type { ReadConfigInput } from '../schemas/index.js';
import { asTextResponse, getConfigInput, supportedFeatures, supportedGames } from './shared.js';

export function readConfigTool(input: ReadConfigInput = {}): Promise<ToolTextResult> {
	return Promise.try(() => {
		const { config } = createSugarClient(getConfigInput(input));
		return asTextResponse({
			network: config.network,
			config,
			supportedGames: supportedGames(),
			supportedFeatures: supportedFeatures(),
		} satisfies ReadConfigResult);
	});
}
