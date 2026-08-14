/* SudoCharm — a good luck charm, knotted to the top of your screen.
 * Copyright (C) 2026 Rahul Patwa
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. See the LICENSE file for the full text.
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

/* Note the capitals and the /js/. The all-lowercase
 * resource:///org/gnome/shell/extensions/prefs.js is a path that does not
 * exist — importing it fails the whole module, and the only symptom is the
 * shell's generic "Something's gone wrong" dialog. */
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {CHARMS} from './charm-list.js';
import {CORD_STYLES, CORD_STYLE_LABELS} from './cord-styles.js';

export default class SudoCharmPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'Charm',
            icon_name: 'starred-symbolic',
        });
        window.add(page);

        /* ------------------------------------------------------- the charm */

        const charmGroup = new Adw.PreferencesGroup({title: 'The charm'});
        page.add(charmGroup);

        const ids = CHARMS.map(c => c.id);
        const model = new Gtk.StringList();
        for (const c of CHARMS)
            model.append(`${c.name} — ${c.origin}`);

        const charmRow = new Adw.ComboRow({
            title: 'Charm',
            model,
            selected: Math.max(0, ids.indexOf(settings.get_string('charm'))),
        });
        charmGroup.add(charmRow);

        const storyRow = new Adw.ActionRow({
            title: 'Story',
            subtitle: CHARMS[charmRow.selected].story,
            subtitle_lines: 6,
        });
        charmGroup.add(storyRow);

        charmRow.connect('notify::selected', row => {
            settings.set_string('charm', ids[row.selected]);
            storyRow.subtitle = CHARMS[row.selected]?.story ?? '';
        });
        settings.connect('changed::charm', () => {
            const i = ids.indexOf(settings.get_string('charm'));
            if (i >= 0 && i !== charmRow.selected)
                charmRow.selected = i;
        });

        const emojiRow = new Adw.EntryRow({
            title: 'Custom emoji',
            text: settings.get_string('emoji'),
        });
        emojiRow.connect('changed', row => {
            const text = row.text.trim();
            if (text)
                settings.set_string('emoji', text);
        });
        charmGroup.add(emojiRow);

        const visibleRow = new Adw.SwitchRow({
            title: 'Hanging',
            subtitle: 'Take it down without disabling the extension.',
        });
        settings.bind('visible', visibleRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        charmGroup.add(visibleRow);

        /* --------------------------------------------------------- hanging */

        const hangGroup = new Adw.PreferencesGroup({
            title: 'How it hangs',
            description: 'You can also drag the hook along the top edge, or ' +
                         'Ctrl-drag the charm, to re-hang it.',
        });
        page.add(hangGroup);

        hangGroup.add(this._spin(settings, 'charm-size',
            'Size', 'Pixels across.', 32, 220, 4));
        hangGroup.add(this._spin(settings, 'cord-length',
            'Cord length', 'How far below the top bar it hangs.', 8, 400, 4));

        const cordModel = new Gtk.StringList();
        for (const s of CORD_STYLES)
            cordModel.append(CORD_STYLE_LABELS[s]);

        const cordRow = new Adw.ComboRow({
            title: 'Cord',
            subtitle: 'What it hangs by.',
            model: cordModel,
            selected: Math.max(0,
                CORD_STYLES.indexOf(settings.get_string('cord-style'))),
        });
        cordRow.connect('notify::selected', row =>
            settings.set_string('cord-style', CORD_STYLES[row.selected]));
        settings.connect('changed::cord-style', () => {
            const i = CORD_STYLES.indexOf(settings.get_string('cord-style'));
            if (i >= 0 && i !== cordRow.selected)
                cordRow.selected = i;
        });
        hangGroup.add(cordRow);

        const anchorRow = new Adw.SpinRow({
            title: 'Position along the top edge',
            subtitle: '0 is the far left, 100 the far right.',
            adjustment: new Gtk.Adjustment({
                lower: 0, upper: 100, step_increment: 1, page_increment: 10,
                value: Math.round(settings.get_double('anchor') * 100),
            }),
        });
        anchorRow.connect('notify::value', row =>
            settings.set_double('anchor', row.value / 100));
        settings.connect('changed::anchor', () => {
            const v = Math.round(settings.get_double('anchor') * 100);
            if (Math.abs(v - anchorRow.value) >= 1)
                anchorRow.value = v;
        });
        hangGroup.add(anchorRow);

        /* --------------------------------------------------------- movement */

        const moveGroup = new Adw.PreferencesGroup({
            title: 'Movement',
            description: 'It is a pendulum. Grab it and flick it, or scroll ' +
                         'over it to nudge it.',
        });
        page.add(moveGroup);

        const swayRow = new Adw.SwitchRow({
            title: 'Breeze',
            subtitle: 'Keeps it drifting while you work.',
        });
        settings.bind('sway', swayRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        moveGroup.add(swayRow);

        moveGroup.add(this._double(settings, 'liveliness',
            'Liveliness', 'How strongly the breeze pushes.', 0, 3, 0.1));
        moveGroup.add(this._double(settings, 'damping',
            'Damping', 'How quickly a flick rings down. Lower swings longer.',
            0.05, 3, 0.05));

        /* --------------------------------------------------------- summons */

        const keyGroup = new Adw.PreferencesGroup({
            title: 'Shortcuts',
            description: 'Also available as sudocharm bless, or over D-Bus ' +
                         'from a git hook or a build script.',
        });
        page.add(keyGroup);
        keyGroup.add(new ShortcutRow(settings, 'bless-shortcut',
            'Call it down', 'It drops, performs its ritual, and draws back up.'));
        keyGroup.add(new ShortcutRow(settings, 'toggle-shortcut',
            'Hang it up, or take it down', 'Show and hide the charm.'));

        const resetRow = new Adw.ActionRow({
            title: 'Daruma',
            subtitle: this._darumaText(settings.get_int('daruma-state')),
        });
        const resetButton = new Gtk.Button({
            label: 'Start over',
            valign: Gtk.Align.CENTER,
        });
        resetButton.connect('clicked', () => settings.set_int('daruma-state', 0));
        settings.connect('changed::daruma-state', () => {
            resetRow.subtitle = this._darumaText(settings.get_int('daruma-state'));
        });
        resetRow.add_suffix(resetButton);
        keyGroup.add(resetRow);
    }

    _darumaText(state) {
        return [
            'Both eyes blank. Call it down to make a wish.',
            'One eye painted — a wish is out there.',
            'Both eyes painted. The wish came in.',
        ][state] ?? '';
    }

    _spin(settings, key, title, subtitle, lower, upper, step) {
        const row = new Adw.SpinRow({
            title, subtitle,
            adjustment: new Gtk.Adjustment({
                lower, upper,
                step_increment: step,
                page_increment: step * 5,
                value: settings.get_int(key),
            }),
        });
        settings.bind(key, row, 'value', Gio.SettingsBindFlags.DEFAULT);
        return row;
    }

    _double(settings, key, title, subtitle, lower, upper, step) {
        const row = new Adw.SpinRow({
            title, subtitle,
            digits: 2,
            adjustment: new Gtk.Adjustment({
                lower, upper,
                step_increment: step,
                page_increment: step * 5,
                value: settings.get_double(key),
            }),
        });
        row.connect('notify::value', r => settings.set_double(key, r.value));
        return row;
    }
}

