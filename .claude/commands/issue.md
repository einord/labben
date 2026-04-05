# Create GitHub Issue

Create a GitHub issue on **einord/labben** based on user input.

## Input

$ARGUMENTS

## Instructions

1. **Determine issue type** from the user's description:
   - **Bug** — something is broken or behaving unexpectedly
   - **Feature** — a new capability or enhancement

2. **Gather context** before creating the issue:
   - Read relevant source files mentioned or implied by the description
   - For bugs: try to identify the likely cause by examining the code. Note this analysis in the issue but clearly mark it as a preliminary assessment that may be incorrect.
   - For features: if the description is vague or ambiguous, ask follow-up questions. Do NOT ask about things that are obvious or standard best practice — just make sensible decisions for those.

3. **Create the issue** using `gh issue create` on **einord/labben** with:

   **Title:** A concise, descriptive title (imperative mood for bugs: "Fix X when Y", noun phrase for features: "Add support for X")

   **Labels:**
   - Bug → `bug`
   - Feature → `enhancement`

   **Body format for bugs:**
   ```
   ## Description
   [Clear description of the problem]

   ## Steps to reproduce
   [If applicable — numbered steps]

   ## Expected behavior
   [What should happen]

   ## Actual behavior
   [What happens instead]

   ## Preliminary analysis
   [Code analysis of likely cause, with relevant file paths and line numbers. Always caveat that this is an initial assessment.]

   ## Suggested fix
   [Brief suggestion on how to approach the fix, if applicable]

   ---
   *This issue was created with assistance from Claude* 🤖
   ```

   **Body format for features:**
   ```
   ## Description
   [Clear description of the feature and its purpose]

   ## Motivation
   [Why this feature is needed — what problem does it solve]

   ## Proposed solution
   [High-level approach, referencing existing code/patterns where relevant]

   ## Considerations
   [Edge cases, potential impacts on existing functionality, or open questions — only if non-obvious]

   ---
   *This issue was created with assistance from Claude* 🤖
   ```

4. **Output** the created issue URL when done.
