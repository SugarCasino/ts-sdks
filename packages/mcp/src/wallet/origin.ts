// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { SugarNetwork } from '@sugarcasino/sdk';

export const BRIDGE_WEB_URL_ENV: string = 'SUGAR_MCP_BRIDGE_WEB_URL';

export function resolveWebOrigin({
	network,
	webUrl,
}: {
	network: SugarNetwork;
	webUrl?: string | undefined;
}): string {
	return (
		webUrl ??
		process.env[BRIDGE_WEB_URL_ENV] ??
		(network === 'mainnet' ? 'https://mcp.sugar.win' : `https://mcp.${network}.sugar.win`)
	);
}
