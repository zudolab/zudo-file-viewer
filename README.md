# zudo-file-viewer

Desktop file viewer with HEIC image preview, built with Tauri v2.

## Features

- File tree sidebar with recursive expand/collapse and lazy loading
- Image preview with HEIC-to-PNG conversion
- Thumbnail grid with responsive layout and size slider
- Live directory watching with toast notifications
- Dark theme with three-tier CSS token system

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)

#### Linux (Tauri system dependencies)

```bash
sudo apt install pkg-config libglib2.0-dev libgtk-3-dev \
  libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
  libsoup-3.0-dev libayatana-appindicator3-dev librsvg2-dev
```

#### HEIC support (optional)

```bash
# Linux
sudo apt install libheif-examples
# macOS
brew install libheif
```

### Install

```bash
pnpm install
```

### Development

```bash
# Frontend only (mock backend, no Tauri needed)
pnpm dev:mock

# Full Tauri app
pnpm tauri:dev
```

### Build

```bash
pnpm tauri:build
```

### Test

```bash
pnpm test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Rust, Tauri v2 |
| Image Processing | `image` crate, `heif-convert` (HEIC fallback) |
| Testing | Vitest, Testing Library |
| CI | GitHub Actions |

## License

MIT
