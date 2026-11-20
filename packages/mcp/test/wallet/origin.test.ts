// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertHostedApprovalSupport, resolveWebOrigin } from '../../src/wallet/origin.js';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('MCP frontend origin', () => {
	it('limits hosted approvals to games and preserves custom approval sites', () => {
		expect(() => {
			assertHostedApprovalSupport('mainnet');
		}).toThrow(/supports game transactions only/u);
		expect(() => {
			assertHostedApprovalSupport('testnet');
		}).toThrow(/supports game transactions only/u);
		vi.stubEnv('SUGAR_MCP_BRIDGE_WEB_URL', 'https://wallet.example.test');
		expect(() => {
			assertHostedApprovalSupport('testnet');
		}).not.toThrow();
	});
	it('uses the hosted origin for each supported network by default', () => {
		expect(resolveWebOrigin({ network: 'mainnet' })).toBe('https://mcp.sugar.win');
		expect(resolveWebOrigin({ network: 'testnet' })).toBe('https://mcp.testnet.sugar.win');
	});

	it('uses SUGAR_MCP_BRIDGE_WEB_URL when it is set', () => {
		vi.stubEnv('SUGAR_MCP_BRIDGE_WEB_URL', 'http://localhost:5173');
		expect(resolveWebOrigin({ network: 'mainnet' })).toBe('http://localhost:5173');
		expect(resolveWebOrigin({ network: 'testnet' })).toBe('http://localhost:5173');
	});

	it('prefers an explicit web URL over env and network defaults', () => {
		vi.stubEnv('SUGAR_MCP_BRIDGE_WEB_URL', 'http://localhost:5173');
		expect(resolveWebOrigin({ network: 'mainnet', webUrl: 'http://localhost:4173' })).toBe(
			'http://localhost:4173',
		);
	});
});
