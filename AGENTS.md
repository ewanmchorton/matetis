## Communication
- Communicate with the user in Russian.
- Explain technical decisions in plain language.
- Assume the user is not a professional developer.
- Do not hide important architectural decisions behind jargon.
- Before making significant architectural changes, explain the reason and consequences.
# Project rules
- Before significant changes, inspect the existing code and briefly describe the plan.
- Prefer simple, maintainable solutions. Do not overengineer.
- Follow Feature-Sliced Design where it improves code organization.
- Apply Clean Architecture principles pragmatically, without unnecessary abstraction.
- Keep UI, business logic, data access, and infrastructure concerns separated.
- For PostgreSQL database design, use 3NF by default unless there is a clear reason not to.
- Do not introduce new libraries, services, or architectural layers without explaining why they are needed.
- Do not refactor unrelated code unless explicitly requested.
- Keep changes scoped to the current task.
- After meaningful changes, run relevant typecheck, lint, tests, and build.
- Do not hide errors with `any`, `@ts-ignore`, disabled lint rules, or similar workarounds unless clearly justified.
- Never silently change or delete database schema, migrations, or data.
- If an important architectural decision is unclear, present the options instead of guessing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
