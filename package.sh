#!/usr/bin/env bash
# Build an installable zip: dist/topknot@rahul.local.shell-extension.zip
#
# Install it with:   gnome-extensions install --force <zip>
# This is the same format extensions.gnome.org accepts.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

UUID="$(python3 -c "import json;print(json.load(open('metadata.json'))['uuid'])")"
mkdir -p dist

EXTRA=()
for f in pendulum.js charms.js topknot README.md; do EXTRA+=(--extra-source="$f"); done
EXTRA+=(--extra-source=icons)

gnome-extensions pack \
  --schema=schemas/org.gnome.shell.extensions.topknot.gschema.xml \
  "${EXTRA[@]}" \
  --out-dir=dist --force .

ZIP="dist/$UUID.shell-extension.zip"
echo
echo "built $ZIP  ($(du -h "$ZIP" | cut -f1))"
echo
echo "contents:"
unzip -l "$ZIP" | tail -n +4 | head -30
