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

3. **Run unit tests** (if any exist):
   ```
   pnpm test
   ```

4. **Run e2e tests** (if the change affects UI or frontend functionality):
   ```
   pnpm test:e2e
   ```
   Skip e2e tests if the change is server-only, config-only, or the user specifies to skip them.

5. **Report results:**
   - If everything passes: confirm all green with a brief summary
   - If there are errors: list them clearly with file paths and line numbers
   - Suggest fixes for any errors found

Do NOT attempt to fix errors automatically unless explicitly asked. This skill is for verification and reporting only.
