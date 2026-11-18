// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { SugarNetworkRegistry, SugarPackageIds } from '../types/index.js';
import { PACKAGE_IDS as MAINNET_PACKAGE_IDS } from './mainnet/packages.js';
import { PACKAGE_IDS as TESTNET_PACKAGE_IDS } from './testnet/packages.js';

export const PACKAGE_IDS: SugarNetworkRegistry<SugarPackageIds> = {
	mainnet: { ...MAINNET_PACKAGE_IDS },
	testnet: { ...TESTNET_PACKAGE_IDS },
};
