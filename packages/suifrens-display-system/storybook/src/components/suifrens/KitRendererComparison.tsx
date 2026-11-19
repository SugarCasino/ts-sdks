// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { SuiFrenImage, type SuiFrenImageProps } from '@sugarcasino/suifrens-display-system';
import { SuiFrenImage as EmbeddedSuiFrenImage } from '@sugarcasino/suifrens-display-system/embed';

const renderers = [
	{ label: 'Embedded accessories', Renderer: EmbeddedSuiFrenImage },
	{ label: 'External accessories', Renderer: SuiFrenImage },
];

export function KitRendererComparison(props: SuiFrenImageProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{renderers.map(({ label, Renderer }) => (
				<figure key={label} className="story-tile grid justify-items-center gap-2 p-2">
					<Renderer {...props} style={{ width: '100%', ...props.style }} />
					<figcaption className="text-xs font-semibold text-slate-600 dark:text-slate-300">
						{label}
					</figcaption>
				</figure>
			))}
		</div>
	);
}
