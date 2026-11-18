// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { SuiCodegenConfig } from '@mysten/codegen';
import { MOVE_STDLIB_ADDRESS } from '@mysten/sui/utils';
import { SUGAR_PACKAGES } from './sugar-packages.ts';

const NETWORK = 'testnet';

const SUGAR_PACKAGES_CONFIGURATION: SuiCodegenConfig['packages'] = SUGAR_PACKAGES.map(
	(packageInfo) => ({
		package: packageInfo.package,
		packageName: packageInfo.packageName,
		network: NETWORK,
		generate: {
			modules: packageInfo.modules,
		},
	}),
);

const config: SuiCodegenConfig = {
	output: './src/contracts',
	includePhantomTypeParameters: false,
	packages: [
		...SUGAR_PACKAGES_CONFIGURATION,
		{
			package: MOVE_STDLIB_ADDRESS,
			packageName: 'stdlib',
			network: NETWORK,
			generate: {
				modules: {
					type_name: {
						types: ['TypeName'],
					},
				},
			},
		},
	],
	generateSummaries: false,
};

export default config;
