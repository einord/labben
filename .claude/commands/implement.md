# Implement GitHub Issue

Take a GitHub issue and implement it end-to-end: plan, code, PR, review, verify, and (if safe) merge.

## Input

$ARGUMENTS

This should be an issue number (e.g. "42") or a GitHub issue URL.

## Instructions

### Phase 1: Understand the issue

1. Fetch the issue details with `gh issue view <number> --repo einord/labben`
2. Read all relevant source files referenced in or implied by the issue
3. Understand the scope and categorize the task:
   - **Small** — isolated change, single file or a few closely related files, clear solution
   - **Large** — multiple components affected, requires architectural decisions, touches shared types, or spans server + client

### Phase 2: Set up an isolated worktree

Use the `EnterWorktree` tool to create an isolated git worktree for this work. This allows multiple implement sessions to run in parallel on different issues without interfering with each other.

1. First, make sure main is up to date:
   ```
   git pull origin main
   ```
2. Call the `EnterWorktree` tool to enter a new worktree based on main.
3. Inside the worktree, create a descriptive branch:
   ```
   git checkout -b <type>/<short-description>
   ```
   Where type is `fix/` for bugs or `feat/` for features.

### Phase 3: Implement

**For small tasks:** Implement directly — read the relevant code, make the changes, commit with clear messages.

**For large tasks:** Launch an agent team using the Agent tool. Create specialists as needed, for example:
- **Architect agent** — plans the approach, identifies files to change, defines interfaces between components
- **Server agent** (if server changes needed) — implements backend changes in `server/`
- **Client agent** (if frontend changes needed) — implements frontend changes in `app/`
- **Review agent** — challenges decisions and catches missed edge cases

Coordination rules for agent teams:
- Shared types must be updated FIRST if they change, before server/client agents start
- All agents work within the same worktree (already isolated from main in Phase 2)
- The main agent (you) is responsible for coordinating changes and resolving any conflicts
- Each agent should commit its work with clear, descriptive messages

### Phase 3.5: Write tests

After implementation, write tests for new functionality where appropriate:
- Unit tests for pure logic (utilities, server services)
- Skip tests for trivial changes (typo fixes, style-only changes, config updates)

**E2e tests are REQUIRED** when the change involves anything graphical or UI-related — new components, modified UI behavior, page changes, modals, drawer updates, visual features, etc. This is not optional.
- Add Playwright e2e tests to `e2e/` that verify the implemented UI functionality works end-to-end
- Tests should cover the core user-facing behavior introduced or changed
- Use `data-testid` attributes for element selection — add these to components as needed
- E2e tests should be self-contained: create own test data, don't depend on existing state
- Look at existing e2e tests in `e2e/` for patterns and conventions to follow
- **Note:** Auth is required — e2e tests must handle the WebAuthn login flow or bypass it via test configuration

Run all relevant tests and iterate until they pass:
- `pnpm test:e2e` (Playwright) — always run when UI changes were made

### Phase 4: Create Pull Request

1. Push the branch:
   ```
   git push -u origin <branch-name>
   ```
2. Create a PR with `gh pr create`:
   - Title: concise, matches the issue intent
   - Body: reference the issue with "Closes #<number>", summarize what was done and why
   - Link the issue

### Phase 5: Review

Launch a **new agent** to review the PR. This agent should run the `/review-pr` skill on the PR number. This agent must be independent — it has not seen the implementation context and reviews the code fresh.

Wait for the review to complete.

### Phase 6: Address review feedback

1. Read all comments posted by the review agent on the PR
2. For each comment:
   - **If valid and critical:** fix the issue, commit the fix
   - **If valid improvement:** fix it if straightforward, otherwise note it for later
   - **If misunderstood** (the reviewer lacked context): reply to the comment explaining why the current approach is intentional
3. Push all fixes

### Phase 7: Verify

Run the `/verify` skill to ensure everything builds and type-checks cleanly. Fix any errors that come up.

### Phase 8: Finalize

Assess the risk level of this change:

**Auto-merge** (low risk) if ALL of these are true:
- Build, type check, and all tests pass
- No critical review comments remain unresolved
- Change is well-scoped and unlikely to cause side effects
- No risk of data loss or breaking changes
- The review agent approved the PR

To merge: `gh pr merge <number> --squash --delete-branch`

**Ask the user** (elevated risk) if ANY of these are true:
- Changes touch database schema or migrations
- Changes affect data persistence or could cause data loss
- Shared types changed in ways that might affect runtime behavior
- The change is large and complex with many interacting parts
- Review agent requested changes that were addressed but not re-reviewed
- You have any uncertainty about correctness
- The change should be manually tested before merge (e.g., Docker-specific behavior, UI changes)

When asking the user, provide:
- A summary of what was implemented
- The PR URL for manual review
- What specific aspects you're unsure about
- Suggestion on what to test manually

### General guidelines

- Commit often with clear messages — don't bundle unrelated changes
- Follow all project conventions from CLAUDE.md (naming, file size limits, component-first UI, scoped CSS, i18n, etc.)
- Reference the issue number in commits where relevant
- If you get stuck or the issue is unclear, ask the user rather than guessing
- When all work is done (merged or handed off to user), use `ExitWorktree` to clean up the worktree
