# Verify Build & Types

Run build and type checking to verify the project compiles cleanly.

## Input

$ARGUMENTS

## Instructions

1. **Type check:**
   ```
   pnpm nuxi typecheck
   ```

2. **Build:**
   ```
   pnpm build
   ```

3. **Run unit tests:**
   ```
   pnpm test
   ```

4. **Run e2e tests (always):**
   ```
   pnpm test:e2e
   ```
   E2e tests include smoke tests (`e2e/smoke.spec.ts`) that verify every main page renders without server errors. These catch SSR crashes, composable misuse, missing imports, and runtime errors that type checks and unit tests cannot detect. **Any change — server or client — can break SSR rendering, so e2e tests must always run.** Only skip if the user explicitly requests it.

5. **Report results:**
   - If everything passes: confirm all green with a brief summary
   - If there are errors: list them clearly with file paths and line numbers
   - Suggest fixes for any errors found
   - **Pay special attention to smoke test failures** — these indicate the app is broken for end users

Do NOT attempt to fix errors automatically unless explicitly asked. This skill is for verification and reporting only.
