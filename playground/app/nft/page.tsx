import type { Metadata } from 'next';
import { NftPage } from '@/components/nft-page';

export const metadata: Metadata = {
	title: 'Sugar NFT Playground',
	description: 'Inspect the Sugar NFT collection and wallet ownership.',
};

export default function NftRoute() {
	return <NftPage />;
}
