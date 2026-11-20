// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

export function checkSpendingLimit(amount: bigint, maximum: bigint | undefined): bigint {
	if (maximum !== undefined) {
		if (typeof maximum !== 'bigint' || maximum < 0n) {
			throw new RangeError('The spending limit must be a non-negative bigint in base units.');
		}
		if (amount > maximum) {
			throw new RangeError('The required amount exceeds the configured spending limit.');
		}
	}
	return amount;
}
