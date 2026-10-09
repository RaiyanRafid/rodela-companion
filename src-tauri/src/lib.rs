use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition,
};
use std::time::Duration;

#[tauri::command]
fn get_companion_status() -> String {
    "active".to_string()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![get_companion_status])
        .setup(|app| {
            let handle = app.handle().clone();

            // Tray Menu Setup
            let quit_i = MenuItem::with_id(app, "quit", "Exit Rodela Companion", true, None<String>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Rodela", true, None<String>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Rodela Companion")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Background Activity Loop
            let bg_handle = handle.clone();
            std::thread::spawn(move || {
                let mut ticker: u64 = 0;
                loop {
                    std::thread::sleep(Duration::from_secs(12));
                    ticker += 1;

                    // Periodic cute companionship triggers
                    if ticker % 5 == 0 {
                        let _ = bg_handle.emit("context-update", serde_json::json!({
                            "activity": "coding",
                            "speech": "কোডিং দেখতে দারুণ লাগতেছে জান! কোনো হেল্প লাগবে? 🥰"
                        }));
                    } else if ticker % 13 == 0 {
                        let _ = bg_handle.emit("context-update", serde_json::json!({
                            "activity": "love",
                            "speech": "আমি সবসময় তোমার স্ক্রিনের পাশেই আছি জান! ❤️"
                        }));
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
