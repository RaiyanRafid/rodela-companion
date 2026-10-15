#!/bin/sh
set -eu

uuid='rodela-follow-monitor@rodela-companion'
source_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
data_dir=${XDG_DATA_HOME:-"$HOME/.local/share"}
destination="$data_dir/gnome-shell/extensions/$uuid"

if ! command -v gnome-shell >/dev/null || ! command -v gnome-extensions >/dev/null; then
    echo 'Run this script in a terminal on your GNOME desktop (outside the app sandbox).' >&2
    exit 1
fi
shell_version=$(gnome-shell --version)
case "$shell_version" in
    'GNOME Shell 46.'*) ;;
    *) echo "This integration currently targets GNOME Shell 46; found: $shell_version" >&2; exit 1 ;;
esac

# Only replace this integration's files; preserve other extensions and settings.
if gnome-extensions info "$uuid" >/dev/null 2>&1; then
    gnome-extensions disable "$uuid"
fi
mkdir -p "$destination"
for file in metadata.json extension.js monitor-follow.js; do
    cp "$source_dir/$file" "$destination/$file"
done

if gnome-extensions enable "$uuid"; then
    echo 'Rodela Active Monitor enabled. Start Rodela and click another monitor.'
else
    if command -v gjs >/dev/null; then
        gjs -c '
            const Gio = imports.gi.Gio;
            const settings = new Gio.Settings({schema_id: "org.gnome.shell"});
            const enabled = settings.get_strv("enabled-extensions");
            if (!enabled.includes(ARGV[0]))
                settings.set_strv("enabled-extensions", [...enabled, ARGV[0]]);
            Gio.Settings.sync();
        ' "$uuid"
        echo 'Installed and added to enabled extensions. Log out and log back in to load it.'
    else
        echo 'Installed. Log out and log back in, then run:'
        echo "gnome-extensions enable $uuid"
    fi
fi
