// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';

const testHome = vi.hoisted(
	() => `${process.env['TMPDIR'] ?? '/tmp'}/sugar-mcp-session-${process.pid}`,
);
const keychainEntries = vi.hoisted(() => new Map<string, string>());
const keychainUnavailable = vi.hoisted(() => ({ value: false }));

const openBrowser = vi.hoisted(() => vi.fn<(url: string) => Promise<void>>());
vi.mock('open', () => ({ default: openBrowser }));
vi.mock('node:os', () => ({ homedir: () => testHome }));
vi.mock('@napi-rs/keyring', () => ({
	Entry: class Entry {
		constructor(
			private readonly service: string,
			private readonly account: string,
		) {
			if (keychainUnavailable.value) {
				throw new Error('native keyring unavailable');
			}
		}

		getPassword() {
			return keychainEntries.get(`${this.service}:${this.account}`) ?? null;
		}

		setPassword(password: string) {
			keychainEntries.set(`${this.service}:${this.account}`, password);
		}
	},
}));

const session = await import('../../src/wallet/session.js');
const crypto = await import('../../src/utils/crypto.js');

async function startSetup() {
	await session.createSessionWalletSetup();
	const launch = new URL(openBrowser.mock.lastCall![0]);
	return { setupUrl: launch.origin + '/', token: launch.hash.slice(1) };
}

function beginSetup(
	{ setupUrl, token }: Awaited<ReturnType<typeof startSetup>>,
	origin = new URL(setupUrl).origin,
) {
	return fetch(new URL('begin', setupUrl), {
		method: 'POST',
		headers: { origin },
		body: new URLSearchParams({ token }),
	});
}

beforeEach(async () => {
	keychainEntries.clear();
	keychainUnavailable.value = false;
	await rm(testHome, { force: true, recursive: true });
});

afterEach(async () => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	await rm(testHome, { force: true, recursive: true });
});

describe('stored session wallets', () => {
	it('ignores malformed metadata entries without dropping valid wallets', async () => {
		const directory = `${testHome}/.sugar-mcp`;
		await mkdir(directory, { recursive: true });
		const wallet = {
			id: 'saved-wallet',
			name: 'Daily bets',
			address: '0xabc',
			createdAt: '2026-11-11T00:00:00Z',
			source: 'created',
		};
		await writeFile(
			`${directory}/session-wallets.json`,
			JSON.stringify([
				null,
				{},
				{ ...wallet, source: 'invalid' },
				{ ...wallet, address: 7 },
				wallet,
			]),
		);
		expect(await session.listSessionWallets()).toEqual([wallet]);
	});
});

