import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// Context only leaves this desktop when the separately started Hermes bridge runs.
export class ContextExporter {
    constructor(shell, main) {
        this.shell = shell;
        this.main = main;
        this.timer = 0;
        this.path = GLib.build_filenamev([GLib.get_user_runtime_dir(), 'rodela-context.json']);
    }

    enable() {
        this.timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
            const window = this.shell.display.focus_window;
            const paused = this.main.sessionMode.isLocked || this.main.overview.visible;
            const context = {
                captured_at: Date.now() / 1000,
                paused,
                active_app: paused ? null : window?.get_wm_class() ?? null,
                window_title: paused ? null : window?.get_title() ?? null,
                pid: paused ? null : window?.get_pid() ?? null,
            };
            try {
                Gio.File.new_for_path(this.path).replace_contents(
                    JSON.stringify(context), null, false,
                    Gio.FileCreateFlags.PRIVATE | Gio.FileCreateFlags.REPLACE_DESTINATION,
                    null);
            } catch (error) {
                console.error(`Rodela context export failed: ${error}`);
            }
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this.timer)
            GLib.Source.remove(this.timer);
        this.timer = 0;
        GLib.unlink(this.path);
    }
}
