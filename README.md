# Rodela Desktop Companion 🤖✨

An autonomous, cute desktop companion bot tailored for Raiyan's developer workstation.

- **Framework:** Tauri v2 (Rust + React 19 + Tailwind CSS)
- **Auto-Updates:** GitHub Releases via `@tauri-apps/plugin-updater`
- **Windows Autostart:** `@tauri-apps/plugin-autostart`
- **Display:** Transparent, always-on-top, borderless floating companion

For click-to-follow between monitors on **GNOME 46 / Zorin Wayland**, install the
[GNOME integration](integrations/gnome/README.md) with
`sh integrations/gnome/install.sh`. A standard Wayland app cannot implement global
click tracking and arbitrary cross-monitor placement on its own.
