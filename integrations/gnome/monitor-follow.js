// Runs inside GNOME Shell: coordinates are compositor logical pixels, including
// negative monitor origins and mixed display scaling. No root/input access needed.
export class MonitorFollower {
    constructor(shell, main, glib, clutter) {
        this.shell = shell;
        this.main = main;
        this.glib = glib;
        this.buttonMask = clutter.ModifierType.BUTTON1_MASK |
            clutter.ModifierType.BUTTON2_MASK | clutter.ModifierType.BUTTON3_MASK;
        this._timer = 0;
        this._focusSignal = 0;
        this._buttons = 0;
    }

    enable() {
        this._buttons = this.shell.get_pointer()[2] & this.buttonMask;
        // Polling also covers desktop clicks, which do not change window focus.
        // Focus notifications cover short clicks between pointer samples.
        this._timer = this.glib.timeout_add(this.glib.PRIORITY_DEFAULT, 30, () => {
            const [x, y, modifiers] = this.shell.get_pointer();
            const buttons = modifiers & this.buttonMask;
            const pressed = buttons & ~this._buttons;
            this._buttons = buttons;
            if (pressed)
                this._followPoint(x, y);
            return this.glib.SOURCE_CONTINUE;
        });
        this._focusSignal = this.shell.display.connect('notify::focus-window', () => {
            const focused = this.shell.display.focus_window;
            if (focused && !this._isCompanion(focused))
                this._moveTo(focused.get_monitor());
        });
    }

    disable() {
        if (this._timer)
            this.glib.Source.remove(this._timer);
        if (this._focusSignal)
            this.shell.display.disconnect(this._focusSignal);
        this._timer = 0;
        this._focusSignal = 0;
        this._buttons = 0;
    }

    _isCompanion(window) {
        const appIds = [window.get_wm_class(), window.get_gtk_application_id()];
        return window.get_title() === 'Rodela Companion' && appIds.some(id =>
            typeof id === 'string' && /^(rodela-companion|rodela companion|com\.raiyanhossain\.rodelacompanion)$/i.test(id));
    }

    _followPoint(x, y) {
        const monitor = this.main.layoutManager.monitors.find(m =>
            x >= m.x && x < m.x + m.width &&
            y >= m.y && y < m.y + m.height);
        if (monitor)
            this._moveTo(monitor.index);
    }

    _moveTo(index) {
        if (this.main.overview.visible || this.main.sessionMode.isLocked ||
            !this.main.layoutManager.monitors.some(m => m.index === index))
            return;

        for (const actor of this.shell.get_window_actors()) {
            const window = actor.meta_window;
            if (!this._isCompanion(window) || window.get_monitor() === index ||
                window.minimized)
                continue;

            try {
                window.move_to_monitor(index);
                const area = window.get_work_area_for_monitor(index);
                const frame = window.get_frame_rect();
                const margin = 16;
                window.move_frame(false,
                    area.x + Math.max(0, area.width - frame.width - margin),
                    area.y + Math.max(0, area.height - frame.height - margin));
                // Do not activate/focus: the application just clicked keeps input.
            } catch (error) {
                console.error(`Rodela monitor move failed: ${error}`);
            }
        }
    }
}
