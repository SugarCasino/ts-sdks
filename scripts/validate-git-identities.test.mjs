import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { allowedIdentity, githubCommitLogins, inspectMessage } from './validate-git-identities.mjs';

const scanner = fileURLToPath(new URL('./validate-git-identities.mjs', import.meta.url));
const safe = { name: 'External Contributor', email: '12345+external@users.noreply.github.com' };
const personal = { name: 'External Person', email: 'contributor@example.invalid' };

function fixture() {
	const cwd = mkdtempSync(path.join(tmpdir(), 'git-publication-'));
	const env = {
		...process.env,
		GITHUB_ACTIONS: 'false',
		GITHUB_TOKEN: '',
		GIT_AUTHOR_NAME: safe.name,
		GIT_AUTHOR_EMAIL: safe.email,
		GIT_COMMITTER_NAME: safe.name,
		GIT_COMMITTER_EMAIL: safe.email,
	};
	function git(args, overrides = {}) {
		const result = spawnSync('git', args, { cwd, env: { ...env, ...overrides }, encoding: 'utf8' });
		assert.equal(result.status, 0, result.stderr);
		return result.stdout.trim();
	}
	git(['init', '--quiet']);
	git(['config', 'commit.gpgsign', 'false']);
	git(['config', 'tag.gpgsign', 'false']);
	git(['config', 'core.hooksPath', '/dev/null']);
	function commit(message = 'test', overrides = {}) {
		git(['commit', '--allow-empty', '--quiet', '-m', message], overrides);
		return git(['rev-parse', 'HEAD']);
	}
	function scan(args, input, overrides = {}) {
		return spawnSync(process.execPath, [scanner, ...args], {
			cwd,
			env: { ...env, ...overrides },
			encoding: 'utf8',
			input,
		});
	}
	return { cwd, git, commit, scan, cleanup: () => rmSync(cwd, { recursive: true, force: true }) };
}

function assertRedacted(result) {
	assert.ok(!`${result.stdout}${result.stderr}`.includes(personal.email));
}

void test('accepts external names, personal emails and any GitHub noreply identity', () => {
	assert.equal(allowedIdentity(safe.name, safe.email), true);
	assert.equal(allowedIdentity(personal.name, personal.email), true);
	assert.equal(allowedIdentity('Another Contributor', 'other@users.noreply.github.com'), true);
	assert.equal(allowedIdentity('GitHub', 'noreply@github.com'), true);
	for (const [name, email] of [
		['', safe.email],
		[safe.name, 'not-an-email'],
		['Bad\nName', safe.email],
		[safe.name, 'person@example.invalid extra'],
	]) {
		assert.equal(allowedIdentity(name, email), false);
	}
});

void test('accepts external attribution and contact emails while rejecting malformed trailers', () => {
	for (const field of ['Co-authored-by', 'Signed-off-by', 'Reviewed-by', 'Acked-by']) {
		assert.deepEqual(inspectMessage(`${field}: ${personal.name} <${personal.email}>`), []);
		assert.deepEqual(inspectMessage(`> ${field}: ${safe.name} <${safe.email}>`), []);
		assert.deepEqual(inspectMessage(`${field}: malformed`), ['malformed identity trailer']);
	}
	assert.deepEqual(inspectMessage(`Please contact ${personal.email} about this change.`), []);
});

void test('accepts external authors and committers across the complete incoming range', () => {
	const f = fixture();
	try {
		const base = f.commit();
		f.commit('external author', {
			GIT_AUTHOR_NAME: personal.name,
			GIT_AUTHOR_EMAIL: personal.email,
		});
		f.commit('external committer', {
			GIT_COMMITTER_NAME: personal.name,
			GIT_COMMITTER_EMAIL: personal.email,
		});
		const head = f.commit(`Co-authored-by: ${personal.name} <${personal.email}>`);
		const result = f.scan(['--range', base, head]);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stderr, /warning does not block external contributions/);
		assertRedacted(result);
	} finally {
		f.cleanup();
	}
});

void test('checks malformed older identities even when the newest commit is valid', () => {
	const f = fixture();
	try {
		const base = f.commit();
		f.commit('malformed author', { GIT_AUTHOR_EMAIL: 'not-an-email' });
		const head = f.commit('valid latest');
		const result = f.scan(['--range', base, head]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /malformed author identity/);
		assert.ok(!result.stderr.includes('not-an-email'));
		const bad = f.commit('malformed committer', { GIT_COMMITTER_EMAIL: 'not-an-email' });
		assert.match(f.scan(['--range', head, bad]).stderr, /malformed committer identity/);
	} finally {
		f.cleanup();
	}
});

