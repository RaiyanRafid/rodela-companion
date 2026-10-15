# Active monitor following on GNOME Wayland

The Tauri app does not receive other applications' mouse clicks. This companion
extension runs inside GNOME Shell and moves the existing Rodela window using
Mutter. It targets GNOME Shell **46**, including Zorin's GNOME 46 desktop.
Other compositors and GNOME versions are not supported by this integration.

It also exports active-window metadata to the user-private runtime file
`$XDG_RUNTIME_DIR/rodela-context.json` for the optional
[Hermes bridge](../hermes/README.md). This extension alone sends no network data.

Install from a terminal on the desktop:

```sh
sh integrations/gnome/install.sh
```

If GNOME has not discovered the new extension, log out and log back in, then run:

```sh
gnome-extensions enable rodela-follow-monitor@rodela-companion
```

Start Rodela, then click another monitor. It moves to the bottom-right of that
monitor's work area, above panels/docks. The clicked application keeps focus.
Pointer movement alone does not move Rodela. Switching the focused app by keyboard
also follows that app's monitor. Clicking the desktop works through a 30 ms
pointer-button sample; an unusually short desktop click between samples can be
missed. Focus changes cover short clicks on application windows.

The extension ignores the overview, lock screen, and minimized companion windows.
It matches Rodela's exact title and application ID/window class, uses compositor
coordinates for mixed scaling/negative monitor origins, and removes its timer and
signal handler when disabled. It does not capture keys, consume clicks, activate
windows, or require root/input-group membership. No Rust/frontend rebuild is
needed for this integration, including for an already installed Rodela v0.1.2.

Disable or remove:

```sh
gnome-extensions disable rodela-follow-monitor@rodela-companion
gnome-extensions uninstall rodela-follow-monitor@rodela-companion
```

Tests (mocked Shell API, not a compositor integration test):

```sh
node --test integrations/gnome/monitor-follow.test.js
```

Manual check: test both directions, a desktop click, a click in another app, a
held-button drag across screens, mixed scaling, different panel positions, and
disable/re-enable. Rodela must not steal keyboard focus or jump while merely
moving the pointer. Inspect extension state with `gnome-extensions info
rodela-follow-monitor@rodela-companion`; runtime errors appear in the GNOME Shell
journal (`journalctl --user -b -o cat`, search for Rodela).

References: [Shell pointer state](https://gnome.pages.gitlab.gnome.org/gnome-shell/shell/method.Global.get_pointer.html),
[Mutter window movement](https://gnome.pages.gitlab.gnome.org/mutter/meta/class.Window.html),
[GNOME extension modules](https://gjs.guide/extensions/overview/imports-and-modules.html).
