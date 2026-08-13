/* charms.js — charm definitions, actor construction, and rituals.
 *
 * Every charm is a stack of full-canvas 128x128 SVG layers. Because each layer
 * shares the same canvas, an animated part (a lemon, an eye, a paw) already sits
 * in the right place — we only ever move it relative to where it was drawn.
 */

import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

/** The art is authored on a 128x128 grid; pivots below are fractions of it. */
const CANVAS = 128;

/* Artwork resolution. A charm may ship as SVG or as a PNG of the same name —
 * a PNG wins if it is there, so replacement art can be dropped into icons/
 * without touching any code. Parts keep their names, so the rituals keep
 * working whatever the art is made of. */
function artFile(path, file) {
    const png = `${path}/icons/${file.replace(/\.svg$/, '.png')}`;
    if (GLib.file_test(png, GLib.FileTest.EXISTS))
        return png;
    return `${path}/icons/${file}`;
}

export const CHARMS = [
    {
        id: 'nazar',
        name: 'Nazar boncuğu',
        origin: 'Turkey',
        story: 'A glass eye worn against the evil eye. Blue on white on blue — ' +
               'it stares back at whatever was staring at you. Flick it and it spins.',
        ritual: 'Flick it',
        parts: [{key: 'body', file: 'nazar.svg'}],
        hangPivot: [0.5, 0.06],
    },
    {
        id: 'hamsa',
        name: 'Hamsa',
        origin: 'Middle East & North Africa',
        story: 'An open hand carried for protection and good fortune. The eye in ' +
               'the palm keeps watch so you do not have to.',
        ritual: 'Wake the eye',
        parts: [{key: 'body', file: 'hamsa.svg'}],
        hangPivot: [0.5, 0.05],
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
        hangPivot: [0.5, 0.02],
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
    },
    {
        id: 'neko',
        name: 'Maneki-neko',
        origin: 'Japan',
        story: 'A beckoning cat that invites good fortune in. The raised paw is a ' +
               'come-here, not a wave — the gesture reads backwards to most of the world.',
        ritual: 'Beckon',
        parts: [
            {key: 'body', file: 'neko-body.svg'},
            {key: 'paw', file: 'neko-paw.svg', pivot: [0.54, 0.64]},
        ],
        hangPivot: [0.5, 0.1],
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
        hangPivot: [0.5, 0.12],
    },
    {
        id: 'emoji',
        name: 'Your own',
        origin: 'Wherever you found it',
        story: 'Any emoji you like, treated with exactly the same reverence as the rest.',
        ritual: 'Give it a spin',
        parts: [],
        hangPivot: [0.5, 0.06],
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
export function buildCharm(def, size, path, emoji) {
    const actor = new St.Widget({
        layout_manager: new Clutter.BinLayout(),
        width: size,
        height: size,
        reactive: false,
        style_class: 'topknot-charm',
    });
    actor.set_pivot_point(def.hangPivot[0], def.hangPivot[1]);

    const parts = {};

    if (def.id === 'emoji') {
        const label = new St.Label({
            text: emoji || '🍀',
            style: `font-size: ${Math.round(size * 0.82)}px;`,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        label.set_pivot_point(0.5, 0.5);
        actor.add_child(label);
        parts.body = label;
    } else {
        for (const p of def.parts) {
            const icon = new St.Icon({
                gicon: Gio.icon_new_for_string(artFile(path, p.file)),
                icon_size: size,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
            });
            const pivot = p.pivot ?? [0.5, 0.5];
            icon.set_pivot_point(pivot[0], pivot[1]);
            if (p.hidden)
                icon.opacity = 0;
            actor.add_child(icon);
            parts[p.key] = icon;
        }
    }

    return {actor, parts, def, size};
}

/** Convert a length authored on the 128 grid into this charm's pixel space. */
function px(charm, units) {
    return units * (charm.size / CANVAS);
}

/**
 * Play a charm's ritual.
 *
 * @param {object} charm     the object returned by buildCharm
 * @param {object} [ctx]     {darumaState, onDarumaAdvance, sparkle}
 * @returns {number} how long the ritual runs, in milliseconds
 */
export function playRitual(charm, ctx = {}) {
    const {parts, def} = charm;
    const sparkle = ctx.sparkle ?? (() => {});

    switch (def.id) {
    case 'nazar':
    case 'emoji': {
        // A flick: two fast rotations about the vertical axis, then a wobble.
        const body = parts.body;
        body.rotation_angle_y = 0;
        body.ease({
            rotation_angle_y: 720,
            duration: 900,
            mode: Clutter.AnimationMode.EASE_OUT_QUINT,
            onComplete: () => {
                body.rotation_angle_y = 0;
                sparkle(3);
            },
        });
        return 1000;
    }

    case 'hamsa': {
        // The eye wakes: the hand brightens, holds, and settles.
        const body = parts.body;
        body.ease({
            scale_x: 1.12, scale_y: 1.12,
            duration: 260,
            mode: Clutter.AnimationMode.EASE_OUT_BACK,
            onComplete: () => {
                sparkle(5);
                body.ease({
                    scale_x: 1, scale_y: 1,
                    duration: 520,
                    mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
                });
            },
        });
        return 900;
    }

    case 'nimbu': {
        // The old lemon drops away; a fresh one rises into its place.
        const lemon = parts.lemon;
        const drop = px(charm, 70);
        lemon.ease({
            translation_y: drop,
            rotation_angle_z: 140,
            opacity: 0,
            duration: 520,
            mode: Clutter.AnimationMode.EASE_IN_QUAD,
            onComplete: () => {
                lemon.translation_y = -px(charm, 24);
                lemon.rotation_angle_z = 0;
                lemon.ease({
                    translation_y: 0,
                    opacity: 255,
                    duration: 480,
                    mode: Clutter.AnimationMode.EASE_OUT_BOUNCE,
                    onComplete: () => sparkle(4),
                });
            },
        });
        // The string swings from losing and regaining the weight.
        parts.string.ease({
            rotation_angle_z: -9,
            duration: 300,
            mode: Clutter.AnimationMode.EASE_OUT_SINE,
            onComplete: () => parts.string.ease({
                rotation_angle_z: 0,
                duration: 700,
                mode: Clutter.AnimationMode.EASE_OUT_ELASTIC,
            }),
        });
        return 1100;
    }

    case 'daruma': {
        // 0 -> paint the left eye (a wish made)
        // 1 -> paint the right eye (a wish fulfilled)
        // 2 -> a fresh doll, both eyes blank again
        const state = ctx.darumaState ?? 0;
        const nudge = () => charm.actor.ease({
            rotation_angle_z: -8,
            duration: 180,
            mode: Clutter.AnimationMode.EASE_OUT_SINE,
            onComplete: () => charm.actor.ease({
                rotation_angle_z: 0,
                duration: 900,
                mode: Clutter.AnimationMode.EASE_OUT_ELASTIC,
            }),
        });

        if (state === 0) {
            parts.eyeL.opacity = 0;
            parts.eyeL.set_scale(2.2, 2.2);
            parts.eyeL.ease({
                opacity: 255, scale_x: 1, scale_y: 1,
                duration: 620,
                mode: Clutter.AnimationMode.EASE_OUT_BACK,
            });
            nudge();
        } else if (state === 1) {
            parts.eyeL.opacity = 255;
            parts.eyeR.opacity = 0;
            parts.eyeR.set_scale(2.2, 2.2);
            parts.eyeR.ease({
                opacity: 255, scale_x: 1, scale_y: 1,
                duration: 620,
                mode: Clutter.AnimationMode.EASE_OUT_BACK,
                onComplete: () => sparkle(8),
            });
            nudge();
        } else {
            parts.eyeL.ease({opacity: 0, duration: 400});
            parts.eyeR.ease({opacity: 0, duration: 400});
            nudge();
        }
        ctx.onDarumaAdvance?.((state + 1) % 3);
        return 1300;
    }

    case 'neko': {
        // Three beckons — toward you, not away.
        const paw = parts.paw;
        let n = 0;
        const beckon = () => {
            if (n++ >= 3) {
                sparkle(4);
                return;
            }
            paw.ease({
                rotation_angle_z: 26,
                duration: 200,
                mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
                onComplete: () => paw.ease({
                    rotation_angle_z: 0,
                    duration: 200,
                    mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
                    onComplete: beckon,
                }),
            });
        };
        beckon();
        return 1400;
    }

    case 'horseshoe': {
        const body = parts.body;
        body.ease({
            rotation_angle_z: 360,
            translation_y: -px(charm, 26),
            duration: 460,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                sparkle(5);
                body.ease({
                    translation_y: 0,
                    duration: 520,
                    mode: Clutter.AnimationMode.EASE_OUT_BOUNCE,
                    onComplete: () => { body.rotation_angle_z = 0; },
                });
            },
        });
        return 1100;
    }

    case 'scarab': {
        // Elytra part like doors and swing closed again. Rotated in the plane
        // rather than out of it: an out-of-plane turn foreshortens the wing
        // cases toward the midline, which reads as closing, not opening.
        const open = (wing, angle) => wing.ease({
            rotation_angle_z: angle,
            duration: 420,
            mode: Clutter.AnimationMode.EASE_OUT_BACK,
            onComplete: () => wing.ease({
                rotation_angle_z: 0,
                duration: 520,
                delay: 260,
                mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
            }),
        });
        open(parts.wingL, -34);
        open(parts.wingR, 34);
        sparkle(5);
        return 1300;
    }

    default:
        return 600;
    }
}