/** A row that captures a single keyboard shortcut into an "as" settings key. */
const ShortcutRow = GObject.registerClass(
class ShortcutRow extends Adw.ActionRow {
    _init(settings, key, title, subtitle) {
        super._init({title, subtitle, activatable: true});

        this._settings = settings;
        this._key = key;

        this._label = new Gtk.ShortcutLabel({
            valign: Gtk.Align.CENTER,
            disabled_text: 'Disabled',
        });
        this.add_suffix(this._label);
        this._sync();

        this.connect('activated', () => this._capture());
        settings.connect(`changed::${key}`, () => this._sync());
    }

    _sync() {
        const [accel] = this._settings.get_strv(this._key);
        this._label.accelerator = accel ?? '';
    }

    _capture() {
        const dialog = new Adw.MessageDialog({
            transient_for: this.get_root(),
            heading: 'Press a shortcut',
            body: 'Escape cancels. Backspace clears the shortcut.',
        });
        dialog.add_response('cancel', 'Cancel');

        const controller = new Gtk.EventControllerKey();
        dialog.add_controller(controller);
        controller.connect('key-pressed', (_c, keyval, keycode, state) => {
            const mask = state & Gtk.accelerator_get_default_mod_mask();

            if (keyval === Gdk.KEY_Escape && !mask) {
                dialog.close();
                return Gdk.EVENT_STOP;
            }
            if (keyval === Gdk.KEY_BackSpace && !mask) {
                this._settings.set_strv(this._key, []);
                dialog.close();
                return Gdk.EVENT_STOP;
            }
            if (!mask || !Gtk.accelerator_valid(keyval, mask))
                return Gdk.EVENT_STOP;

            this._settings.set_strv(this._key,
                [Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask)]);
            dialog.close();
            return Gdk.EVENT_STOP;
        });

        dialog.present();
    }
});
