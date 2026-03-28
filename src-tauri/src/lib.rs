mod commands;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::files::list_directory,
            commands::files::get_file_info,
            commands::files::watch_directory,
            commands::files::unwatch_directory,
            commands::images::get_thumbnail,
            commands::images::get_image_data,
            commands::images::get_image_dimensions,
            commands::settings::get_settings,
            commands::settings::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
