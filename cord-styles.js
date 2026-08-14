/* SudoCharm — a good luck charm, knotted to the top of your screen.
 * Copyright (C) 2026 Rahul Patwa
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. See the LICENSE file for the full text.
 */

/* cord-styles.js — the names of the cord treatments, and nothing else.
 *
 * Separate from cord.js on purpose. Preferences run in their own process,
 * which has no St and no Meta — the shell registers those typelib paths inside
 * itself rather than putting them in the environment it hands to its children.
 * So prefs.js can import this list, but must not reach into the file that
 * actually draws the cord. Keep this module free of gi imports.
 *
 * The values are the enum in the gschema; changing one means changing both.
 */

export const CORD_STYLES = ['thread', 'rounded', 'twist'];

export const CORD_STYLE_LABELS = {
    thread: 'Thread — a fine waxed line',
    rounded: 'Cord — round leather, lit down one side',
    twist: 'Twist — twisted rope',
};
