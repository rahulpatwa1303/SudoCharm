#!/usr/bin/env bash
# Install SudoCharm into GNOME Shell.
#
# The repo is symlinked into place rather than copied, so editing the repo
# edits the live extension.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UUID="$(python3 -c "import json;print(json.load(open('$HERE/metadata.json'))['uuid'])")"
TARGET="$HOME/.local/share/gnome-shell/extensions/$UUID"

echo "==> compiling schemas"
glib-compile-schemas "$HERE/schemas"

echo "==> linking $UUID"
mkdir -p "$(dirname "$TARGET")"
[ -e "$TARGET" ] && [ ! -L "$TARGET" ] && { echo "    $TARGET exists and is not a link; move it aside first" >&2; exit 1; }
ln -sfn "$HERE" "$TARGET"

echo "==> linking commands into ~/.local/bin"
mkdir -p "$HOME/.local/bin"
ln -sf "$HERE/sudocharm"    "$HOME/.local/bin/sudocharm"
ln -sf "$HERE/reload"     "$HOME/.local/bin/sudocharm-reload"
ln -sf "$HERE/drag-check" "$HOME/.local/bin/sudocharm-drag-check"

echo "==> enabling"
if ! gnome-extensions enable "$UUID" 2>/dev/null; then
  current=$(gsettings get org.gnome.shell enabled-extensions)
  if [[ "$current" != *"$UUID"* ]]; then
    gsettings set org.gnome.shell enabled-extensions \
      "$(python3 -c "
import ast, sys
xs = ast.literal_eval(sys.argv[1]); xs.append(sys.argv[2]); print(str(xs))" "$current" "$UUID")"
  fi
  echo "    added to enabled-extensions; it loads at next login"
fi

cat <<MSG

Done. Log out and back in — GNOME Shell cannot load an extension into a
running Wayland session.

  Call it down:   Super+Alt+L, click the charm, or 'sudocharm bless'
  Show / hide:    Super+Alt+K
  Settings:       gnome-extensions prefs $UUID

To work on it, create a file named DEV in this directory; changes then take
effect with 'sudocharm-reload' instead of a logout. See the README.
MSG
