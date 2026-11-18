#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { inspectMessage, main, warnAboutPersonalEmails } from './validate-git-identities.mjs';

function pushBase(event) {
	const oid = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
	if (!oid.test(event.before ?? '') || !oid.test(event.after ?? '') || /^0+$/.test(event.after)) {
		throw new Error('Invalid push object IDs.');
	}
	let rewritten = event.forced === true;
	const created = /^0+$/.test(event.before);
	if (!created && !rewritten) {
		const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', event.before, event.after], {
			encoding: 'utf8',
		});
		if (ancestry.error || ![0, 1].includes(ancestry.status)) {
			throw new Error('Unable to determine push ancestry.');
		}
		rewritten = ancestry.status === 1;
	}
	if (!created && !rewritten) {
		return event.before;
	}
	// Forced pushes may reference an old commit no longer reachable from any fetched ref.
	// Inspect the replacement branch delta without rescanning history already on main.
	return execFileSync('git', ['merge-base', 'origin/main', `${event.after}^{commit}`], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim();
}

try {
	const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
	const pr = event.pull_request;
	if (pr) {
		const message = `${pr.title ?? ''}\n\n${pr.body ?? ''}`;
		warnAboutPersonalEmails(message);
		if (inspectMessage(message).length) {
			throw new Error(
				'Invalid attribution in PR title/body. Organization members must use GitHub noreply emails. Values withheld.',
			);
		}
		main(['--range', pr.base.sha, pr.head.sha]);
	} else if (process.env.GITHUB_EVENT_NAME === 'push') {
		if (event.deleted) {
			console.log('[git-identities] Deleted ref has no incoming objects.');
			process.exit(0);
		}
		main(['--range', pushBase(event), event.after]);
	} else if (process.env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
		const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
		// Manual version-PR checks inspect the branch delta; historical source needs a separate scrub.
		const base = execFileSync('git', ['merge-base', 'origin/main', head], {
			encoding: 'utf8',
		}).trim();
		main(['--range', base, head]);
	} else {
		throw new Error('Unsupported publication event.');
	}
} catch {
	console.error(
		'[git-identities] Publication check failed. Check Git identity formatting, attribution, PR metadata and availability of the compared commits. Values withheld.',
	);
	process.exitCode = 1;
}
