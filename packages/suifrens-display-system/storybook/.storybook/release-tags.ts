// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

export const versionPattern = /^\d+\.\d+\.\d+$/u;

export function getReleaseVersions(changelog: string): Array<string> {
	const headings = changelog.matchAll(/^## (\d+\.\d+\.\d+)(?:-[0-9A-Za-z.-]+)?\r?$/gmu);
	return [...new Set(Array.from(headings, (match) => match[1]!).toReversed())];
}

export function withReleaseFilters(tags: Array<string>, releases: Array<string>): Array<string> {
	// CSF lists component tags before story tags. A later "!tag" removes that tag.
	const isActive = (tag: string) => tags.lastIndexOf(tag) > tags.lastIndexOf(`!${tag}`);
	const version = tags.find((tag) => versionPattern.test(tag) && isActive(tag));
	const otherTags = tags.filter((tag) => !versionPattern.test(tag.replace(/^!/u, '')));
	if (version === undefined || version === '' || isActive('beta') || isActive('unreleased')) {
		return otherTags;
	}

	const firstRelease = releases.indexOf(version);
	if (firstRelease < 0) {
		throw new Error(`Unknown release tag ${version}`);
	}
	return [...otherTags, ...releases.slice(firstRelease)];
}
