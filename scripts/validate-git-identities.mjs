#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const memberPolicy = JSON.parse(
	readFileSync(new URL('../.github/publication-members.json', import.meta.url), 'utf8'),
);

const oid = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const zero = /^0+$/;

export function isOrganizationMember(name, email, login) {
	const normalized = (value) => (typeof value === 'string' ? value.toLowerCase() : '');
	const noreplyLogin = /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i.exec(email ?? '')?.[1];
	return memberPolicy.members.some(
		(member) =>
			[login, noreplyLogin, name].some((value) => normalized(value) === normalized(member.login)) ||
			member.gitNames.some((gitName) => normalized(gitName) === normalized(name)),
	);
}

function isNoreplyEmail(email) {
	return /^(?:[^@]+@users\.noreply\.github\.com|noreply@github\.com)$/i.test(email);
}

function validIdentityFormat(name, email) {
	return (
		typeof name === 'string' &&
		name.trim().length > 0 &&
		!/[<>\r\n]/.test(name) &&
		typeof email === 'string' &&
		/^[^\s<>@]+@[^\s<>@]+$/.test(email)
	);
}

// External contributors remain free to use their own public name and email.
export function allowedIdentity(name, email, login) {
	return (
		validIdentityFormat(name, email) &&
		(!isOrganizationMember(name, email, login) || isNoreplyEmail(email))
	);
}

// GitHub resolves a personal-email commit to its account even when its Git name differs.
export function githubCommitLogins(sha, env = process.env, run = spawnSync) {
	if (env.GITHUB_ACTIONS !== 'true') {
		return {};
	}
	requireOid(sha);
	if (!env.GITHUB_TOKEN) {
		throw new Error('A read-only GitHub token is required to identify commit accounts.');
	}
	const result = run(
		'gh',
		[
			'api',
			`repos/SugarCasino/ts-sdks/commits/${sha}`,
			'--jq',
			'{author: .author.login, committer: .committer.login}',
		],
		{
			env: { ...env, GH_TOKEN: env.GITHUB_TOKEN },
			encoding: 'utf8',
			timeout: 30_000,
			maxBuffer: 1024 * 1024,
		},
	);
	if (result.error || result.status !== 0) {
		throw new Error('Unable to resolve GitHub commit accounts. Values withheld.');
	}
	try {
		const accounts = JSON.parse(result.stdout);
		if (
			!accounts ||
			!['author', 'committer'].every(
				(role) =>
					Object.hasOwn(accounts, role) &&
					(accounts[role] === null || typeof accounts[role] === 'string'),
			)
		) {
			throw new Error();
		}
		return accounts;
	} catch {
		throw new Error('Invalid GitHub commit account response. Values withheld.');
	}
}

function identityProblem(line, login) {
	const match = /^(.*?) <([^<>\r\n]+)>(?: \d+ [+-]\d{4})?$/.exec(line ?? '');
	if (!match || !validIdentityFormat(match[1], match[2])) {
		return 'malformed identity';
	}
	if (!allowedIdentity(match[1], match[2], login)) {
		return 'personal email for organization member';
	}
	return undefined;
}

