---
name: b4push
description: >-
  Run comprehensive pre-push validation covering TypeScript, frontend build, tests, and
  Rust check. Use when: (1) Completing a PR or feature implementation, (2) Before pushing
  significant changes, (3) After large refactors, (4) User says 'b4push', 'before push',
  'check everything', or 'ready to push'.
user-invocable: true
allowed-tools:
  - Bash
---

# Before Push Check

Run `pnpm b4push` from the project root. This executes `scripts/run-b4push.sh`:

1. TypeScript type check (`tsc --noEmit`)
2. Frontend build (`vite build`)
3. Tests (`vitest run`)
4. Rust check (`cargo check` in src-tauri/) — skipped if system deps missing

Takes ~30-60s. All steps must pass.

## On failure

1. Read the failure output to identify which step failed
2. Auto-fix what you can:
   - TypeScript errors: fix type issues in source
   - Build errors: fix import/export issues
   - Test failures: investigate and fix failing tests
   - Rust errors: fix compilation issues (may need system deps)
3. Re-run `pnpm b4push` to confirm all checks pass
4. Report the final status
