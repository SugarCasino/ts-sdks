import type { Metadata } from 'next';
import { ReferralPage } from '@/components/referral-page';

export const metadata: Metadata = {
	title: 'Sugar Referral Playground',
	description: 'Inspect and claim Sugar referral rewards.',
};

export default function ReferralRoute() {
	return <ReferralPage />;
}
