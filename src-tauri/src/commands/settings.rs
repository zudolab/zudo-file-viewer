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

/// Default settings generated when no settings file exists yet.
fn default_settings() -> serde_json::Value {
    serde_json::json!({
        "showHidden": false,
        "sortBy": "name",
        "sortOrder": "asc",
        "thumbnailSize": 200
    })
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let path = settings_path();
    let current_mtime = mtime_ms(&path);

    let stored_mtime = state
        .settings_mtime
        .lock()
        .map_err(|e| format!("Failed to lock mtime: {}", e))
        .map(|m| *m)
        .unwrap_or(0);

    // Return cached value if mtime hasn't changed
    {
        let cache = state
            .settings_cache
            .lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;

        if let Some(ref cached) = *cache {
            if current_mtime == stored_mtime && current_mtime > 0 {
                return Ok(cached.clone());
            }
        }
    }

    // If file doesn't exist, generate defaults, write, and cache
    if !path.exists() {
        let defaults = default_settings();
        let content = serde_json::to_string_pretty(&defaults)
            .map_err(|e| format!("Failed to serialize defaults: {}", e))?;
        fs::write(&path, &content)
            .map_err(|e| format!("Failed to write default settings: {}", e))?;

        let new_mtime = mtime_ms(&path);
        if let Ok(mut cache) = state.settings_cache.lock() {
            *cache = Some(defaults.clone());
        }
        if let Ok(mut m) = state.settings_mtime.lock() {
            *m = new_mtime;
        }
        return Ok(defaults);
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;
    let value: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    // Validate that settings is a JSON object
    if !value.is_object() {
        return Err("Settings must be a JSON object".to_string());
    }

    if let Ok(mut cache) = state.settings_cache.lock() {
        *cache = Some(value.clone());
    }
    if let Ok(mut m) = state.settings_mtime.lock() {
        *m = current_mtime;
    }

    Ok(value)
}

#[tauri::command]
pub fn save_settings(
    settings: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    // Validate that settings is a JSON object
    if !settings.is_object() {
        return Err("Settings must be a JSON object".to_string());
    }

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings_is_object() {
        let defaults = default_settings();
        assert!(defaults.is_object());
    }

    #[test]
    fn test_default_settings_has_expected_keys() {
        let defaults = default_settings();
        let obj = defaults.as_object().unwrap();
        assert!(obj.contains_key("showHidden"));
        assert!(obj.contains_key("sortBy"));
        assert!(obj.contains_key("sortOrder"));
        assert!(obj.contains_key("thumbnailSize"));
    }

    #[test]
    fn test_default_settings_roundtrip() {
        let defaults = default_settings();
        let serialized = serde_json::to_string_pretty(&defaults).unwrap();
        let deserialized: serde_json::Value = serde_json::from_str(&serialized).unwrap();
        assert_eq!(defaults, deserialized);
    }

    #[test]
    fn test_settings_validation_rejects_non_object() {
        // Arrays, strings, numbers should be rejected
        let array = serde_json::json!([1, 2, 3]);
        assert!(!array.is_object());

        let string = serde_json::json!("hello");
        assert!(!string.is_object());

        let number = serde_json::json!(42);
        assert!(!number.is_object());
    }
}
