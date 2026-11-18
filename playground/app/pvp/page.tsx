import type { Metadata } from 'next';
import { PvPIntegrationPage } from '@/components/integration-shell';

export const metadata: Metadata = {
	title: 'Sugar PvP Games Playground',
	description: 'Create, join, and inspect Sugar SDK PvP Coinflip transactions in the playground.',
};

export default function PvPPage() {
	return <PvPIntegrationPage />;
}
