/* SudoCharm — a good luck charm, knotted to the top of your screen.
 * Copyright (C) 2026 Rahul Patwa
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. See the LICENSE file for the full text.
 */

/* cord.js — the cord the charm hangs from.
 *
 * Drawn with Cairo rather than being a styled St.Widget rotated into place.
 * A rectangle only has clean edges while it is upright: at every other angle
 * the compositor gives it no antialiasing, so a 4px cord with 1px light and
 * dark side borders breaks up into a stair-stepped, dashed twig — which is
 * exactly when you look at it, because that is when the charm is swinging.
 *
 * Drawing it ourselves also buys the bow. A cord has its own weight, so its
 * middle trails the fast part of a swing while its two ends are pinned. That
 * curve is most of what separates a cord from a rod, and it is the reason this
 * file exists rather than a nicer stylesheet.
 *
 * Everything here is in the pendulum's own frame, where the cord always hangs
 * straight down the middle. The swing is the pendulum actor's rotation; this
 * only ever draws a nearly-vertical line, and `bow` is a plain x offset.
 */

import St from 'gi://St';
import Cairo from 'gi://cairo';

import {CORD_STYLES} from './cord-styles.js';

/* Repainting is not free, so it only happens when the drawing would actually
 * differ. Below this, a change in the bow is not worth a new texture. */
const BOW_EPSILON = 0.35;

export class Cord {
    constructor(style = 'rounded') {
        this.actor = new St.DrawingArea({reactive: false});
        this._repaintId = this.actor.connect('repaint', () => this._repaint());

        this._style = CORD_STYLES.includes(style) ? style : 'rounded';
        this._length = 0;
        this._bow = 0;
    }

    /**
     * Place and size the cord.
     *
     * @param {number} slot   width of the pendulum; the cord hangs down its middle
     * @param {number} length distance from the hook to the charm's hang point
     */
    layout(slot, length) {
        this._length = Math.max(1, length);
        this.actor.set_position(0, 0);
        // Tall enough for the round cap at the bottom, which the charm covers
        // anyway; wide enough that a full bow cannot be clipped.
        this.actor.set_size(Math.max(8, slot), Math.round(this._length) + 4);
        this.actor.queue_repaint();
    }

    setStyle(style) {
        if (!CORD_STYLES.includes(style) || style === this._style)
            return;
        this._style = style;
        this.actor.queue_repaint();
    }

    /** How far the cord's middle is pushed sideways, in pixels. Sign follows
     *  the pendulum's own frame: positive is towards increasing swing angle. */
    setBow(bow) {
        if (Math.abs(bow - this._bow) < BOW_EPSILON)
            return;
        this._bow = bow;
        this.actor.queue_repaint();
    }

    destroy() {
        if (this._repaintId)
            this.actor.disconnect(this._repaintId);
        this._repaintId = 0;
        this.actor.destroy();
        this.actor = null;
    }

    /* ----------------------------------------------------------- the drawing */

    _repaint() {
        const cr = this.actor.get_context();
        const [w] = this.actor.get_surface_size();
        const x = w / 2;
        const len = this._length;
        const bow = this._bow;

        cr.setLineCap(Cairo.LineCap.ROUND);
        cr.setLineJoin(Cairo.LineJoin.ROUND);

        if (this._style === 'thread')
            this._thread(cr, x, len, bow);
        else if (this._style === 'twist')
            this._twist(cr, x, len, bow);
        else
            this._rounded(cr, x, len, bow);

        cr.$dispose();
    }

    /** The cord's centre line. Both ends stay pinned however far it bows, so
     *  the charm can never come off the end of it. */
    _path(cr, x, len, bow) {
        cr.moveTo(x, 0);
        cr.curveTo(x + bow, len * 0.35, x + bow * 0.85, len * 0.72, x, len);
    }

    _stroke(cr, x, len, bow, width, r, g, b, a) {
        this._path(cr, x, len, bow);
        cr.setLineWidth(width);
        cr.setSourceRGBA(r, g, b, a);
        cr.stroke();
    }

    /** Where the centre line sits at a given fraction of the way down — the
     *  cubic above, evaluated so the twist marks can follow the bow. */
    _offsetAt(t, bow) {
        const u = 1 - t;
        return bow * (3 * u * u * t + 0.85 * 3 * u * t * t);
    }

    /* A fine waxed thread. The dark halo is what lets 2px survive: the charm
     * hangs over whatever wallpaper the user happens to have, and a bare thread
     * this thin disappears into a bright sky. */
    _thread(cr, x, len, bow) {
        this._stroke(cr, x, len, bow, 3.4, 0, 0, 0, 0.28);
        this._stroke(cr, x, len, bow, 1.8, 0.27, 0.20, 0.13, 1);
        this._stroke(cr, x, len * 0.92, bow, 0.6, 1, 1, 1, 0.20);
    }

    /* Round leather cord: the weight the extension has always had, but with a
     * soft shadow under it and a single lit edge, so it reads as round. */
    _rounded(cr, x, len, bow) {
        this._stroke(cr, x, len, bow, 4.6, 0, 0, 0, 0.26);
        this._stroke(cr, x, len, bow, 3.2, 0.42, 0.31, 0.17, 1);
        this._stroke(cr, x - 0.85, len * 0.96, bow, 1.0, 1, 0.93, 0.78, 0.28);
    }

    /* Twisted rope: the same body, raked with the barber-pole of a twist. The
     * marks are clipped to the cord so they cannot spill past its edges. */
    _twist(cr, x, len, bow) {
        this._stroke(cr, x, len, bow, 5.0, 0, 0, 0, 0.28);
        this._stroke(cr, x, len, bow, 3.6, 0.40, 0.29, 0.16, 1);

        cr.save();
        this._path(cr, x, len, bow);
        cr.setLineWidth(3.6);
        cr.clipPreserve();
        cr.newPath();

        cr.setLineWidth(1.2);
        cr.setSourceRGBA(1, 0.92, 0.74, 0.30);
        for (let y = 1; y < len - 1; y += 4.5) {
            const dx = x + this._offsetAt(y / len, bow);
            cr.moveTo(dx - 2.6, y + 1.4);
            cr.lineTo(dx + 2.6, y - 1.4);
        }
        cr.stroke();
        cr.restore();
    }
}
