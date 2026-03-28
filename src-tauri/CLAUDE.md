# Rust Backend

## Conventions

- All Tauri commands use `Result<T, String>` return types
- Mutex locks: always `.map_err()`, never `.unwrap()` — poisoned mutex must not crash the app
- Settings cached with mtime-based invalidation (check `mtime_ms()` before reading disk)
- File type detection helpers in `commands/mod.rs` (`mtime_ms`)
- File watching uses `notify` crate with 300ms debounce

## HEIC Conversion Strategy

1. Try `image` crate first (may support HEIC depending on build features)
2. Fallback to `heif-convert` CLI from libheif-examples
3. Use unique temp path per conversion to avoid races

## Image Data Response

- Standard formats (jpg, png, gif, webp, etc.): return file path via `ImageDataResponse::Path` — frontend uses `convertFileSrc()` (avoids expensive base64 for large files)
- HEIC/HEIF: convert to PNG, return as `ImageDataResponse::Base64`

## Symlink Handling

Use `symlink_metadata()` for initial detection, then `fs::metadata()` to resolve target type. Symlinks pointing to directories are typed as `"directory"` so the frontend can expand them.
