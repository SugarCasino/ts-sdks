// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from '@modelcontextprotocol/server';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SUGAR_MCP_APP_RESOURCE_URI } from '../../src/server/app-resource.js';
import {
	readOnlyToolAnnotations,
	registerSugarTools,
	withToolErrors,
} from '../../src/server/tool-registration.js';

const appToolMeta = {
	ui: {
		resourceUri: SUGAR_MCP_APP_RESOURCE_URI,
	},
} as const;

const registeredToolNames = [
	'read_config',
	'read_game_metadata',
	'list_nfts',
	'get_wallet_balances',
	'list_wallet_coins',
	'get_execution_status',
	'get_session_wallet',
	'fund_session_wallet',
	'get_connection_status',
	'sugar_login',
	'sugar_logout',
	'setup_session_wallet',
	'get_referral_commission',
	'get_referral_level_up_usd_rewards',
	'build_referral_commission_claim_transaction',
	'build_referral_level_up_usd_rewards_claim_transaction',
	'build_nft_v1_mint_transaction',
	'build_sweethouse_deposit_transaction',
	'build_sweethouse_redeem_request_transaction',
	'build_sweethouse_claim_own_redeem_request_after_delay_transaction',
	'build_coinflip_transaction',
	'build_keno_transaction',
	'build_limbo_transaction',
	'build_plinko_transaction',
	'build_pvp_coinflip_cancel_transaction',
	'build_pvp_coinflip_create_transaction',
	'build_pvp_coinflip_join_transaction',
	'build_range_transaction',
	'build_soccer_transaction',
	'build_wheel_transaction',
];

const transactionToolAnnotations = {
	readOnlyHint: false,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: true,
};

const appToolNames = [
	'get_session_wallet',
	'get_execution_status',
	'get_wallet_balances',
	'list_wallet_coins',
	'read_config',
	'read_game_metadata',
	'list_nfts',
	'get_referral_commission',
	'get_referral_level_up_usd_rewards',
	'build_referral_commission_claim_transaction',
	'build_referral_level_up_usd_rewards_claim_transaction',
	'build_nft_v1_mint_transaction',
	'build_sweethouse_deposit_transaction',
	'build_sweethouse_redeem_request_transaction',
	'build_sweethouse_claim_own_redeem_request_after_delay_transaction',
	'build_coinflip_transaction',
	'build_keno_transaction',
	'build_limbo_transaction',
	'build_plinko_transaction',
	'build_pvp_coinflip_cancel_transaction',
	'build_pvp_coinflip_create_transaction',
	'build_pvp_coinflip_join_transaction',
	'build_range_transaction',
	'build_soccer_transaction',
	'build_wheel_transaction',
];

const nonAppToolNames = [
	'setup_session_wallet',
	'fund_session_wallet',
	'sugar_login',
	'sugar_logout',
	'get_connection_status',
];

describe('MCP tool registration', () => {
	it('registers all Sugar tools with shared definitions', () => {
		const server = new McpServer({ name: 'sugar-test', version: '0.0.0' });

		registerSugarTools({ server, appToolMeta });

		const registeredTools = z
			.object({
				_registeredTools: z.record(
					z.string(),
					z.object({
						title: z.string().optional(),
						inputSchema: z.unknown().optional(),
						outputSchema: z.unknown().optional(),
						annotations: z.unknown().optional(),
						_meta: z.unknown().optional(),
					}),
				),
			})
			.parse(server)._registeredTools;

		expect(Object.keys(registeredTools).toSorted()).toEqual(registeredToolNames.toSorted());
		expect([...appToolNames, ...nonAppToolNames].toSorted()).toEqual(
			registeredToolNames.toSorted(),
		);
		expect(registeredTools['sugar_login']).toMatchObject({ annotations: { readOnlyHint: false } });
		expect(registeredTools['sugar_logout']).toMatchObject({
			annotations: { readOnlyHint: false, destructiveHint: true },
		});
		expect(registeredTools['read_config']).toMatchObject({
			title: 'Read Sugar Config',
			annotations: readOnlyToolAnnotations,
		});
		expect(registeredTools['read_config']?._meta).toMatchObject(appToolMeta);
		expect(registeredTools['read_game_metadata']).toMatchObject({
			title: 'Read Sugar Game Metadata',
			annotations: readOnlyToolAnnotations,
		});
		expect(registeredTools['read_game_metadata']?._meta).toMatchObject(appToolMeta);
		expect(registeredTools['list_nfts']).toMatchObject({
			title: 'List Sugar NFTs',
			annotations: readOnlyToolAnnotations,
			_meta: appToolMeta,
		});
		expect(registeredTools['build_coinflip_transaction']).toMatchObject({
			title: 'Build Coinflip Transaction',
			annotations: transactionToolAnnotations,
			_meta: appToolMeta,
		});
		expect(registeredTools['build_nft_v1_mint_transaction']).toMatchObject({
			title: 'Build NFT V1 Mint Transaction',
			annotations: transactionToolAnnotations,
			_meta: appToolMeta,
		});
		expect(registeredTools['build_pvp_coinflip_create_transaction']).toMatchObject({
			title: 'Build PvP Coinflip Create',
			annotations: transactionToolAnnotations,
			_meta: appToolMeta,
		});
		for (const name of appToolNames) {
			expect(registeredTools[name]?._meta).toMatchObject(appToolMeta);
		}
		for (const name of nonAppToolNames) {
			expect(registeredTools[name]?._meta).toBeUndefined();
		}

		for (const tool of Object.values(registeredTools)) {
			expect(tool.inputSchema).toBeDefined();
			expect(tool.outputSchema).toBeDefined();
		}
	});

	it('wraps thrown handler failures as MCP tool errors', async () => {
		const result = await withToolErrors(() => {
			return Promise.try(() => {
				throw new TypeError('bad input');
			});
		})({});

		expect(result).toMatchObject({
			isError: true,
			content: [
				{
					type: 'text',
				},
			],
		});
		expect(result.content[0]?.text).toContain('TypeError: bad input');
		expect(result.content[0]?.text).toContain(
			'Check required fields, network, coin type, and SDK config overrides.',
		);
		expect(result.structuredContent).toEqual({
			errors: [
				'TypeError: bad input',
				'Check required fields, network, coin type, and SDK config overrides.',
			],
		});
	});
});
