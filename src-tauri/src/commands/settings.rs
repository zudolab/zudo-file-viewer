use std::fs;
use std::path::PathBuf;
use tauri::State;

use crate::state::AppState;

fn settings_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("zudo-file-viewer");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("settings.json")
}

fn mtime_ms(path: &PathBuf) -> u64 {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<Option<serde_json::Value>, String> {
    let path = settings_path();
    let current_mtime = mtime_ms(&path);

    let stored_mtime = state
        .settings_mtime
        .lock()
        .map(|m| *m)
        .unwrap_or(0);

    let cache = state
        .settings_cache
        .lock()
        .map_err(|e| format!("Failed to lock cache: {}", e))?;

    if let Some(ref cached) = *cache {
        if current_mtime == stored_mtime && current_mtime > 0 {
            return Ok(Some(cached.clone()));
        }
    }
    drop(cache);

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;
    let value: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    if let Ok(mut cache) = state.settings_cache.lock() {
        *cache = Some(value.clone());
    }
    if let Ok(mut m) = state.settings_mtime.lock() {
        *m = current_mtime;
    }

    Ok(Some(value))
}

#[tauri::command]
pub fn save_settings(
    settings: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let path = settings_path();
    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, &content).map_err(|e| format!("Failed to write settings: {}", e))?;

    let new_mtime = mtime_ms(&path);
    if let Ok(mut cache) = state.settings_cache.lock() {
        *cache = Some(settings);
    }
    if let Ok(mut m) = state.settings_mtime.lock() {
        *m = new_mtime;
    }

    Ok(true)
}
