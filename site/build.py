#!/usr/bin/env python3
"""Build docs/index.html from the template and the charm artwork.

The landing page has to work from a file:// path with no network, so every
image is inlined as a data: URI. The full-size art in icons/ is 512px PNG and
far more than a web page needs, so it is resampled and re-encoded here rather
than committed twice.

    ./site/build.py            rebuild docs/index.html
    ./site/build.py --art      re-encode the art from icons/ first
"""

import base64
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
ART = os.path.join(SITE, 'art.json')

# Every layer any charm draws. The daruma's pupils are built as SVG in the
# page itself; they are two circles and not worth an image.
LAYERS = [
    'nazar', 'hamsa', 'horseshoe',
    'nimbu-string', 'nimbu-lemon',
    'daruma-body',
    'neko-body', 'neko-paw',
    'scarab-body', 'scarab-wing-l', 'scarab-wing-r',
]

# 384px covers a charm drawn at up to 154 CSS px on a 2x display.
CHARM_PX = 384
SHOT_PX = 900


def encode(im, fmt='WEBP', **kw):
    buf = io.BytesIO()
    im.save(buf, fmt, **kw)
    return 'data:image/%s;base64,%s' % (
        fmt.lower(), base64.b64encode(buf.getvalue()).decode())


def build_art():
    from PIL import Image
    out = {}
    for name in LAYERS:
        src = os.path.join(ROOT, 'icons', name + '.png')
        im = Image.open(src).convert('RGBA').resize(
            (CHARM_PX, CHARM_PX), Image.LANCZOS)
        out[name] = encode(im, quality=86, method=6)

    shot = Image.open(os.path.join(ROOT, 'docs', 'hanging.png')).convert('RGB')
    w, h = shot.size
    shot = shot.resize((SHOT_PX, round(h * SHOT_PX / w)), Image.LANCZOS)
    out['_shot'] = encode(shot, quality=82, method=6)

    with open(ART, 'w') as f:
        json.dump(out, f)
    print('art.json  %d layers, %.0f kB' % (len(out), os.path.getsize(ART) / 1024))


def build_page():
    with open(ART) as f:
        art = json.load(f)
    shot = art.pop('_shot')

    with open(os.path.join(SITE, 'index.template.html')) as f:
        html = f.read()
    html = html.replace('__ART__', json.dumps(art, separators=(',', ':')))
    html = html.replace('__SHOT__', shot)

    dest = os.path.join(ROOT, 'docs', 'index.html')
    with open(dest, 'w') as f:
        f.write(html)
    print('index.html  %.0f kB' % (os.path.getsize(dest) / 1024))

    # The same page, minus the document skeleton, for publishing as an artifact.
    body = html.split('<body>', 1)[1].rsplit('</body>', 1)[0]
    css = html.split('<style>', 1)[1].split('</style>', 1)[0]

    # The viewport meta has to travel with the content. A host that wraps this
    # in its own <head> drops the one in the template, and a phone with no
    # viewport meta lays the page out at 980px and then zooms out to fit —
    # every measurement correct, every word too small to read.
    viewport = html.split('name="viewport" content="', 1)[1].split('"', 1)[0]

    # The page's own <title> carries the slogan for search; the artifact
    # gallery wants the bare name.
    with open(os.path.join(SITE, 'artifact.html'), 'w') as f:
        f.write('<meta name="viewport" content="%s">\n'
                '<title>SudoCharm</title>\n<style>%s</style>\n%s'
                % (viewport, dual_theme(css), body))


def dual_theme(css):
    """Make the dark palette answer to an explicit toggle as well as the OS.

    The artifact viewer can stamp data-theme on the root element instead of
    relying on prefers-color-scheme, so the same declarations have to appear
    twice: guarded inside the media query, and again keyed to the attribute.
    """
    head, rest = css.split('/* dark:start */', 1)
    block, tail = rest.split('/* dark:end */', 1)
    inner = block.split('{', 1)[1].rsplit('}', 1)[0].rsplit('}', 1)[0] + '}'
    return ''.join([
        head,
        '@media (prefers-color-scheme: dark) {',
        inner.replace(':root', ':root:not([data-theme="light"])'),
        '}\n',
        inner.replace(':root', ':root[data-theme="dark"]'),
        tail,
    ])


if __name__ == '__main__':
    # art.json is derived from icons/ and not committed — the same bytes are
    # already in docs/index.html. Rebuilding it needs Pillow.
    if '--art' in sys.argv or not os.path.exists(ART):
        build_art()
    build_page()
