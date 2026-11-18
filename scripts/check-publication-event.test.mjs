import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('./check-publication-event.mjs', import.meta.url));
const malformed = 'Co-authored-by: malformed';

function fixture(t) {
	const cwd = mkdtempSync(path.join(tmpdir(), 'publication-push-'));
	t.after(() => rmSync(cwd, { recursive: true, force: true }));
	const env = {
		...process.env,
		GITHUB_ACTIONS: 'false',
		GITHUB_TOKEN: '',
		GIT_AUTHOR_NAME: 'External Contributor',
		GIT_AUTHOR_EMAIL: 'external@users.noreply.github.com',
		GIT_COMMITTER_NAME: 'External Contributor',
		GIT_COMMITTER_EMAIL: 'external@users.noreply.github.com',
	};
	function git(...args) {
		const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
		assert.equal(result.status, 0, result.stderr);
		return result.stdout.trim();
	}
	git('init', '--quiet');
	git('config', 'commit.gpgsign', 'false');
	git('config', 'core.hooksPath', '/dev/null');
	function commit(message) {
		git('commit', '--allow-empty', '--quiet', '-m', message);
		return git('rev-parse', 'HEAD');
	}
	// Invalid legacy attribution must stay outside the branch delta.
	const base = commit(malformed);
	git('update-ref', 'refs/remotes/origin/main', base);
	function check(event) {
		const eventFile = path.join(cwd, 'event.json');
		writeFileSync(eventFile, JSON.stringify(event));
		return spawnSync(process.execPath, [checker], {
			cwd,
			env: { ...env, GITHUB_EVENT_NAME: 'push', GITHUB_EVENT_PATH: eventFile },
			encoding: 'utf8',
		});
	}
	return { git, commit, check, base };
}

void test('normal pushes inspect only before..after', (t) => {
	const f = fixture(t);
	const before = f.commit(malformed);
	const after = f.commit('incoming change');
	const result = f.check({ before, after, forced: false });
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /OK \(1 commits, 0 annotated tags\)/);
});

void test('normal pushes reject invalid older incoming commits even with a valid tip', (t) => {
	const f = fixture(t);
	f.commit(malformed);
	const after = f.commit('valid tip');
	const result = f.check({ before: f.base, after, forced: false });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /malformed identity trailer/);
});

for (const forced of [true, false]) {
	void test(`divergent pushes inspect the complete replacement delta (forced=${forced})`, (t) => {
		const f = fixture(t);
		const before = f.commit('old branch');
		f.git('checkout', '--quiet', '--detach', f.base);
		f.commit('replacement change');
		const after = f.commit('replacement tip');
		const result = f.check({ before, after, forced });
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /OK \(2 commits, 0 annotated tags\)/);
	});
}

void test('forced pushes work when the old commit is unavailable after checkout', (t) => {
	const f = fixture(t);
	const after = f.commit('replacement change');
	const result = f.check({ before: 'a'.repeat(40), after, forced: true });
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /OK \(1 commits, 0 annotated tags\)/);
});

void test('forced pushes reject invalid commits anywhere in the replacement delta', (t) => {
	const f = fixture(t);
	const before = f.commit('old branch');
	f.git('checkout', '--quiet', '--detach', f.base);
	f.commit(malformed);
	const after = f.commit('valid replacement tip');
	const result = f.check({ before, after, forced: true });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /malformed identity trailer/);
});

void test('new branches inspect their delta against main', (t) => {
	const f = fixture(t);
	const after = f.commit('new branch');
	const result = f.check({ before: '0'.repeat(40), after, forced: false });
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /OK \(1 commits, 0 annotated tags\)/);
});

void test('missing normal-push history fails without skipping inspection', (t) => {
	const f = fixture(t);
	const after = f.commit('incoming change');
	const result = f.check({ before: 'a'.repeat(40), after, forced: false });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /Publication check failed/);
	assert.doesNotMatch(result.stdout, /OK/);
});

void test('forced pushes fail when main has no common ancestor with the replacement', (t) => {
	const f = fixture(t);
	f.git('checkout', '--quiet', '--orphan', 'unrelated');
	const after = f.commit('unrelated replacement');
	const result = f.check({ before: 'a'.repeat(40), after, forced: true });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /Publication check failed/);
});

void test('deleted refs have no incoming objects to inspect', (t) => {
	const f = fixture(t);
	const result = f.check({ deleted: true });
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Deleted ref has no incoming objects/);
});

void test('invalid push object IDs fail before invoking Git', (t) => {
	const f = fixture(t);
	const result = f.check({ before: '--all', after: f.base, forced: true });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /Publication check failed/);
});
