use std::sync::mpsc;
use std::time::{Duration, Instant};

use notify::{EventKind, RecursiveMode, Watcher};
use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Emitter, State};

use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub size: u64,
    pub modified_at: String,
    /// Milliseconds since UNIX epoch, used for sorting by date
    pub modified_at_ms: u64,
    pub extension: String,
    pub is_image: bool,
    pub is_heic: bool,
}

const IMAGE_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff", "tif", "ico", "avif",
];

const HEIC_EXTENSIONS: &[&str] = &["heic", "heif"];

pub fn is_image_ext(ext: &str) -> bool {
    let lower = ext.to_lowercase();
    IMAGE_EXTENSIONS.contains(&lower.as_str()) || HEIC_EXTENSIONS.contains(&lower.as_str())
}

pub fn is_heic_ext(ext: &str) -> bool {
    HEIC_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

fn modified_at_ms(metadata: &fs::Metadata) -> u64 {
    metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn modified_at_rfc3339(metadata: &fs::Metadata) -> String {
    metadata
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
        .unwrap_or_default()
}

fn build_file_entry(
    name: String,
    full_path: String,
    metadata: &fs::Metadata,
    extension: String,
) -> FileEntry {
    let file_type = if metadata.is_symlink() {
        // Follow the symlink to determine the target type
        match fs::metadata(&full_path) {
            Ok(target_meta) if target_meta.is_dir() => "directory",
            _ => "symlink",
        }
    } else if metadata.is_dir() {
        "directory"
    } else {
        "file"
    };

    FileEntry {
        name,
        path: full_path,
        file_type: file_type.to_string(),
        size: metadata.len(),
        modified_at: modified_at_rfc3339(metadata),
        modified_at_ms: modified_at_ms(metadata),
        extension: extension.clone(),
        is_image: is_image_ext(&extension),
        is_heic: is_heic_ext(&extension),
    }
}

/// List directory contents with optional filtering and sorting.
///
/// - `show_hidden`: If false (default), entries starting with `.` are filtered out.
/// - `sort_by`: "name" (default), "date", "size", or "type".
/// - `sort_order`: "asc" (default) or "desc".
#[tauri::command]
pub fn list_directory(
    path: &str,
    show_hidden: Option<bool>,
    sort_by: Option<String>,
    sort_order: Option<String>,
) -> Result<Vec<FileEntry>, String> {
    let dir = Path::new(path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let show_hidden = show_hidden.unwrap_or(false);
    let sort_by = sort_by.unwrap_or_else(|| "name".to_string());
    let sort_order = sort_order.unwrap_or_else(|| "asc".to_string());

    let mut entries = Vec::new();
    let read_dir = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let metadata = match entry.path().symlink_metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let name = entry.file_name().to_string_lossy().to_string();

        // Filter hidden files
        if !show_hidden && name.starts_with('.') {
            continue;
        }

        let full_path = entry.path().to_string_lossy().to_string();
        let extension = entry
            .path()
            .extension()
            .map(|e| e.to_string_lossy().to_string())
            .unwrap_or_default();

        entries.push(build_file_entry(name, full_path, &metadata, extension));
    }

    // Sort: directories always come first, then apply sort within each group
    entries.sort_by(|a, b| {
        // Directories first
        let a_is_dir = a.file_type == "directory";
        let b_is_dir = b.file_type == "directory";
        if a_is_dir != b_is_dir {
            return if a_is_dir {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            };
        }

        let ordering = match sort_by.as_str() {
            "date" => a.modified_at_ms.cmp(&b.modified_at_ms),
            "size" => a.size.cmp(&b.size),
            "type" => {
                let ext_cmp = a.extension.to_lowercase().cmp(&b.extension.to_lowercase());
                if ext_cmp == std::cmp::Ordering::Equal {
                    a.name.to_lowercase().cmp(&b.name.to_lowercase())
                } else {
                    ext_cmp
                }
            }
            // "name" or default
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        };

        if sort_order == "desc" {
            ordering.reverse()
        } else {
            ordering
        }
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

    Ok(build_file_entry(
        name,
        path.to_string(),
        &metadata,
        extension,
    ))
}

// ---------------------------------------------------------------------------
// Directory watching
// ---------------------------------------------------------------------------

#[derive(Clone, Serialize)]
struct DirectoryChangedPayload {
    path: String,
}

/// Watch a directory for file changes. Emits `directory:changed` events to the
/// frontend via Tauri's event system. Only one directory can be watched at a
/// time; calling this again replaces the previous watcher.
#[tauri::command]
pub fn watch_directory(
    path: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    // Stop any existing watcher first
    unwatch_directory_inner(&state)?;

    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let watched_path = path.clone();
    let (tx, rx) = mpsc::channel::<notify::Event>();

    let mut watcher = notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
        if let Ok(event) = res {
            let _ = tx.send(event);
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(dir, RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;

    // Debounce thread: emits after 300ms of quiet
    std::thread::spawn(move || {
        let debounce = Duration::from_millis(300);
        let mut pending = false;
        let mut last_event_time = Instant::now();

        loop {
            match rx.recv_timeout(debounce) {
                Ok(event) => match event.kind {
                    EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                        pending = true;
                        last_event_time = Instant::now();
                    }
                    _ => {}
                },
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    if pending && last_event_time.elapsed() >= debounce {
                        pending = false;
                        let payload = DirectoryChangedPayload {
                            path: watched_path.clone(),
                        };
                        let _ = app.emit("directory:changed", &payload);
                    }
                }
                Err(mpsc::RecvTimeoutError::Disconnected) => break,
            }
        }
    });

    // Store watcher and watched dir in state
    {
        let mut w = state
            .watcher
            .lock()
            .map_err(|e| format!("Failed to lock watcher: {}", e))?;
        *w = Some(watcher);
    }
    {
        let mut wd = state
            .watched_dir
            .lock()
            .map_err(|e| format!("Failed to lock watched_dir: {}", e))?;
        *wd = Some(path);
    }

    Ok(true)
}

fn unwatch_directory_inner(state: &AppState) -> Result<(), String> {
    {
        let mut w = state
            .watcher
            .lock()
            .map_err(|e| format!("Failed to lock watcher: {}", e))?;
        *w = None;
    }
    {
        let mut wd = state
            .watched_dir
            .lock()
            .map_err(|e| format!("Failed to lock watched_dir: {}", e))?;
        *wd = None;
    }
    Ok(())
}

/// Stop watching the current directory.
#[tauri::command]
pub fn unwatch_directory(state: State<'_, AppState>) -> Result<bool, String> {
    unwatch_directory_inner(&state)?;
    Ok(true)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_image_ext_standard_formats() {
        assert!(is_image_ext("jpg"));
        assert!(is_image_ext("JPG"));
        assert!(is_image_ext("jpeg"));
        assert!(is_image_ext("png"));
        assert!(is_image_ext("gif"));
        assert!(is_image_ext("webp"));
        assert!(is_image_ext("bmp"));
        assert!(is_image_ext("svg"));
        assert!(is_image_ext("tiff"));
        assert!(is_image_ext("tif"));
        assert!(is_image_ext("ico"));
        assert!(is_image_ext("avif"));
    }

    #[test]
    fn test_is_image_ext_heic_formats() {
        assert!(is_image_ext("heic"));
        assert!(is_image_ext("HEIC"));
        assert!(is_image_ext("heif"));
        assert!(is_image_ext("HEIF"));
    }

    #[test]
    fn test_is_image_ext_non_image() {
        assert!(!is_image_ext("txt"));
        assert!(!is_image_ext("pdf"));
        assert!(!is_image_ext("rs"));
        assert!(!is_image_ext(""));
    }

    #[test]
    fn test_is_heic_ext() {
        assert!(is_heic_ext("heic"));
        assert!(is_heic_ext("HEIC"));
        assert!(is_heic_ext("heif"));
        assert!(!is_heic_ext("jpg"));
        assert!(!is_heic_ext("png"));
        assert!(!is_heic_ext(""));
    }
}
