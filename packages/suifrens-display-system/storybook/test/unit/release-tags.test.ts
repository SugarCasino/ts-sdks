// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { getReleaseVersions, withReleaseFilters } from '../../.storybook/release-tags.js';

const releases = ['1.0.0', '1.0.3', '1.1.0'];

test('filters from the effective introduction version, including after re-adding a tag', () => {
	const tags = ['1.0.0', '!1.0.0', '1.0.3', '!1.0.3', '1.0.3', 'beta', '!beta'];
	expect(withReleaseFilters(tags, releases)).toEqual(['beta', '!beta', '1.0.3', '1.1.0']);
});

test('lists each available release once, in order of introduction', () => {
	expect(withReleaseFilters(['autodocs', '1.0.0', '1.0.0'], releases)).toEqual([
		'autodocs',
		...releases,
	]);
	expect(withReleaseFilters(['1.0.0', '!1.0.0'], releases)).toEqual([]);
});

test.each(['unreleased', 'beta'])('%s excludes the inherited release', (status) => {
	expect(withReleaseFilters(['!autodocs', '1.0.0', status], releases)).toEqual([
		'!autodocs',
		status,
	]);
});

test('groups prereleases and the final release under one version filter', () => {
	const changelog = '## 0.0.2-beta.0\n## 0.0.1\n## 0.0.1-beta.1\n## 0.0.1-beta.0';
	expect(getReleaseVersions(changelog)).toEqual(['0.0.1', '0.0.2']);
});
