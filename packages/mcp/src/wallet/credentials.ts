// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { chmod, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { type SugarNetwork, SUPPORTED_SUI_NETWORKS } from '@sugar/sdk';
import { isNonArrayRecord } from '../utils/record.js';
import { ensureSugarMcpDataDirectory, SUGAR_MCP_DATA_DIRECTORY } from './storage.js';

const CREDENTIALS_FILE: string = join(SUGAR_MCP_DATA_DIRECTORY, 'credentials.json');

type WalletType = 'wallet' | 'zklogin';

export type WalletProfile = {
	address: string;
	walletType: WalletType;
	frontendOrigin: string;
	connectedAt: string;
};

type Credentials = {
	version: 1;
	defaultNetwork: SugarNetwork;
	profiles: Partial<Record<SugarNetwork, WalletProfile>>;
};

function empty(): Credentials {
	return {
		version: 1,
		defaultNetwork: 'testnet',
		profiles: {},
	};
}

function isValidSugarNetwork(value: unknown): value is SugarNetwork {
	return SUPPORTED_SUI_NETWORKS.some((network) => network === value);
}

function isValidWalletProfile(value: unknown): value is WalletProfile {
	if (!isNonArrayRecord(value)) {
		return false;
	}
	return (
		typeof value['address'] === 'string' &&
		isValidSuiAddress(value['address']) &&
		(value['walletType'] === 'wallet' || value['walletType'] === 'zklogin') &&
		typeof value['frontendOrigin'] === 'string' &&
		typeof value['connectedAt'] === 'string'
	);
}

function isValidCredentials(value: unknown): value is Credentials {
	if (!isNonArrayRecord(value)) {
		return false;
	}
	if (
		value['version'] !== 1 ||
		!isValidSugarNetwork(value['defaultNetwork']) ||
		!isNonArrayRecord(value['profiles'])
	) {
		return false;
	}

	return Object.entries(value['profiles']).every(
		([network, profile]) => isValidSugarNetwork(network) && isValidWalletProfile(profile),
	);
}

export function credentialsPath(): string {
	return CREDENTIALS_FILE;
}

/**
 * Reads the configured network without requiring callers to load full credentials. This is
 * intentionally synchronous because runtime client creation is synchronous.
 */
export function readPersistedDefaultNetwork(): SugarNetwork {
	try {
		const value: unknown = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8'));
		const network = isNonArrayRecord(value) ? value['defaultNetwork'] : undefined;
		return isValidSugarNetwork(network) ? network : 'testnet';
	} catch {
		return 'testnet';
	}
}

export async function loadCredentials(): Promise<Credentials> {
	try {
		const parsed: unknown = JSON.parse(await readFile(CREDENTIALS_FILE, 'utf8'));
		return isValidCredentials(parsed) ? parsed : empty();
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return empty();
		}
		throw error;
	}
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
	await ensureSugarMcpDataDirectory();
	await writeFile(CREDENTIALS_FILE, `${JSON.stringify(credentials, null, 2)}\n`, {
		mode: 0o600,
	});
	await chmod(CREDENTIALS_FILE, 0o600);
}

export async function saveProfile({
	network,
	profile,
}: {
	network: SugarNetwork;
	profile: WalletProfile;
}): Promise<Credentials> {
	const credentials = await loadCredentials();
	credentials.defaultNetwork = network;
	credentials.profiles[network] = profile;
	await saveCredentials(credentials);
	return credentials;
}

export async function setDefaultNetwork(network: SugarNetwork): Promise<Credentials> {
	const credentials = await loadCredentials();
	credentials.defaultNetwork = network;
	await saveCredentials(credentials);
	return credentials;
}

export async function removeProfile(network: SugarNetwork): Promise<Credentials> {
	const credentials = await loadCredentials();
	delete credentials.profiles[network];
	await saveCredentials(credentials);
	return credentials;
}

export async function clearCredentials(): Promise<void> {
	await rm(CREDENTIALS_FILE, { force: true });
}
