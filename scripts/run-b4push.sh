#!/usr/bin/env bash
set -euo pipefail

START_TIME=$(date +%s)
FAILURES=()

step() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; FAILURES+=("$1"); }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Step 1: TypeScript type check
step "Step 1/4: TypeScript type check"
if (cd "$ROOT_DIR" && pnpm exec tsc --noEmit); then
  pass "TypeScript passed"
else
  fail "TypeScript type check"
fi

# Step 2: Frontend build
step "Step 2/4: Frontend build (Vite)"
if (cd "$ROOT_DIR" && pnpm exec vite build); then
  pass "Frontend build passed"
else
  fail "Frontend build"
fi

# Step 3: Tests
step "Step 3/4: Tests (Vitest)"
if (cd "$ROOT_DIR" && pnpm exec vitest run); then
  pass "Tests passed"
else
  fail "Tests"
fi

# Step 4: Rust check (skip if system deps missing)
step "Step 4/4: Rust check (cargo check)"
if command -v cargo &>/dev/null; then
  if (cd "$ROOT_DIR/src-tauri" && cargo check 2>&1); then
    pass "Rust check passed"
  else
    echo "⚠️  Rust check failed (may need system deps: libgtk-3-dev, libwebkit2gtk-4.1-dev)"
    fail "Rust check"
  fi
else
  echo "⚠️  Cargo not found, skipping Rust check"
  pass "Rust check skipped (no cargo)"
fi

# Summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SUMMARY (${DURATION}s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#FAILURES[@]} -eq 0 ]; then
  echo "✅ All checks passed! Safe to push."
  exit 0
else
  echo "❌ ${#FAILURES[@]} check(s) failed:"
  for f in "${FAILURES[@]}"; do
    echo "   - $f"
  done
  exit 1
fi
