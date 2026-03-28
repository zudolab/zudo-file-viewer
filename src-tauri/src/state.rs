use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    pub thumbnail_cache_dir: PathBuf,
    pub settings_cache: Mutex<Option<serde_json::Value>>,
    pub settings_mtime: Mutex<u64>,
    pub watcher: Mutex<Option<notify::RecommendedWatcher>>,
    pub watched_dir: Mutex<Option<String>>,
}

impl AppState {
    pub fn new() -> Self {
        let cache_dir = dirs::cache_dir()
            .unwrap_or_else(|| PathBuf::from("/tmp"))
            .join("zudo-file-viewer")
            .join("thumbnails");

        std::fs::create_dir_all(&cache_dir).ok();

        Self {
            thumbnail_cache_dir: cache_dir,
            settings_cache: Mutex::new(None),
            settings_mtime: Mutex::new(0),
            watcher: Mutex::new(None),
            watched_dir: Mutex::new(None),
        }
    }
}
