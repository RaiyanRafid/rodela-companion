import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MonitorFollower} from './monitor-follow.js';

function fixture() {
    let pointer = [0, 0, 0];
    let tick;
    let focusChanged;
    const moves = [];
    const removed = [];
    const companion = {
        monitor: 0, minimized: false,
        get_title: () => 'Rodela Companion',
        get_wm_class: () => 'rodela-companion',
        get_gtk_application_id: () => null,
        get_monitor() { return this.monitor; },
        move_to_monitor(index) { this.monitor = index; moves.push(['monitor', index]); },
        get_work_area_for_monitor: () => ({x: -1280, y: 0, width: 1280, height: 984}),
        get_frame_rect: () => ({width: 260, height: 260}),
        move_frame: (...args) => moves.push(['position', ...args]),
    };
    const shell = {
        get_pointer: () => pointer,
        get_window_actors: () => [{meta_window: companion}],
        display: {
            focus_window: null,
            connect: (_, callback) => { focusChanged = callback; return 7; },
            disconnect: id => removed.push(['signal', id]),
        },
    };
    const main = {
        layoutManager: {monitors: [
            {index: 0, x: 0, y: 0, width: 1920, height: 1080},
            {index: 1, x: -1280, y: 0, width: 1280, height: 1024},
        ]},
        overview: {visible: false}, sessionMode: {isLocked: false},
    };
    const glib = {
        PRIORITY_DEFAULT: 0, SOURCE_CONTINUE: true,
        timeout_add: (_, interval, callback) => {
            assert.equal(interval, 30); tick = callback; return 9;
        },
        Source: {remove: id => removed.push(['timer', id])},
    };
    const follower = new MonitorFollower(shell, main, glib,
        {ModifierType: {BUTTON1_MASK: 256, BUTTON2_MASK: 512, BUTTON3_MASK: 1024}});
    follower.enable();
    return {follower, companion, moves, main, shell, removed,
        poll(x, y, buttons = 0) { pointer = [x, y, buttons]; tick(); },
        focus(window) { shell.display.focus_window = window; focusChanged(); },
    };
}

test('pointer movement alone does not move companion; click moves to negative-origin monitor', () => {
    const f = fixture();
    f.poll(-100, 200);
    assert.deepEqual(f.moves, []);
    f.poll(-100, 200, 256);
    assert.deepEqual(f.moves, [['monitor', 1], ['position', false, -276, 708]]);
    // Holding/dragging and repeated clicks on same monitor do not reposition it.
    f.poll(-200, 200, 256);
    f.poll(-200, 200);
    f.poll(-200, 200, 256);
    assert.equal(f.moves.length, 2);
});

test('focus changes cover quick clicks; companion focus never triggers movement', () => {
    const f = fixture();
    f.focus(f.companion);
    assert.deepEqual(f.moves, []);
    f.focus({get_title: () => 'Editor', get_wm_class: () => 'editor',
        get_gtk_application_id: () => null, get_monitor: () => 1});
    assert.equal(f.companion.monitor, 1);
});

test('overview, lock screen, minimized pet, monitor gaps and other apps are ignored', () => {
    const f = fixture();
    f.main.overview.visible = true;
    f.follower._followPoint(-1, 1);
    f.main.overview.visible = false;
    f.main.sessionMode.isLocked = true;
    f.follower._followPoint(-1, 1);
    f.main.sessionMode.isLocked = false;
    f.companion.minimized = true;
    f.follower._followPoint(-1, 1);
    f.companion.minimized = false;
    f.follower._followPoint(-2000, 1);
    f.follower._moveTo(9);
    f.companion.get_wm_class = () => 'unrelated-app';
    f.follower._followPoint(-1, 1);
    assert.deepEqual(f.moves, []);
});

test('disable removes pointer timer and focus subscription, including repeated disable', () => {
    const f = fixture();
    f.follower.disable();
    f.follower.disable();
    assert.deepEqual(f.removed, [['timer', 9], ['signal', 7]]);
});
