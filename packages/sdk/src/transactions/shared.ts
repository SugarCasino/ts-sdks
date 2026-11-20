// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import {
	coinWithBalance,
	Transaction,
	type TransactionArgument,
	type TransactionResult,
} from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { resolvePriceInfoObjectId } from '../helpers/config.js';
import { encodeBetMetadata } from '../helpers/metadata.js';
import { optionalOptions } from '../helpers/options.js';
import type {
	BaseTransactionOptions,
	EncodedBetMetadata,
	SharedBetTransactionOptions,
	StakeTransactionOptions,
	TransactionSenderOptions,
	WithCoinType,
	WithPartner,
} from '../types/index.js';
import { DEFAULT_GAS_BUDGET_MIST } from '../utils/constants.js';
import { toBigInt } from '../utils/numeric.js';

type StrictStakeTransactionOptions = {
	[K in keyof StakeTransactionOptions]-?: Exclude<StakeTransactionOptions[K], number | undefined>;
};

type SharedBetTransactionContext = WithCoinType<
	Pick<BaseTransactionOptions, 'config' | 'owner'> &
		StrictStakeTransactionOptions & {
			betCoin: TransactionArgument;
			metadata: EncodedBetMetadata;
			priceInfoObjectId: string;
		}
>;

type StandardGameBetTransactionOptions = WithPartner<
	SharedBetTransactionOptions & {
		buildRewardCoin: (
			context: SharedBetTransactionContext,
		) => (tx: Transaction) => TransactionResult;
	}
>;

/** Convert a transaction amount in base units without rounding JavaScript numbers. */
export function transactionAmount(value: number | bigint): bigint {
	if (typeof value === 'number' && !Number.isSafeInteger(value)) {
		throw new RangeError('Transaction amounts must use safe integer numbers or bigint.');
	}
	return toBigInt(value);
}

/** Creates a transaction with its sender and default gas budget configured. */
export function createBaseTransaction({ owner, gasBudget }: TransactionSenderOptions): Transaction {
	const tx = new Transaction();
	tx.setSenderIfNotSet(normalizeSuiAddress(owner));
	tx.setGasBudgetIfNotSet(gasBudget ?? DEFAULT_GAS_BUDGET_MIST);
	return tx;
}

export function buildSharedStandardGameBetTransaction(
	options: StandardGameBetTransactionOptions,
): Transaction {
	const { config, owner, coinType, stake, cashStake, betCount, useGasCoin, buildRewardCoin } =
		options;
	const tx = createBaseTransaction(options);
	const normalizedOwner = normalizeSuiAddress(owner);
	const normalizedCoinType = normalizeStructTag(coinType);
	const resolvedStake = transactionAmount(stake);
	const resolvedCashStake = transactionAmount(cashStake ?? stake);
	const resolvedBetCount = transactionAmount(betCount ?? 1);
	const encodedMetadata = encodeBetMetadata(options);
	const priceInfoObjectId = resolvePriceInfoObjectId({
		config,
		coinType: normalizedCoinType,
	});

	const rewardCoin = tx.add(
		buildRewardCoin({
			config,
			owner: normalizedOwner,
			coinType: normalizedCoinType,
			stake: resolvedStake,
			cashStake: resolvedCashStake,
			betCount: resolvedBetCount,
			metadata: encodedMetadata,
			priceInfoObjectId,
			betCoin: coinWithBalance({
				type: normalizedCoinType,
				balance: resolvedCashStake,
				...optionalOptions({ useGasCoin }),
			}),
		}),
	);

	tx.transferObjects([rewardCoin], tx.pure.address(normalizedOwner));
	return tx;
}
