// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';

export const SUPPORTED_SUI_NETWORKS = [
	'mainnet',
	'testnet',
] as const satisfies ReadonlyArray<SuiClientTypes.Network>;

export type SugarNetwork = (typeof SUPPORTED_SUI_NETWORKS)[number];
