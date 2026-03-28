use base64::Engine;
use image::GenericImageView;
use std::path::Path;
use tauri::State;

use crate::state::AppState;

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

    // Check cache
    let cache_key = format!(
        "{}-{}",
        path.replace(['/', '\\', ':'], "_"),
        size
    );
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

#[tauri::command]
pub fn get_image_data(path: &str) -> Result<String, String> {
    let img_path = Path::new(path);
    if !img_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let ext = img_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // For HEIC files, convert to PNG
    if ext == "heic" || ext == "heif" {
        return convert_heic_to_base64(path);
    }

    // For standard formats, read and encode as base64
    let data =
        std::fs::read(img_path).map_err(|e| format!("Failed to read file: {}", e))?;
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "avif" => "image/avif",
        _ => "application/octet-stream",
    };
    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
    Ok(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
pub fn get_image_dimensions(path: &str) -> Result<(u32, u32), String> {
    let img = image::open(path).map_err(|e| format!("Failed to open image: {}", e))?;
    let (w, h) = img.dimensions();
    Ok((w, h))
}

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
            // Fallback: try heif-convert CLI tool
            let output = std::process::Command::new("heif-convert")
                .args([path, "/tmp/zudo-fv-heic-temp.png"])
                .output();

            match output {
                Ok(out) if out.status.success() => {
                    let data = std::fs::read("/tmp/zudo-fv-heic-temp.png")
                        .map_err(|e| format!("Failed to read converted file: {}", e))?;
                    std::fs::remove_file("/tmp/zudo-fv-heic-temp.png").ok();
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
                    Ok(format!("data:image/png;base64,{}", b64))
                }
                _ => Err(
                    "HEIC decoding not available. Install libheif-examples (heif-convert) for HEIC support."
                        .to_string(),
                ),
            }
        }
    }
}
