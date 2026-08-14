/* SudoCharm — a good luck charm, knotted to the top of your screen.
 * Copyright (C) 2026 Rahul Patwa
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. See the LICENSE file for the full text.
 */

/* extension.js — the loader.
 *
 * This file is deliberately tiny and stable. All the real code is in pendulum.js,
 * because of how GJS caches modules.
 *
 * GNOME Shell cannot restart in place on Wayland — the compositor *is* the
 * display server — and disabling an extension does not unload its code: GJS
 * keeps every imported module for the life of the process, keyed by resolved
 * path. So disable/enable calls disable() and enable() on the *old* module and
 * never re-reads the file, and editing an extension normally means logging out.
 *
 * A query string does not help: `import('./pendulum.js?v=2')` returns the cached
 * module, because GJS resolves the path and drops the query. A path GJS has
 * never seen does help. So in dev mode we copy the implementation into a fresh
 * directory on every enable and import that, which makes disable/enable a real
 * reload.
 *
 * Dev mode is on when a file named DEV sits next to this one. Delete it and the
 * extension imports pendulum.js directly, with no copying and nothing to clean
 * up — which is what a shipped copy should do.
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const DEV_MARKER = 'DEV';
const HOT_DIR = '.hot';
/* Every file that participates in a reload. A module imported by a copy
 * resolves its own relative imports inside that copy's directory, so charms.js
 * has to come along or the copy would import nothing. */
const IMPL_FILES = ['pendulum.js', 'charms.js', 'charm-list.js', 'cord.js', 'cord-styles.js'];

export default class SudoCharmExtension extends Extension {
    /* Loading is asynchronous, so enable/disable can interleave with an import
     * that is still in flight. A plain "am I still enabled?" check is not
     * enough: disable-then-enable flips it back to true, and a stale import
     * resolving afterwards would build a SECOND instance that nothing holds a
     * reference to. That orphan keeps its frame clock running for the rest of
     * the session, ticking over destroyed actors — which throws every frame and
     * takes the overview and the app grid down with it. Each enable therefore
     * claims a generation, and a boot only installs itself if it still owns it. */
    enable() {
        this._generation = (this._generation ?? 0) + 1;
        this._boot(this._generation).catch(e => {
            console.error(`SudoCharm: failed to load — ${e}`);
            logError(e);
        });
    }

    disable() {
        // Bumping the generation invalidates any import still in flight.
        this._generation = (this._generation ?? 0) + 1;
        this._impl?.disable();
        this._impl = null;
    }

    async _boot(generation) {
        const {default: SudoCharm} = await import(this._implUrl());
        if (generation !== this._generation)
            return;                     // superseded while the import was running
        this._impl = new SudoCharm(this);
        this._impl.enable();
    }

    _implUrl() {
        const plain = `file://${this.path}/pendulum.js`;
        if (!GLib.file_test(`${this.path}/${DEV_MARKER}`, GLib.FileTest.EXISTS))
            return plain;

        try {
            const stamp = `${GLib.get_monotonic_time()}`;
            const dir = `${this.path}/${HOT_DIR}/${stamp}`;
            if (GLib.mkdir_with_parents(dir, 0o755) !== 0)
                return plain;

            for (const name of IMPL_FILES) {
                Gio.File.new_for_path(`${this.path}/${name}`).copy(
                    Gio.File.new_for_path(`${dir}/${name}`),
                    Gio.FileCopyFlags.OVERWRITE, null, null);
            }
            this._pruneHot(stamp);
            return `file://${dir}/pendulum.js`;
        } catch (e) {
            console.error(`SudoCharm: hot reload unavailable — ${e}`);
            return plain;
        }
    }

    /** Drop every previous copy; only the generation being imported is needed. */
    _pruneHot(keep) {
        const root = Gio.File.new_for_path(`${this.path}/${HOT_DIR}`);
        let children;
        try {
            children = root.enumerate_children('standard::name,standard::type',
                Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
        } catch {
            return;
        }

        let info;
        while ((info = children.next_file(null)) !== null) {
            const name = info.get_name();
            if (name === keep)
                continue;
            const dir = root.get_child(name);
            for (const file of IMPL_FILES) {
                try {
                    dir.get_child(file).delete(null);
                } catch {
                    // already gone
                }
            }
            try {
                dir.delete(null);
            } catch {
                // non-empty or vanished; the next enable will try again
            }
        }
        children.close(null);
    }
}
