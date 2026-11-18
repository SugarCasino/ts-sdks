import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Sugar Game Playground',
	description: 'Build, inspect, and execute Sugar SDK standard and PvP transactions.',
};

export default function HomePage() {
	redirect('/standard?game=coinflip');
}
