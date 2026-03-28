use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub size: u64,
    pub modified_at: String,
    pub extension: String,
    pub is_image: bool,
    pub is_heic: bool,
}

const IMAGE_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff", "tif", "ico", "avif",
];

const HEIC_EXTENSIONS: &[&str] = &["heic", "heif"];

fn is_image_ext(ext: &str) -> bool {
    let lower = ext.to_lowercase();
    IMAGE_EXTENSIONS.contains(&lower.as_str()) || HEIC_EXTENSIONS.contains(&lower.as_str())
}

fn is_heic_ext(ext: &str) -> bool {
    HEIC_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

#[tauri::command]
pub fn list_directory(path: &str) -> Result<Vec<FileEntry>, String> {
    let dir = Path::new(path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut entries = Vec::new();
    let read_dir = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path().to_string_lossy().to_string();
        let extension = entry
            .path()
            .extension()
            .map(|e| e.to_string_lossy().to_string())
            .unwrap_or_default();
        let file_type = if metadata.is_dir() {
            "directory"
        } else if metadata.is_symlink() {
            "symlink"
        } else {
            "file"
        };
        let modified_at = metadata
            .modified()
            .ok()
            .and_then(|t| {
                t.duration_since(std::time::UNIX_EPOCH)
                    .ok()
                    .map(|d| {
                        chrono::DateTime::from_timestamp(d.as_secs() as i64, 0)
                            .map(|dt| dt.to_rfc3339())
                            .unwrap_or_default()
                    })
            })
            .unwrap_or_default();

        entries.push(FileEntry {
            name,
            path: full_path,
            file_type: file_type.to_string(),
            size: metadata.len(),
            modified_at,
            extension: extension.clone(),
            is_image: is_image_ext(&extension),
            is_heic: is_heic_ext(&extension),
        });
    }

    entries.sort_by(|a, b| {
        // Directories first, then by name
        let type_cmp = a.file_type.cmp(&b.file_type);
        if type_cmp != std::cmp::Ordering::Equal {
            // "directory" < "file" alphabetically, which is what we want
            return type_cmp;
        }
        a.name.to_lowercase().cmp(&b.name.to_lowercase())
    });

    Ok(entries)
}

#[tauri::command]
pub fn get_file_info(path: &str) -> Result<FileEntry, String> {
    let p = Path::new(path);
    let metadata = fs::metadata(p).map_err(|e| format!("Failed to get metadata: {}", e))?;
    let name = p
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    let extension = p
        .extension()
        .map(|e| e.to_string_lossy().to_string())
        .unwrap_or_default();
    let file_type = if metadata.is_dir() {
        "directory"
    } else if metadata.is_symlink() {
        "symlink"
    } else {
        "file"
    };
    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .ok()
                .map(|d| {
                    chrono::DateTime::from_timestamp(d.as_secs() as i64, 0)
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default()
                })
        })
        .unwrap_or_default();

    Ok(FileEntry {
        name,
        path: path.to_string(),
        file_type: file_type.to_string(),
        size: metadata.len(),
        modified_at,
        extension: extension.clone(),
        is_image: is_image_ext(&extension),
        is_heic: is_heic_ext(&extension),
    })
}
