// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { mkdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testHome = vi.hoisted(
	() => `${process.env['TMPDIR'] ?? '/tmp'}/sugar-mcp-storage-${process.pid}`,
);

vi.mock('node:os', () => ({ homedir: () => testHome }));

const storage = await import('../../src/wallet/storage.js');

beforeEach(async () => {
	await rm(testHome, { force: true, recursive: true });
});

afterEach(async () => {
	await rm(testHome, { force: true, recursive: true });
});

describe('wallet storage', () => {
	it('resolves the MCP data directory under the user home directory', () => {
		expect(storage.SUGAR_MCP_DATA_DIRECTORY).toBe(join(testHome, '.sugar-mcp'));
	});

	it('creates the data directory with owner-only permissions', async () => {
		await expect(storage.ensureSugarMcpDataDirectory()).resolves.toBe(join(testHome, '.sugar-mcp'));

		expect((await stat(storage.SUGAR_MCP_DATA_DIRECTORY)).mode & 0o777).toBe(0o700);
	});

	it('tightens permissions on an existing data directory', async () => {
		await mkdir(storage.SUGAR_MCP_DATA_DIRECTORY, {
			recursive: true,
			mode: 0o755,
		});

		await storage.ensureSugarMcpDataDirectory();

		expect((await stat(storage.SUGAR_MCP_DATA_DIRECTORY)).mode & 0o777).toBe(0o700);
	});
});
