# zudo-file-viewer

Tauri v2 desktop file viewer app with HEIC image preview support.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend**: Rust (Tauri v2)
- **Package Manager**: pnpm
- **Testing**: Vitest + @testing-library/react (jsdom)
- **CI**: GitHub Actions (frontend + rust jobs)

## Commands

```bash
pnpm dev:mock       # Frontend-only dev (port 1421, mock backend)
pnpm tauri:dev      # Full Tauri dev (port 1420)
pnpm test           # Run tests (34 tests)
pnpm b4push         # Pre-push validation
```

## Architecture

### Backend Bridge

`getBackend()` singleton with two adapters:
- **TauriAdapter** (`src/backend/tauri-adapter.ts`): IPC via `invoke()` + `listen()`
- **MockAdapter** (`src/backend/mock-adapter.ts`): In-memory mock for `pnpm dev:mock`

### CSS Token System

Three-tier tokens in `src/tokens.css`:
1. **Palette** → `--palette-*` (raw colors)
2. **Theme** → `--theme-*` (semantic)
3. **Tailwind** → `--color-*` (utilities)

Spacing: `hsp-*` (horizontal), `vsp-*` (vertical).

## Conventions

- kebab-case for file names
- Component-first CSS: Tailwind utilities in components, no CSS modules
- `useEffect` for Tauri IPC (never `useLayoutEffect` — causes beach ball)
- Rust Mutex: `.map_err()` never `.unwrap()` (see `src-tauri/CLAUDE.md`)
- Settings: mtime-based cache invalidation
- Image data: file paths for standard formats, base64 only for HEIC

## System Dependencies

```bash
# Linux (Tauri)
sudo apt install pkg-config libglib2.0-dev libgtk-3-dev \
  libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
  libsoup-3.0-dev libayatana-appindicator3-dev librsvg2-dev

# HEIC support: apt install libheif-examples (Linux) / brew install libheif (macOS)
```
