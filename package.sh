#!/usr/bin/env bash
# Build an installable zip: dist/<uuid>.shell-extension.zip
#
# Install it with:   gnome-extensions install --force <zip>
# This is the same format extensions.gnome.org accepts.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

UUID="$(python3 -c "import json;print(json.load(open('metadata.json'))['uuid'])")"
mkdir -p dist

EXTRA=()
for f in pendulum.js charms.js charm-list.js cord.js cord-styles.js sudocharm README.md; do
  EXTRA+=(--extra-source="$f")
done

# Stage the artwork rather than shipping icons/ wholesale. Anything dropped in
# there by hand — a raw export, a working file, a 2MB PNG with spaces in its
# name — would otherwise end up in the release without anyone noticing. Real
# assets are kebab-case, so that is the allowlist.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/icons/beads"
SKIPPED=()
for f in icons/*; do
  base="$(basename "$f")"
  [ -d "$f" ] && continue
  if [[ "$base" =~ ^[a-z0-9-]+\.(png|svg)$ ]]; then
    cp "$f" "$STAGE/icons/$base"
  else
    SKIPPED+=("$base")
  fi
done
cp icons/beads/*.png "$STAGE/icons/beads/" 2>/dev/null || true
if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo "not shipping (not a kebab-case asset):"
  printf '  %s\n' "${SKIPPED[@]}"
  echo
fi
EXTRA+=(--extra-source="$STAGE/icons")

gnome-extensions pack \
  --schema=schemas/org.gnome.shell.extensions.sudocharm.gschema.xml \
  "${EXTRA[@]}" \
  --out-dir=dist --force .

ZIP="dist/$UUID.shell-extension.zip"
echo
echo "built $ZIP  ($(du -h "$ZIP" | cut -f1))"
echo
echo "contents:"
unzip -l "$ZIP" | tail -n +4 | head -30
