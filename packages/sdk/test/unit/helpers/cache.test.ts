// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { ClientCache } from '@mysten/sui/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readCache } from '../../../src/helpers/index.js';

function startOverlappingReads() {
	const cache = new ClientCache().scope('test');
	const pending = Promise.withResolvers<string>();
	const load = vi
		.fn<() => Promise<string>>()
		.mockReturnValueOnce(pending.promise)
		.mockResolvedValueOnce('fresh');
	const key: [string] = ['key'];
	const read = (ignoreCache = false) =>
		readCache({ cache, key, load, options: { ttlMs: 1000, ignoreCache } });
	const older = read();
	const refresh = read(true);
	return { pending, older, refresh, read, load };
}

describe('readCache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('reads async values through the client cache', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi.fn<() => Promise<string>>().mockResolvedValue('value');

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('value');
		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('value');

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('shares a pending load and exposes the resolved value on subsequent reads', async () => {
		const cache = new ClientCache().scope('test');
		const pending = Promise.withResolvers<string>();
		const load = vi.fn<() => Promise<string>>().mockReturnValue(pending.promise);
		const key: [string] = ['key'];
		const options = { cache, key, load, options: { ttlMs: 1000 } };
		const first = readCache(options);
		expect(readCache(options)).toBe(first);
		expect(load).toHaveBeenCalledOnce();
		pending.resolve('value');
		await expect(first).resolves.toBe('value');
		expect(readCache(options)).toBe('value');
	});

	it('keeps the refreshed value when an older load resolves', async () => {
		const { pending, older, refresh, read, load } = startOverlappingReads();
		await expect(refresh).resolves.toBe('fresh');
		pending.resolve('older');
		await expect(older).resolves.toBe('older');
		expect(read()).toBe('fresh');
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('keeps the refreshed value when an older load rejects', async () => {
		const { pending, older, refresh, read, load } = startOverlappingReads();
		await expect(refresh).resolves.toBe('fresh');
		pending.reject(new Error('older load failed'));
		await expect(older).rejects.toThrow('older load failed');
		expect(read()).toBe('fresh');
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('reads sync values through the client cache', () => {
		const cache = new ClientCache().scope('test');
		const load = vi.fn<() => string>().mockReturnValue('value');

		expect(readCache({ cache, key: ['key'], load, options: { sync: true, ttlMs: 1000 } })).toBe(
			'value',
		);
		expect(readCache({ cache, key: ['key'], load, options: { sync: true, ttlMs: 1000 } })).toBe(
			'value',
		);

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('clears cached entries when ignored', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce('first')
			.mockResolvedValueOnce('second');

		await expect(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })).resolves.toBe(
			'first',
		);
		await expect(
			Promise.resolve(
				readCache({ cache, key: ['key'], load, options: { ignoreCache: true, ttlMs: 1000 } }),
			),
		).resolves.toBe('second');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('reloads when ttl means no cache', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce('first')
			.mockResolvedValueOnce('second');

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 0 } })),
		).resolves.toBe('first');
		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 0 } })),
		).resolves.toBe('second');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('caches until the ttl expires from the load time', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce('first')
			.mockResolvedValueOnce('second');

		vi.setSystemTime(new Date('2026-01-01T00:00:00.999Z'));

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('first');

		vi.advanceTimersByTime(1);

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('first');

		vi.advanceTimersByTime(1000);

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('second');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('clears failed async reads so the next call can retry', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce('recovered');

		await expect(
			readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } }),
		).rejects.toThrow('boom');
		await expect(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })).resolves.toBe(
			'recovered',
		);

		expect(load).toHaveBeenCalledTimes(2);
	});
});
