import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {MonitorFollower} from './monitor-follow.js';

export default class RodelaActiveMonitor extends Extension {
    enable() {
        this._follower = new MonitorFollower(global, Main, GLib, Clutter);
        this._follower.enable();
    }

    disable() {
        this._follower?.disable();
        this._follower = null;
    }
}
