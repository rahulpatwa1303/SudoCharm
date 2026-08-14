/* SudoCharm — a good luck charm, knotted to the top of your screen.
 * Copyright (C) 2026 Rahul Patwa
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. See the LICENSE file for the full text.
 */

/* charm-list.js — what the charms are. No code that builds or animates them.
 *
 * Separate from charms.js because preferences run in their own process, which
 * has no St and no Clutter — the shell registers those typelib paths inside
 * itself rather than putting them in the environment it hands to its children.
 * prefs.js needs the names and the stories, so they live here, and charms.js
 * re-exports them for the shell side. Keep this module free of gi imports.
 */

/* hangPivot is where a charm hangs from inside its own artwork, as a fraction
 * of its box. It is the knot: the cord is drawn to exactly that point and the
 * charm turns about it, so the two cannot come apart however hard it swings.
 *
 * Measure it off the art — the centre of the ring or the drilled hole — not by
 * eye. Charms with neither take a value a little inside the outline, so the end
 * of the cord is covered.
 *
 * `cord` is what this charm hangs by: the rope's colour, and optionally the
 * beads strung on it, named from icons/beads/. The list is the strand itself,
 * bottom-up — not a pattern to repeat — so three names means three beads, and
 * that stays three however far the cord is pulled. A charm with no list simply
 * hangs on its cord.
 *
 * Only the nazar has beads so far, and its rope colour is taken straight off
 * the photograph the pendant was cut from. */

export const CHARMS = [
    {
        id: 'nazar',
        name: 'Nazar boncuğu',
        origin: 'Turkey',
        story: 'A glass eye worn against the evil eye. Blue on white on blue — ' +
               'it stares back at whatever was staring at you. Flick it and it spins.',
        ritual: 'Flick it',
        parts: [{key: 'body', file: 'nazar.svg'}],
        // Centre of the hole drilled through the glass, measured off the art.
        hangPivot: [0.5, 0.097],
        cord: {rope: '#0922b0', beads: ['glass-blue', 'pearl', 'glass-blue']},
    },
    {
        id: 'hamsa',
        name: 'Hamsa',
        origin: 'Middle East & North Africa',
        story: 'An open hand carried for protection and good fortune. The eye in ' +
               'the palm keeps watch so you do not have to.',
        ritual: 'Wake the eye',
        parts: [{key: 'body', file: 'hamsa.svg'}],
        // Centre of the ring at the top, so the cord threads it.
        hangPivot: [0.5, 0.085],
        cord: {rope: '#4a3b21'},
    },
    {
        id: 'nimbu',
        name: 'Nimbu-mirchi',
        origin: 'India',
        story: 'Seven chilies and a lemon, hung at the threshold to turn away ' +
               'misfortune. It is replaced every Saturday, because luck goes stale.',
        ritual: 'Replace the lemon',
        parts: [
            {key: 'string', file: 'nimbu-string.svg'},
            {key: 'lemon', file: 'nimbu-lemon.svg', pivot: [0.5, 0.6]},
        ],
        // The brass ring's hole, measured off the art. It is a little left of
        // the bunch's own centre because the ring is, so the chilies hang
        // slightly to one side of the cord exactly as they do in the picture.
        hangPivot: [0.465, 0.038],
        // `tail` carries the cord on PAST the hanging point, down to where the
        // lemon is tied — this is the only charm that is not the end of its
        // own cord. Given as a fraction of the charm's box.
        cord: {rope: '#b9a888', tail: 0.78},
    },
    {
        id: 'daruma',
        name: 'Daruma',
        origin: 'Japan',
        story: 'A wishing doll for goals that take some grit. You paint one eye ' +
               'when you make the wish, and the other when you get there. ' +
               'Knock it over and it rights itself — seven times down, eight times up.',
        ritual: 'Paint an eye',
        parts: [
            {key: 'body', file: 'daruma-body.svg'},
            {key: 'eyeL', file: 'daruma-eye-l.svg', hidden: true},
            {key: 'eyeR', file: 'daruma-eye-r.svg', hidden: true},
        ],
        hangPivot: [0.5, 0.1],
        cord: {rope: '#7d1b16'},
    },
    {
        id: 'neko',
        name: 'Maneki-neko',
        origin: 'Japan',
        story: 'A beckoning cat that invites good fortune in. The raised paw is a ' +
               'come-here, not a wave — the gesture reads backwards to most of the world.',
        ritual: 'Beckon',
        /* The paw is listed FIRST, so it is drawn BEHIND the body.
         *
         * In front, the arm's cut end and its gold cuff sit on the cat's cheek
         * — a limb glued to the face. Behind, the shoulder covers the cut and
         * only the raised arm shows, which is what a ceramic one does. This
         * body has the bare shoulder for it, so the arm now emerges from the
         * shoulder rather than from behind the head.
         *
         * The pivot is the arm's cut end, which sits on the shoulder — turning
         * it about anything else swings the whole limb off the cat. */
        parts: [
            {key: 'paw', file: 'neko-paw.svg', pivot: [0.401, 0.639]},
            {key: 'body', file: 'neko-body.svg'},
        ],
        // Centre of the gold loop's hole, measured off the art.
        hangPivot: [0.5, 0.076],
        cord: {rope: '#8e1420'},
    },
    {
        id: 'horseshoe',
        name: 'Horseshoe',
        origin: 'Europe',
        story: 'Iron, luck, and an argument that has run for centuries: ends up to ' +
               'hold the luck in, or ends down to pour it over you. Pick a side.',
        ritual: 'Flip it',
        parts: [{key: 'body', file: 'horseshoe.svg'}],
        hangPivot: [0.5, 0.1],
        cord: {rope: '#3b2d20'},
    },
    {
        id: 'scarab',
        name: 'Scarab',
        origin: 'Egypt',
        story: 'The beetle that rolls the sun across the sky each morning. Carried ' +
               'as a promise that things come back around.',
        ritual: 'Spread its wings',
        // Body first: the elytra lie on top of it and part to reveal it.
        parts: [
            {key: 'body', file: 'scarab-body.svg'},
            {key: 'wingL', file: 'scarab-wing-l.svg', pivot: [0.5, 0.31]},
            {key: 'wingR', file: 'scarab-wing-r.svg', pivot: [0.5, 0.31]},
        ],
        // Centre of the gold ring on the new artwork, measured off it.
        hangPivot: [0.5, 0.095],
        cord: {rope: '#123a6b'},
    },
    {
        id: 'emoji',
        name: 'Your own',
        origin: 'Wherever you found it',
        story: 'Any emoji you like, treated with exactly the same reverence as the rest.',
        ritual: 'Give it a spin',
        parts: [],
        // No loop to hang from — a glyph is just centred in its box, so the
        // cord runs a little further in and ends behind it.
        hangPivot: [0.5, 0.12],
        cord: {rope: '#6b4f2a'},
    },
];

export function charmById(id) {
    return CHARMS.find(c => c.id === id) ?? CHARMS[0];
}

/**
 * Build a charm actor at a given pixel size.
 *
 * @param {object} def   charm definition from CHARMS
 * @param {number} size  edge length in pixels
 * @param {string} path  extension directory, for resolving icon files
 * @param {string} emoji glyph to use when def.id === 'emoji'
 * @returns {{actor: St.Widget, parts: object, def: object, size: number}}
 */