describe('session wallet setup', () => {
	it('stores a newly created wallet in the OS keychain after local confirmation', async () => {
		const setup = await startSetup();
		const { setupUrl } = setup;
		const landing = await fetch(setupUrl);
		expect(landing.headers.get('referrer-policy')).toBe('same-origin');
		const landingHtml = await landing.text();
		expect(landingHtml).not.toContain('<meta name="referrer"');
		expect(landingHtml).not.toContain('<code class="recovery">');
		expect((await beginSetup(setup, 'https://example.test')).status).toBe(403);
		const page = await (await beginSetup(setup)).text();
		expect((await beginSetup(setup)).status).toBe(403);
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		const mnemonic = page.match(/<code class="recovery">([^<]+)<\/code>/u)?.[1];

		expect(state).toMatch(crypto.HEX_32_BYTE_PATTERN);
		expect(mnemonic?.split(' ')).toHaveLength(24);
		expect(page).toContain('SUGAR MCP');
		expect(page).toContain('shared by Sugar mainnet and testnet');
		expect(page).not.toContain('<span class="badge">testnet</span>');
		expect(page).toContain('color-scheme:light dark');

		const response = await fetch(`${setupUrl}save`, {
			method: 'POST',
			headers: { origin: new URL(setupUrl).origin },
			body: new URLSearchParams({
				state: state!,
				mnemonic: mnemonic!,
				name: 'Daily bets',
				confirmed: 'on',
			}),
		});

		expect(response.ok).toBe(true);
		const savedPage = await response.text();
		expect(savedPage).toContain('Session wallet ready');
		expect(savedPage).toContain('both Sugar mainnet and testnet');
		expect(savedPage).toContain('~/.sugar-mcp/session-wallets.json');
		expect(savedPage).toContain('operating-system keychain');
		const wallet = await session.loadSessionWallet();
		expect(wallet).toEqual(
			expect.objectContaining({
				source: 'created',
				name: 'Daily bets',
				id: expect.stringMatching(/^[0-9a-f-]{36}$/u) as unknown,
				address: expect.stringMatching(/^0x/u) as unknown,
			}),
		);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(wallet!.address);
		expect([...keychainEntries.keys()]).toEqual([`com.sugar.mcp:session-wallet:${wallet!.id}`]);
	});

	it('imports a standard Sui private key through the local setup page', async () => {
		const signer = Ed25519Keypair.generate();
		const setup = await startSetup();
		const { setupUrl } = setup;
		const page = await (await beginSetup(setup)).text();
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];

		expect(page).toContain('Import a Sui private key');
		expect(page).toContain('suiprivkey');

		const response = await fetch(`${setupUrl}import-private-key`, {
			method: 'POST',
			headers: { origin: new URL(setupUrl).origin },
			body: new URLSearchParams({
				state: state!,
				privateKey: signer.getSecretKey(),
				name: 'Imported wallet',
			}),
		});

		expect(response.ok).toBe(true);
		expect(await session.loadSessionWallet()).toEqual(
			expect.objectContaining({
				address: signer.toSuiAddress(),
				source: 'private-key',
				name: 'Imported wallet',
			}),
		);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(signer.toSuiAddress());
	});

	it('keeps multiple named wallets and selects each signer by ID', async () => {
		const firstSigner = Ed25519Keypair.generate();
		const secondSigner = Ed25519Keypair.generate();
		const firstSetup = await startSetup();
		const firstPage = await (await beginSetup(firstSetup)).text();
		const firstState = firstPage.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		await fetch(`${firstSetup.setupUrl}import-private-key`, {
			method: 'POST',
			headers: { origin: new URL(firstSetup.setupUrl).origin },
			body: new URLSearchParams({
				state: firstState!,
				privateKey: firstSigner.getSecretKey(),
				name: 'First wallet',
			}),
		});

		const secondSetup = await startSetup();
		const secondPage = await (await beginSetup(secondSetup)).text();
		const secondState = secondPage.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		expect(secondPage).toContain(firstSigner.toSuiAddress());
		expect(secondPage).toContain('adds it to your local wallet list');

		const secondResponse = await fetch(`${secondSetup.setupUrl}import-private-key`, {
			method: 'POST',
			headers: { origin: new URL(secondSetup.setupUrl).origin },
			body: new URLSearchParams({
				state: secondState!,
				privateKey: secondSigner.getSecretKey(),
				name: 'Second wallet',
			}),
		});
		expect(secondResponse.ok).toBe(true);
		const wallets = await session.listSessionWallets();
		expect(wallets).toEqual([
			expect.objectContaining({
				name: 'First wallet',
				address: firstSigner.toSuiAddress(),
			}),
			expect.objectContaining({
				name: 'Second wallet',
				address: secondSigner.toSuiAddress(),
			}),
		]);
		assert.isDefined(wallets[0]);
		assert.isDefined(wallets[1]);
		expect((await session.loadSessionSigner(wallets[0].id)).toSuiAddress()).toBe(
			firstSigner.toSuiAddress(),
		);
		expect((await session.loadSessionSigner(wallets[1].id)).toSuiAddress()).toBe(
			secondSigner.toSuiAddress(),
		);
	});

	it('uses the setup timeout environment value', async () => {
		vi.stubEnv(session.SESSION_SETUP_TIMEOUT_MS_ENV, '1234');
		const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const setup = await startSetup();
		const { setupUrl } = setup;
		const page = await (await beginSetup(setup)).text();
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		const privateKey = Ed25519Keypair.generate().getSecretKey();

		expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1234);

		await fetch(`${setupUrl}import-private-key`, {
			method: 'POST',
			headers: { origin: new URL(setupUrl).origin },
			body: new URLSearchParams({
				state: state!,
				privateKey,
				name: 'Timeout test',
			}),
		});
	});

	it('rejects an invalid setup timeout environment value', async () => {
		vi.stubEnv(session.SESSION_SETUP_TIMEOUT_MS_ENV, '0');

		await expect(session.createSessionWalletSetup()).rejects.toThrow(
			'Session wallet setup timeout must be a positive integer.',
		);
	});

	it('reports unavailable secure storage when keyring cannot be loaded', async () => {
		keychainUnavailable.value = true;

		const setup = await startSetup();
		const { setupUrl } = setup;
		const page = await (await beginSetup(setup)).text();
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		const privateKey = Ed25519Keypair.generate().getSecretKey();

		const response = await fetch(`${setupUrl}import-private-key`, {
			method: 'POST',
			headers: { origin: new URL(setupUrl).origin },
			body: new URLSearchParams({
				state: state!,
				privateKey,
				name: 'Unavailable keyring',
			}),
		});

		expect(response.ok).toBe(false);
		expect(await response.text()).toContain(
			'Session wallet secure storage is unavailable. Configure the operating-system keychain and retry.',
		);
	});
});
