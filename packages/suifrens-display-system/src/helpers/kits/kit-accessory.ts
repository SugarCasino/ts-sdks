// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { SOCCER_TEAM_ACCESSORY_NAMES } from '../../constants/soccer-team-kit.js';
import { RUNNER_ACCESSORY_NAMES } from './runner-kit.js';

export function isKitAccessory(name: string): boolean {
	return RUNNER_ACCESSORY_NAMES.has(name) || SOCCER_TEAM_ACCESSORY_NAMES.has(name);
}
