# Publication identity checks

Contributions are open to people outside SugarCasino. External contributors can use their own Git name and email, including a personal email address. SugarCasino members must use a GitHub noreply email. No contributor allowlist is required. The checks validate identity and attribution formatting; they do not authenticate contributors or approve their changes.

Personal email addresses produce an error for recognized SugarCasino member identities and a non-blocking warning for external contributors, without printing the address. Contributors who want to keep their email private can use their GitHub noreply address. Existing history is not rewritten. The rule is applied separately to authors, committers, annotated taggers and attribution trailers, so a member can commit or review an external contribution without rejecting the external author.

Use the Node version from `.node-version`, then install the local hooks with `pnpm install --frozen-lockfile`. The hooks check the effective identity, commit messages and incoming commits in a push. Refresh remote refs before pushing a new branch.

The `Publication privacy` workflow checks incoming PR commits, PR title/body, push ranges and annotated tags. It runs on `pull_request`, including contributions from forks, with read-only repository permissions. Normal pushes inspect `before..after`. New refs and non-fast-forward pushes inspect the delta from the merge base of `origin/main` and the new tip. GitHub's `forced` push flag identifies rewritten history even when the old tip is no longer available after checkout; otherwise the checker tests commit ancestry before selecting the range. The workflow uses the full history provided by checkout (`fetch-depth: 0`); missing history needed for the selected comparison or an unavailable merge base fails the check. Manual dispatch checks the selected branch delta against main. Existing history common to the base is not rechecked; `--all` is an explicit historical audit.

## Member identification

`.github/publication-members.json` lists SugarCasino member GitHub logins and their known Git names. It is a list of protected identities, not an allowlist of contributors. Keep it synchronized when membership changes and add Git-name aliases when needed. The initial logins were checked against the organization membership API: `FakieSui` and `Furbor`.

Local hooks recognize members by Git name or GitHub noreply login. In CI, the checker also uses the GitHub account linked to each commit's author and committer via the read-only repository API, so a different Git name does not bypass the rule for a linked account. A missing or failed API response fails the check without disclosing personal data. An unlinked account or attribution can only be recognized by its known Git name; local hooks cannot infer organization membership from an arbitrary, unknown personal email.

The workflow uses its read-only `GITHUB_TOKEN`, including on fork PRs. It does not need an organization-members secret or a token with organization write access. A failed check does not modify or rewrite commits.

## Maintainer review

Passing these checks does not grant write access or approve a PR. SugarCasino maintainers review contributions before merging. Requiring approval before merge must be configured in GitHub branch protection or repository rulesets, using designated maintainers or a CODEOWNERS team. These scripts do not configure or enforce those GitHub permissions.

## Validation

Tests use synthetic identities and local Git fixtures:

```sh
node --test scripts/validate-git-identities.test.mjs scripts/check-publication-event.test.mjs scripts/dispatch-version-publication-check.test.mjs
node scripts/validate-git-identities.mjs --config
```

## Automated version PRs

The Changesets release job dispatches `publication-privacy.yaml` on the same-repository `changeset-release/*` branch after creating or updating its version PR. The dispatch validates the repository, branch and base; it does not approve or merge the PR. The privacy job has only contents-read permission and does not publish packages.
