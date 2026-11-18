// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { defaultConfig, type TagBadgeParameters } from 'storybook-addon-tag-badges/manager-helpers';
import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';
import { versionPattern } from './release-tags.js';

addons.setConfig({
	theme: {
		...themes.normal,
		brandTitle: 'Sugar',
		brandImage: './brand/logo-full.svg',
		brandUrl: './?path=/story/suifrens-onboarding--getting-started',
		brandTarget: '_self',
	},
	tagBadges: [
		{
			tags: 'unreleased',
			display: { sidebar: true },
			badge: { text: 'Unreleased', style: 'orange', tooltip: 'Not yet available in a release' },
		},
		{
			display: {
				sidebar: [
					{ type: 'component', skipInherited: false },
					{ type: 'docs', skipInherited: false },
					{ type: 'story', skipInherited: false },
				],
				toolbar: false,
				mdx: false,
			},
			tags: versionPattern,
			badge: ({ tag }) => ({ text: `v${tag}`, style: 'blue', tooltip: `Available since v${tag}` }),
		},
		...defaultConfig,
	] satisfies TagBadgeParameters,
});

const url = new URL(window.location.href);
if (url.searchParams.get('path') === '/onboarding') {
	url.searchParams.set('path', '/story/suifrens-onboarding--getting-started');
	window.location.replace(url);
}
