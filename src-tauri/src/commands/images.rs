use base64::Engine;
use serde::Serialize;
use std::path::Path;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
pub struct ImageDimensions {
    pub width: u32,
    pub height: u32,
}

/// Response for get_image_data. For browser-native formats, returns the file
/// path so the frontend can use Tauri's asset protocol (avoids expensive base64
/// encoding for large files). For HEIC/HEIF, returns base64 data since browsers
/// cannot display these natively.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum ImageDataResponse {
    #[serde(rename = "path")]
    Path { path: String, mime: String },
    #[serde(rename = "base64")]
    Base64 { data: String },
}

/// Build a thumbnail cache key that includes the file's mtime, so the cache is
/// automatically invalidated when the source file changes.
pub fn thumbnail_cache_key(path: &str, size: u32, mtime: u64) -> String {
    format!(
        "{}-{}-{}",
        path.replace(['/', '\\', ':'], "_"),
        size,
        mtime,
    )
}

#[tauri::command]
pub fn get_thumbnail(
    path: &str,
    size: u32,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let img_path = Path::new(path);
    if !img_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    // Use mtime in cache key so stale thumbnails are regenerated
    let mtime = super::mtime_ms(img_path);
    let cache_key = thumbnail_cache_key(path, size, mtime);
    let cache_path = state.thumbnail_cache_dir.join(format!("{}.png", cache_key));

    if cache_path.exists() {
        let data = std::fs::read(&cache_path)
            .map_err(|e| format!("Failed to read cached thumbnail: {}", e))?;
        let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
        return Ok(format!("data:image/png;base64,{}", b64));
    }

    // Generate thumbnail
    let img = image::open(img_path).map_err(|e| format!("Failed to open image: {}", e))?;
    let thumb = img.thumbnail(size, size);
    let mut buf = Vec::new();
    thumb
        .write_to(
            &mut std::io::Cursor::new(&mut buf),
            image::ImageFormat::Png,
        )
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    // Cache it
    std::fs::write(&cache_path, &buf).ok();

    let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
    Ok(format!("data:image/png;base64,{}", b64))
}

/// Get image data for display. For standard browser-native formats (JPEG, PNG,
/// GIF, WebP, BMP, SVG, ICO, AVIF, TIFF), returns the file path so the
/// frontend can use Tauri's `convertFileSrc()` / asset protocol. For HEIC/HEIF
/// files, converts to PNG and returns base64 since browsers cannot render these.
#[tauri::command]
pub fn get_image_data(path: &str) -> Result<ImageDataResponse, String> {
    let img_path = Path::new(path);
    if !img_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let ext = img_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // For HEIC files, convert to PNG and return as base64
    if ext == "heic" || ext == "heif" {
        return convert_heic_to_base64(path).map(|data| ImageDataResponse::Base64 { data });
    }

    // For standard formats, return the file path so the frontend can use
    // Tauri's asset protocol (much more efficient than base64 for large files)
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "avif" => "image/avif",
        "tiff" | "tif" => "image/tiff",
        _ => "application/octet-stream",
    };

    Ok(ImageDataResponse::Path {
        path: img_path
            .canonicalize()
            .map_err(|e| format!("Failed to resolve path: {}", e))?
            .to_string_lossy()
            .to_string(),
        mime: mime.to_string(),
    })
}

/// Get image dimensions without fully decoding the image data.
/// Uses `image::ImageReader` to read only the header/metadata.
#[tauri::command]
pub fn get_image_dimensions(path: &str) -> Result<ImageDimensions, String> {
    let reader = image::ImageReader::open(path)
        .map_err(|e| format!("Failed to open image: {}", e))?;
    let (width, height) = reader
        .into_dimensions()
        .map_err(|e| format!("Failed to read dimensions: {}", e))?;
    Ok(ImageDimensions { width, height })
}

/// Convert a HEIC/HEIF file to base64-encoded PNG.
///
/// Tries the `image` crate first. If that fails (HEIC support depends on build
/// features), falls back to the `heif-convert` CLI tool from `libheif-examples`.
///
/// ## Installing HEIC support
///
/// To enable the CLI fallback, install `libheif-examples`:
/// - **Debian/Ubuntu**: `sudo apt install libheif-examples`
/// - **macOS (Homebrew)**: `brew install libheif`
/// - **Arch Linux**: `sudo pacman -S libheif`
fn convert_heic_to_base64(path: &str) -> Result<String, String> {
    // Try using the image crate first (may support HEIC depending on features)
    match image::open(path) {
        Ok(img) => {
            let mut buf = Vec::new();
            img.write_to(
                &mut std::io::Cursor::new(&mut buf),
                image::ImageFormat::Png,
            )
            .map_err(|e| format!("Failed to encode: {}", e))?;
            let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
            Ok(format!("data:image/png;base64,{}", b64))
        }
        Err(_) => {
            // Fallback: try heif-convert CLI tool (from libheif-examples).
            // Use a unique temp path per call to avoid races with concurrent requests.
            let nanos = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(0);
            let temp_path = std::env::temp_dir().join(format!("zudo-fv-heic-{}.png", nanos));
            let temp_str = temp_path.to_string_lossy().to_string();

            let output = std::process::Command::new("heif-convert")
                .args([path, &temp_str])
                .output();

            match output {
                Ok(out) if out.status.success() => {
                    let data = std::fs::read(&temp_path)
                        .map_err(|e| format!("Failed to read converted file: {}", e))?;
                    std::fs::remove_file(&temp_path).ok();
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
                    Ok(format!("data:image/png;base64,{}", b64))
                }
                _ => {
                    std::fs::remove_file(&temp_path).ok();
                    Err("HEIC decoding not available. Install libheif-examples (heif-convert) for HEIC support."
                        .to_string())
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_thumbnail_cache_key_includes_mtime() {
        let key1 = thumbnail_cache_key("/home/user/photo.jpg", 200, 1000);
        let key2 = thumbnail_cache_key("/home/user/photo.jpg", 200, 2000);
        // Different mtime should produce different keys
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_thumbnail_cache_key_includes_size() {
        let key1 = thumbnail_cache_key("/home/user/photo.jpg", 100, 1000);
        let key2 = thumbnail_cache_key("/home/user/photo.jpg", 200, 1000);
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_thumbnail_cache_key_sanitizes_path() {
        let key = thumbnail_cache_key("/home/user/photo.jpg", 200, 1000);
        assert!(!key.contains('/'));
        assert!(!key.contains('\\'));
        assert!(!key.contains(':'));
    }

    #[test]
    fn test_thumbnail_cache_key_deterministic() {
        let key1 = thumbnail_cache_key("/home/user/photo.jpg", 200, 1000);
        let key2 = thumbnail_cache_key("/home/user/photo.jpg", 200, 1000);
        assert_eq!(key1, key2);
    }
}
