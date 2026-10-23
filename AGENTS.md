# SMART CONTROL — Agent Instructions & Workflow

Always operate in full autonomous mode for this workspace:
1. Implement features, fix bugs, and verify changes.
2. Run `npm.cmd run build` to verify 0 errors.
3. Commit and push changes to `main` on GitHub.
4. Deploy to Vercel production and confirm the live status.
5. Provide clear, concise Uzbek responses with the live link.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
