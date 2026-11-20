// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress, toBase64 } from '@mysten/sui/utils';
import { describe, expect, it, vi } from 'vitest';
import { createSugarClient } from '../../src/runtime/client.js';
import { verifiedSessionBytes } from '../../src/wallet/session-transaction.js';

describe('session signing policy', () => {
	it('checks the resolved action, shared house and returned object against the final bytes', async () => {
		const bundle = createSugarClient({ network: 'testnet' });
		const sender = normalizeSuiAddress('0x7');
		const pkg = normalizeSuiAddress('0x42');
		const tx = new Transaction();
		tx.setSender(sender);
		tx.setGasBudget(1000000);
		tx.setGasPrice(1);
		tx.setGasPayment([
			{
				objectId: normalizeSuiAddress('0x9'),
				version: '1',
				digest: '11111111111111111111111111111111',
			},
		]);
		const [coin] = tx.splitCoins(tx.gas, [1]);
		const house = tx.sharedObjectRef({
			objectId: bundle.config.sdk.objectIds.sweetHouse,
			initialSharedVersion: '1',
			mutable: true,
		});
		const output = tx.moveCall({
			target: pkg + '::sweethouse::deposit_public_pool_and_mint_staked_coins',
			arguments: [house, coin],
			typeArguments: ['0x2::sui::SUI'],
		});
		tx.transferObjects([output], tx.pure.address(sender));
		const bytes = await tx.build();
		const policy = {
			bundle,
			encoded: toBase64(bytes),
			sender,
			packageName: '@suigar/core',
			module: 'sweethouse',
			functionName: 'deposit_public_pool_and_mint_staked_coins',
			houseArgument: 0,
			transferResult: true,
		};
		vi.spyOn(bundle.client.core.mvr, 'resolvePackage').mockResolvedValue({ package: pkg });
		await expect(verifiedSessionBytes(policy)).resolves.toEqual(bytes);
		await expect(
			verifiedSessionBytes({ ...policy, functionName: 'redeem_request' }),
		).rejects.toThrow(/unexpected action/u);
		await expect(verifiedSessionBytes({ ...policy, houseArgument: 1 })).rejects.toThrow(
			/unexpected action/u,
		);
		await expect(verifiedSessionBytes({ ...policy, sender: pkg })).rejects.toThrow(/signer/u);
	});
});
