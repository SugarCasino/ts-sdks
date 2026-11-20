// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

export { SOCCER_TEAM_KITS } from './constants/soccer-team-kit.js';

export { resolveSoccerCountryCode, resolveSoccerTeamKit } from './helpers/kits/soccer-team-kit.js';

export { buildRunnerAccessories, resolveRunnerKit } from './helpers/kits/runner-kit.js';
export type { RunnerKitOptions } from './types/runner-kit.type.js';
export type {
	SoccerTeamCountryCode,
	SoccerTeamKit,
	SoccerTeamSide,
} from './types/soccer-kit.type.js';
