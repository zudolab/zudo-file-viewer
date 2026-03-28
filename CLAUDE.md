# zudo-file-viewer

Tauri v2 desktop file viewer app with HEIC image preview support.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend**: Rust (Tauri v2)
- **Package Manager**: pnpm
- **Testing**: Vitest + @testing-library/react (jsdom)

## Project Structure

```
src/                     # React frontend
  app.tsx                # Main app (sidebar + viewer layout)
  main.tsx               # Tauri entry point
  main-mock.tsx          # Mock entry point (no Tauri needed)
  settings-context.tsx   # Settings provider (React Context)
  tokens.css             # Design tokens (3-tier color system)
  types.ts               # Shared TypeScript types
  backend/               # Backend bridge abstraction
    tauri-adapter.ts     # Tauri IPC adapter
    mock-adapter.ts      # Mock adapter for frontend-only dev
  components/
    file-tree/           # Sidebar file tree (recursive, lazy loading)
    viewer/              # Image preview, file info
    thumbnail-grid.tsx   # Responsive thumbnail grid
    toast.tsx            # Toast notification component
  hooks/
    use-directory.ts     # Directory listing with cache
    use-directory-watcher.ts  # Live filesystem change detection
    use-file-preview.ts  # Image preview data loading
  utils/
    format.ts            # File size, date, type label formatting

src-tauri/               # Rust backend
  src/
    commands/
      files.rs           # Directory listing, sorting, file watching
      images.rs          # Thumbnails, HEIC conversion, dimensions
      settings.rs        # Settings I/O with mtime caching
    state.rs             # AppState (thumbnail cache, watcher, settings)
    lib.rs               # Command registration
```

## Development

```bash
pnpm install             # Install dependencies
pnpm dev:mock            # Frontend-only dev (port 1421, no Tauri needed)
pnpm tauri:dev           # Full Tauri dev (port 1420, needs system deps)
pnpm test                # Run tests
pnpm b4push              # Pre-push validation (tsc + build + test + cargo check)
```

### System Dependencies (Linux)

```bash
sudo apt install pkg-config libglib2.0-dev libgtk-3-dev \
  libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
  libsoup-3.0-dev libayatana-appindicator3-dev librsvg2-dev
```

### HEIC Support

```bash
# Linux
sudo apt install libheif-examples
# macOS
brew install libheif
```

## Architecture

### Backend Bridge

Backend is accessed via `getBackend()` singleton. Two adapters:
- **TauriAdapter**: IPC via `invoke()` + `listen()` for production
- **MockAdapter**: In-memory mock for frontend-only development

### CSS Token System

Three-tier design tokens in `tokens.css`:
1. **Palette** (raw colors): `--palette-bg`, `--palette-accent`, etc.
2. **Theme** (semantic): `--theme-bg-primary`, `--theme-text-primary`, etc.
3. **Tailwind bridge**: `--color-base`, `--color-fg`, `--color-accent`, etc.

Spacing uses `hsp-*` (horizontal) and `vsp-*` (vertical) tokens.
Follow component-first strategy: Tailwind utilities in components, no CSS modules.

### HEIC Handling

Rust backend uses `image` crate for standard formats. For HEIC:
1. Try `image` crate (may support depending on features)
2. Fallback to `heif-convert` CLI tool from libheif-examples

Standard image formats return file paths (asset protocol). HEIC returns base64 PNG.

## Conventions

- kebab-case for file names
- Component-first CSS (Tailwind utilities, no custom CSS classes)
- `useEffect` for Tauri IPC (never `useLayoutEffect`)
- Mutex `.map_err()` in Rust commands (never `.unwrap()`)
- Settings use mtime-based cache invalidation