export function warnAboutPersonalEmails(text) {
	const emails =
		text.match(/[a-z0-9][a-z0-9.!#$%&'*+/=?^_{|}~[\]-]*@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
	if (emails.some((email) => !isNoreplyEmail(email))) {
		console.warn(
			'[git-identities] A public email address is present. Use a GitHub noreply address if you prefer to keep your email private. This warning does not block external contributions.',
		);
	}
}

export function inspectIdentityLine(line) {
	return identityProblem(line) === undefined;
}

export function inspectMessage(message) {
	const problems = [];
	for (const line of message.split('\n')) {
		const trailer =
			/^\s*(?:>\s*|[-*]\s+)*(co-authored-by|signed-off-by|reviewed-by|acked-by):\s*(.*)$/i.exec(
				line,
			);
		if (trailer) {
			const problem = identityProblem(trailer[2]);
			if (problem) {
				problems.push(problem === 'malformed identity' ? 'malformed identity trailer' : problem);
			}
		}
	}
	return [...new Set(problems)];
}

function git(args) {
	const result = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	// Git's stderr can contain local paths and identities. Never relay it.
	if (result.error || result.status !== 0) {
		throw new Error('Git inspection failed; check that the requested objects are fetched locally.');
	}
	return result.stdout;
}

function requireOid(value) {
	if (!oid.test(value ?? '')) {
		throw new Error('Expected a full Git object ID.');
	}
	return value;
}

export function checkObjects(commits, tags = []) {
	const problems = [];
	for (const sha of new Set(commits)) {
		const raw = git(['cat-file', 'commit', requireOid(sha)]);
		warnAboutPersonalEmails(raw);
		const split = raw.indexOf('\n\n');
		const headers = raw.slice(0, split).split('\n');
		const accounts = githubCommitLogins(sha);
		for (const field of ['author', 'committer']) {
			const value = headers.find((line) => line.startsWith(`${field} `))?.slice(field.length + 1);
			const problem = identityProblem(value, accounts[field]);
			if (problem) {
				problems.push({
					sha,
					reason:
						problem === 'malformed identity'
							? `malformed ${field} identity`
							: `${field}: ${problem}`,
				});
			}
		}
		for (const reason of inspectMessage(raw.slice(split + 2))) {
			problems.push({ sha, reason });
		}
	}
	for (const sha of new Set(tags)) {
		const raw = git(['cat-file', 'tag', requireOid(sha)]);
		warnAboutPersonalEmails(raw);
		const split = raw.indexOf('\n\n');
		const tagger = raw
			.slice(0, split)
			.split('\n')
			.find((line) => line.startsWith('tagger '))
			?.slice(7);
		const problem = identityProblem(tagger);
		if (problem) {
			problems.push({
				sha,
				reason:
					problem === 'malformed identity' ? 'malformed tagger identity' : `tagger: ${problem}`,
			});
		}
		for (const reason of inspectMessage(raw.slice(split + 2))) {
			problems.push({ sha, reason });
		}
	}
	return problems;
}

function listCommits(args) {
	return git(['rev-list', ...args])
		.trim()
		.split('\n')
		.filter(Boolean);
}

function tagObjects(sha, output) {
	let current = sha;
	while (git(['cat-file', '-t', requireOid(current)]).trim() === 'tag') {
		output.push(current);
		current = git(['cat-file', 'tag', current]).split('\n')[0].slice('object '.length);
	}
}

export function main(args = process.argv.slice(2)) {
	let commits = [];
	const tags = [];
	if (args[0] === '--config' && args.length === 1) {
		for (const field of ['AUTHOR', 'COMMITTER']) {
			const identity = git(['var', `GIT_${field}_IDENT`]).trim();
			warnAboutPersonalEmails(identity);
			const problem = identityProblem(identity);
			if (problem) {
				throw new Error(
					`${field.toLowerCase()}: ${problem}. SugarCasino members must use a GitHub noreply email. Values withheld.`,
				);
			}
		}
	} else if (args[0] === '--message' && args.length === 2) {
		const message = readFileSync(args[1], 'utf8');
		warnAboutPersonalEmails(message);
		if (inspectMessage(message).length) {
			throw new Error(
				'Invalid attribution in commit message. Organization members must use GitHub noreply emails. Values withheld.',
			);
		}
	} else if (args[0] === '--range' && args.length === 3) {
		const base = requireOid(args[1]);
		const head = requireOid(args[2]);
		commits = listCommits(zero.test(base) ? [head] : [head, `^${base}`]);
		tagObjects(head, tags);
	} else if (args[0] === '--pre-push' && args.length === 1) {
		for (const line of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
			const fields = line.split(/\s+/);
			if (fields.length !== 4) {
				throw new Error('Invalid pre-push input.');
			}
			const local = requireOid(fields[1]);
			const remote = requireOid(fields[3]);
			if (zero.test(local)) {
				continue;
			}
			// New refs inspect every object not already reachable through fetched remotes.
			commits.push(
				...listCommits(zero.test(remote) ? [local, '--not', '--remotes'] : [local, `^${remote}`]),
			);
			tagObjects(local, tags);
		}
	} else if (args[0] === '--all' && args.length === 1) {
		commits = listCommits(['--all']);
		for (const sha of git(['for-each-ref', 'refs/tags', '--format=%(objectname)'])
			.trim()
			.split('\n')
			.filter(Boolean)) {
			tagObjects(sha, tags);
		}
	} else {
		throw new Error(
			'Usage: validate-git-identities.mjs --config | --message FILE | --range BASE_SHA HEAD_SHA | --pre-push | --all',
		);
	}
	const problems = checkObjects(commits, tags);
	for (const item of problems) {
		console.error(`[git-identities] ${item.sha.slice(0, 12)}: ${item.reason}`);
	}
	if (problems.length) {
		throw new Error(
			`${problems.length} identity violation(s). Values withheld. See docs/git-publication-privacy.md.`,
		);
	}
	console.log(
		`[git-identities] OK (${new Set(commits).size} commits, ${new Set(tags).size} annotated tags).`,
	);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	try {
		main();
	} catch (error) {
		console.error(
			`[git-identities] ${error.code ? 'Unable to read publication input. Values withheld.' : error.message}`,
		);
		process.exitCode = 1;
	}
}