void test('allows personal Git configuration and only warns without exposing the email', () => {
	const f = fixture();
	try {
		const result = f.scan(['--config'], undefined, {
			GIT_AUTHOR_NAME: personal.name,
			GIT_AUTHOR_EMAIL: personal.email,
		});
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stderr, /GitHub noreply/);
		assertRedacted(result);
		assert.equal(
			f.scan(['--config'], undefined, { GIT_COMMITTER_EMAIL: 'not-an-email' }).status,
			1,
		);
	} finally {
		f.cleanup();
	}
});

void test('pre-push accepts external attribution and taggers, deletions and new branches', () => {
	const f = fixture();
	try {
		const base = f.commit();
		const zeros = '0'.repeat(40);
		const head = f.commit(
			`External contribution\n\nSigned-off-by: ${personal.name} <${personal.email}>`,
		);
		assert.equal(
			f.scan(['--pre-push'], `refs/heads/test ${head} refs/heads/test ${base}\n`).status,
			0,
		);
		assert.equal(
			f.scan(['--pre-push'], `refs/heads/test ${head} refs/heads/test ${zeros}\n`).status,
			0,
		);
		assert.equal(
			f.scan(['--pre-push'], `refs/heads/test ${zeros} refs/heads/test ${base}\n`).status,
			0,
		);
		f.git(['tag', '-a', 'external', head, '-m', 'tag'], {
			GIT_COMMITTER_NAME: personal.name,
			GIT_COMMITTER_EMAIL: personal.email,
		});
		const tag = f.git(['rev-parse', 'refs/tags/external']);
		assert.equal(
			f.scan(['--pre-push'], `refs/tags/external ${tag} refs/tags/external ${zeros}\n`).status,
			0,
		);
	} finally {
		f.cleanup();
	}
});

void test('commit-msg accepts personal attribution and rejects malformed attribution', () => {
	const f = fixture();
	try {
		const messageFile = path.join(f.cwd, 'message');
		writeFileSync(messageFile, `Co-authored-by: ${personal.name} <${personal.email}>`);
		const result = f.scan(['--message', messageFile]);
		assert.equal(result.status, 0, result.stderr);
		assertRedacted(result);
		writeFileSync(messageFile, 'Co-authored-by: malformed');
		assert.equal(f.scan(['--message', messageFile]).status, 1);
	} finally {
		f.cleanup();
	}
});

void test('fails on missing history and rejects Git option injection', () => {
	const f = fixture();
	try {
		const head = f.commit();
		assert.equal(f.scan(['--range', '1'.repeat(40), head]).status, 1);
		assert.equal(f.scan(['--range', '--all', head]).status, 1);
	} finally {
		f.cleanup();
	}
});

void test('fork PRs accept external commits and personal contact metadata without executing the text', () => {
	const f = fixture();
	try {
		const base = f.commit();
		const head = f.commit('external contribution', {
			GIT_AUTHOR_NAME: personal.name,
			GIT_AUTHOR_EMAIL: personal.email,
		});
		const eventFile = path.join(f.cwd, 'event.json');
		const marker = path.join(f.cwd, 'must-not-exist');
		const ci = fileURLToPath(new URL('./check-publication-event.mjs', import.meta.url));
		function event(body) {
			writeFileSync(
				eventFile,
				JSON.stringify({
					pull_request: {
						title: 'External contribution',
						body,
						base: { sha: base },
						head: { sha: head, repo: { fork: true } },
					},
				}),
			);
			return spawnSync(process.execPath, [ci], {
				cwd: f.cwd,
				env: {
					...process.env,
					GITHUB_ACTIONS: 'false',
					GITHUB_TOKEN: '',
					GITHUB_EVENT_NAME: 'pull_request',
					GITHUB_EVENT_PATH: eventFile,
				},
				encoding: 'utf8',
			});
		}
		const result = event(
			`Contact ${personal.email}. Co-authored-by: ${personal.name} <${personal.email}>`,
		);
		assert.equal(result.status, 0, result.stderr);
		assertRedacted(result);
		assert.equal(event(`Literal $(touch ${marker}) and \`touch ${marker}\``).status, 0);
		assert.equal(existsSync(marker), false);
		assert.equal(event('Co-authored-by: malformed').status, 1);
	} finally {
		f.cleanup();
	}
});

void test('members must use noreply emails while external contributors keep their own emails', () => {
	for (const member of ['FakieSui', 'Furbor', 'furbOR']) {
		assert.equal(allowedIdentity(member, personal.email), false);
		assert.equal(allowedIdentity(member, '12345+Furbor@users.noreply.github.com'), true);
	}
	assert.equal(allowedIdentity(personal.name, personal.email, 'FakieSui'), false);
	assert.equal(allowedIdentity(personal.name, personal.email, 'outside-contributor'), true);
	assert.deepEqual(inspectMessage(`Co-authored-by: FakieSui <${personal.email}>`), [
		'personal email for organization member',
	]);
});

