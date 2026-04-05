# Review Pull Request

Perform a thorough code review of a pull request on **einord/labben**.

## Input

$ARGUMENTS

This can be a PR number (e.g. "42"), a branch name, or empty (defaults to current branch's open PR).

## Instructions

1. **Identify the PR:**
   - If a PR number is given, use it directly
   - If a branch name is given, find the open PR for that branch
   - If no argument, find the open PR for the current branch
   - Fetch PR details with `gh pr view`

2. **Gather the changes:**
   - Get the full diff with `gh pr diff`
   - Read all changed files in their full context (not just the diff) to understand the surrounding code
   - Check the PR description for intent and context

3. **Review the code** against these criteria:

   **Critical** (must fix before merge):
   - Bugs, logic errors, race conditions
   - Security vulnerabilities (injection, XSS, unvalidated input at boundaries)
   - Data loss risks
   - Breaking changes to shared types or APIs without migration
   - Violations of TypeScript strict mode
   - Missing i18n (hardcoded UI text instead of `$t()` / `t()`)

   **Improvement** (nice to have, non-blocking):
   - Code clarity and readability
   - Better naming or structure
   - Missing edge case handling
   - Performance considerations
   - Consistency with project conventions (CLAUDE.md guidelines)
   - File size approaching 400-line limit

4. **Post review comments** on the PR using `gh`:
   - Use `gh pr review <number> --comment --body "..."` for the overall summary
   - For file-specific comments, use `gh api` to post review comments on specific lines
   - Each comment should be clear about whether it's **Critical** or **Improvement**
   - Be constructive — explain *why* something is an issue and suggest a concrete fix

5. **Overall summary** format posted as the review body:

   ```
   ## Code Review

   ### Critical Issues
   [List of must-fix items, or "None found"]

   ### Improvements
   [List of nice-to-have suggestions]

   ### Summary
   [Brief overall assessment — is this PR ready to merge, or does it need changes?]

   ---
   *Review performed by Claude* 🤖
   ```

6. If there are critical issues, request changes. If only improvements or no issues, approve:
   - Critical issues found: `gh pr review <number> --request-changes --body "..."`
   - No critical issues: `gh pr review <number> --approve --body "..."`

**Important:** You are reviewing as an independent reviewer who has NOT been part of the implementation process. Be fair but thorough. When unsure if something is intentional, phrase it as a question rather than a demand.
