// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import type { ClientCache } from '@mysten/sui/client';

type CacheEntry<Value> = {
	expiresAt: number;
	value: Value;
};

type CacheKey = Parameters<ClientCache['read']>[0];

type ReadCacheOptions = {
	ignoreCache?: boolean | undefined;
	ttlMs: number;
	sync?: boolean | undefined;
};

type ReadCacheParams<T> = {
	cache: ClientCache;
	key: CacheKey;
	load: () => T | Promise<T>;
	options: ReadCacheOptions;
};

type ReadCacheSyncParams<T> = {
	cache: ClientCache;
	key: CacheKey;
	load: () => T;
	options: ReadCacheOptions & { sync: true };
};

export function readCache<T>(params: ReadCacheSyncParams<T>): T;
export function readCache<T>(params: ReadCacheParams<T>): T | Promise<T>;
export function readCache<T>({
	cache,
	key,
	load,
	options,
}: ReadCacheParams<T> | ReadCacheSyncParams<T>): T | Promise<T> {
	if (options.ignoreCache === true) {
		cache.clear(key);
	}

	if (options.ttlMs <= 0) {
		cache.clear(key);
		return load();
	}

	const { ttlMs } = options;

	const createEntry = () => {
		const value = load();
		const entry: CacheEntry<T | Promise<T>> = {
			expiresAt: Date.now() + ttlMs,
			value,
		};

		if (isPromiseLike(value)) {
			entry.value = Promise.resolve(value)
				.then((resolved) => {
					entry.value = resolved;
					entry.expiresAt = Date.now() + ttlMs;
					return resolved;
				})
				.catch((error) => {
					entry.expiresAt = Number.NEGATIVE_INFINITY;
					throw error;
				});
		}

		return entry;
	};

	// The cache entry is synchronous; only its value may be a promise.
	const cached = cache.readSync(key, createEntry);
	if (cached.expiresAt > Date.now()) {
		return cached.value;
	}
	cache.clear(key);
	return cache.readSync(key, createEntry).value;
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
	return (
		(typeof value === 'object' || typeof value === 'function') && value != null && 'then' in value
	);
}