void test('member personal emails fail local configuration, commit attribution and tag checks', () => {
	const f = fixture();
	try {
		const base = f.commit();
		const config = f.scan(['--config'], undefined, {
			GIT_AUTHOR_NAME: 'FakieSui',
			GIT_AUTHOR_EMAIL: personal.email,
		});
		assert.equal(config.status, 1);
		assertRedacted(config);
		const member = f.commit('member author', {
			GIT_AUTHOR_NAME: 'Furbor',
			GIT_AUTHOR_EMAIL: personal.email,
		});
		const author = f.scan(['--range', base, member]);
		assert.equal(author.status, 1);
		assert.match(author.stderr, /author: personal email for organization member/);
		assertRedacted(author);
		const head = f.commit('member committer', {
			GIT_COMMITTER_NAME: 'FakieSui',
			GIT_COMMITTER_EMAIL: personal.email,
		});
		assert.equal(f.scan(['--range', member, head]).status, 1);
		const messageFile = path.join(f.cwd, 'message');
		writeFileSync(messageFile, `Co-authored-by: Furbor <${personal.email}>`);
		assert.equal(f.scan(['--message', messageFile]).status, 1);
		f.git(['tag', '-a', 'member', base, '-m', 'tag'], {
			GIT_COMMITTER_NAME: 'FakieSui',
			GIT_COMMITTER_EMAIL: personal.email,
		});
		const tag = f.git(['rev-parse', 'refs/tags/member']);
		assert.equal(
			f.scan(['--pre-push'], `refs/tags/member ${tag} refs/tags/member ${'0'.repeat(40)}\n`).status,
			1,
		);
	} finally {
		f.cleanup();
	}
});

void test('member maintainers can commit external contributions without rejecting the external author', () => {
	const f = fixture();
	try {
		const base = f.commit();
		const head = f.commit('reviewed external contribution', {
			GIT_AUTHOR_NAME: personal.name,
			GIT_AUTHOR_EMAIL: personal.email,
			GIT_COMMITTER_NAME: 'FakieSui',
			GIT_COMMITTER_EMAIL: '12345+FakieSui@users.noreply.github.com',
		});
		assert.equal(f.scan(['--range', base, head]).status, 0);
	} finally {
		f.cleanup();
	}
});

void test('GitHub account resolution uses the read-only token, validates responses and redacts failures', () => {
	const sha = 'a'.repeat(40);
	const env = { GITHUB_ACTIONS: 'true', GITHUB_TOKEN: 'synthetic-read-only-token' };
	const accounts = githubCommitLogins(sha, env, (command, args, options) => {
		assert.equal(command, 'gh');
		assert.equal(args[1], `repos/SugarCasino/ts-sdks/commits/${sha}`);
		assert.equal(options.env.GH_TOKEN, env.GITHUB_TOKEN);
		return { status: 0, stdout: '{"author":"FakieSui","committer":null}' };
	});
	assert.equal(allowedIdentity(personal.name, personal.email, accounts.author), false);
	assert.deepEqual(githubCommitLogins(sha, { GITHUB_ACTIONS: 'false' }), {});
	assert.throws(
		() => githubCommitLogins(sha, { GITHUB_ACTIONS: 'true' }),
		/read-only GitHub token/,
	);
	for (const response of [
		{ status: 1, stderr: personal.email },
		{ status: 0, stdout: personal.email },
		{ status: 0, stdout: '{"author":123}' },
		{ status: 0, stdout: '{}' },
	]) {
		assert.throws(
			() => githubCommitLogins(sha, env, () => response),
			(error) => !error.message.includes(personal.email),
		);
	}
});

void test('CI rejects a member using a different Git name and a personal email', () => {
	const f = fixture();
	try {
		const base = f.commit();
		const head = f.commit('different Git name', {
			GIT_AUTHOR_NAME: personal.name,
			GIT_AUTHOR_EMAIL: personal.email,
		});
		const gh = path.join(f.cwd, 'gh');
		writeFileSync(
			gh,
			'#!/bin/sh\nprintf \'%s\\n\' \'{"author":"FakieSui","committer":"outside-contributor"}\'\n',
		);
		chmodSync(gh, 0o755);
		const result = f.scan(['--range', base, head], undefined, {
			GITHUB_ACTIONS: 'true',
			GITHUB_TOKEN: 'synthetic-token',
			PATH: `${f.cwd}${path.delimiter}${process.env.PATH}`,
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /author: personal email for organization member/);
		assertRedacted(result);
	} finally {
		f.cleanup();
	}
});
