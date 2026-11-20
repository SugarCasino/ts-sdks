// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64, normalizeSuiAddress, SUI_FRAMEWORK_ADDRESS } from '@mysten/sui/utils';
import type { SugarClientBundle } from '../runtime/client.js';

type Argument = NonNullable<
	ReturnType<Transaction['getData']>['commands'][number]['MoveCall']
>['arguments'][number];

function invalidSessionAction(): Error {
	return new Error('Session transaction contains an unexpected action or recipient.');
}

export async function verifiedSessionBytes({
	encoded,
	bundle,
	sender,
	packageName,
	module,
	functionName,
	houseArgument,
	transferResult,
}: {
	encoded: string | undefined;
	bundle: SugarClientBundle;
	sender: string;
	packageName: string;
	module: string;
	functionName: string;
	houseArgument: number;
	transferResult: boolean;
}): Promise<Uint8Array> {
	if (encoded == null || encoded === '') {
		throw new Error('Missing built session transaction.');
	}
	const bytes = fromBase64(encoded);
	const { sender: builtSender, gasData, inputs, commands } = Transaction.from(bytes).getData();
	const owner = normalizeSuiAddress(sender);
	if (builtSender !== owner || gasData.owner !== owner) {
		throw new Error('Session transaction sender or gas owner does not match the signer.');
	}
	const pkg = normalizeSuiAddress(
		packageName.startsWith('0x')
			? packageName
			: (await bundle.client.core.mvr.resolvePackage({ package: packageName })).package,
	);
	const inputFor = (arg?: Argument) => (arg?.$kind === 'Input' ? inputs[arg.Input] : undefined);
	const isOwner = (arg?: Argument) => {
		const pure = inputFor(arg)?.Pure;
		return pure != null && bcs.Address.parse(fromBase64(pure.bytes)) === owner;
	};
	let actionIndex = -1;
	let transferred = false;
	for (const [index, command] of commands.entries()) {
		if (command.$kind === 'SplitCoins' || command.$kind === 'MergeCoins') {
			continue;
		}
		if (command.$kind === 'MoveCall') {
			const call = command.MoveCall;
			if (call.package === pkg && call.module === module && call.function === functionName) {
				const house = inputFor(call.arguments[houseArgument])?.Object?.SharedObject;
				if (actionIndex !== -1 || house?.objectId !== bundle.config.sdk.objectIds.sweetHouse) {
					throw invalidSessionAction();
				}
				actionIndex = index;
				continue;
			}
			if (
				call.package === SUI_FRAMEWORK_ADDRESS &&
				call.module === 'coin' &&
				(['redeem_funds', 'zero', 'destroy_zero'].includes(call.function) ||
					(call.function === 'send_funds' && isOwner(call.arguments[1])))
			) {
				continue;
			}
		}
		if (command.$kind === 'TransferObjects' && transferResult && !transferred && actionIndex >= 0) {
			const { objects, address } = command.TransferObjects;
			const [result] = objects;
			if (
				objects.length === 1 &&
				((result?.$kind === 'Result' && result.Result === actionIndex) ||
					(result?.$kind === 'NestedResult' &&
						result.NestedResult[0] === actionIndex &&
						result.NestedResult[1] === 0)) &&
				isOwner(address)
			) {
				transferred = true;
				continue;
			}
		}
		throw invalidSessionAction();
	}
	if (actionIndex < 0 || transferResult !== transferred) {
		throw invalidSessionAction();
	}
	return bytes;
}
