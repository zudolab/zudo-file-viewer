pub mod files;
pub mod images;
pub mod settings;

use std::path::Path;

/// Returns file modification time in milliseconds since UNIX epoch, or 0 on error.
pub(crate) fn mtime_ms(path: &Path) -> u64 {
    std::fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
