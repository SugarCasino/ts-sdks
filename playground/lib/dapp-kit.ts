import { createDAppKit } from '@mysten/dapp-kit-core';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { sugar, type SugarNetwork } from '@sugar/sdk';

type PlaygroundNetwork = Extract<SugarNetwork, 'testnet'>;

const PLAYGROUND_NETWORKS: [PlaygroundNetwork] = ['testnet'];

const GRPC_URLS: Record<PlaygroundNetwork, string> = {
	testnet: 'https://fullnode.testnet.sui.io:443',
};

export const dAppKit = createDAppKit({
	networks: PLAYGROUND_NETWORKS,
	defaultNetwork: 'testnet',
	autoConnect: true,
	createClient: (network) =>
		new SuiGrpcClient({
			network,
			baseUrl: GRPC_URLS[network],
		}).$extend(sugar()),
	storageKey: 'sugar-playground:dapp-kit:wallet',
});

declare module '@mysten/dapp-kit-react' {
	interface Register {
		dAppKit: typeof dAppKit;
	}
}
