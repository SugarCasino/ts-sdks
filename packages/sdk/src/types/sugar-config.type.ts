// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { SugarNetwork } from './network.type.js';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type SugarCoinMetadata = {
	coinType: string;
	decimals: number;
	priceInfoObjectId: string;
};

export type SugarConfigOverrides = DeepPartial<SugarConfig>;

export interface SugarExtensionOptions<Name extends string = 'sugar'> {
	name?: Name;
	/**
	 * Network-resolved configuration overrides.
	 *
	 * Use this to patch package ids, object ids, supported coins, or price info object ids when
	 * on-chain deployments move faster than MVR or the published SDK defaults.
	 */
	config?: SugarConfigOverrides | undefined;
	/**
	 * Partner wallet address injected into bet metadata for attribution.
	 *
	 * Configure this once when registering the `sugar()` client extension instead of passing partner
	 * data through per-transaction metadata.
	 */
	partner?: string | undefined;
	/**
	 * Cache TTL in milliseconds for SDK-managed on-chain config lookups.
	 *
	 * Defaults to 30 minutes.
	 */
	cacheTtl?: number | undefined;
}

export type SugarCoin = 'sui' | 'usdc';

export type SugarCoinRegistry = Record<SugarCoin, SugarCoinMetadata>;

export type SugarPackage =
	| 'nftV1'
	| 'core'
	| 'referral'
	| 'coinflip'
	| 'keno'
	| 'limbo'
	| 'plinko'
	| 'pvpCoinflip'
	| 'range'
	| 'soccer'
	| 'wheel';
export type SugarPackageIds = Record<'nftV1', string> &
	Partial<Record<Exclude<SugarPackage, 'nftV1'>, string>>;

export type SugarObject = 'sweetHouse' | 'nftV1Factory';
export type SugarObjectIds = Record<SugarObject, string>;

export type SugarNetworkRegistry<TRegistry> = Record<SugarNetwork, TRegistry>;

export type SugarConfig = {
	packageIds: SugarPackageIds;
	objectIds: SugarObjectIds;
	coins: SugarCoinRegistry;
};
