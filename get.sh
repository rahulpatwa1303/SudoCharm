#!/usr/bin/env bash
# get.sh — install SudoCharm from the latest release, in one command.
#
#   curl -fsSL https://raw.githubusercontent.com/rahulpatwa1303/SudoCharm/master/get.sh | bash
#
# Downloads the release zip, installs it, enables it, and tells you the one
# thing it cannot do for you. Nothing is left behind but the extension itself.
#
# Set SUDOCHARM_ZIP to a local file to install that instead of downloading —
# used to test this script against a build that is not released yet.
set -euo pipefail

UUID="sudocharm@rahulpatwa1303.github.io"
REPO="rahulpatwa1303/SudoCharm"
ASSET="$UUID.shell-extension.zip"
URL="https://github.com/$REPO/releases/latest/download/$ASSET"

say()  { printf '%s\n' "$*"; }
die()  { printf '\n%s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- preflight
command -v gnome-extensions >/dev/null 2>&1 || die \
"This needs the 'gnome-extensions' command, which ships with GNOME Shell.
If you are not on GNOME, SudoCharm will not run — it is a GNOME Shell
extension, and there is no version for other desktops."

if command -v gnome-shell >/dev/null 2>&1; then
    VER="$(gnome-shell --version 2>/dev/null | grep -oE '[0-9]+' | head -1 || true)"
    if [ -n "${VER:-}" ] && { [ "$VER" -lt 45 ] || [ "$VER" -gt 48 ]; }; then
        say "Warning: this is built for GNOME Shell 45 to 48 and you have $VER."
        say "It may work anyway. Carrying on."
        say
    fi
fi

# ------------------------------------------------------------------- fetch
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ZIP="$TMP/$ASSET"

if [ -n "${SUDOCHARM_ZIP:-}" ]; then
    say "==> using $SUDOCHARM_ZIP"
    cp "$SUDOCHARM_ZIP" "$ZIP"
elif command -v curl >/dev/null 2>&1; then
    say "==> downloading the latest release"
    curl -fsSL --retry 2 -o "$ZIP" "$URL" || die "Download failed: $URL"
elif command -v wget >/dev/null 2>&1; then
    say "==> downloading the latest release"
    wget -qO "$ZIP" "$URL" || die "Download failed: $URL"
else
    die "Need curl or wget to download the release."
fi

# A partial download is still a file, so check it is really a zip before
# handing it to gnome-extensions, which gives a poor error if it is not.
head -c2 "$ZIP" | grep -q PK || die \
"That download is not a zip. Most likely there is no published release yet —
check https://github.com/$REPO/releases"

# ----------------------------------------------------------------- install
say "==> installing $UUID"
gnome-extensions install --force "$ZIP"

# enable can fail on a session that has not seen the extension yet; the
# setting is what actually matters at next login, so fall back to it.
if ! gnome-extensions enable "$UUID" 2>/dev/null; then
    current="$(gsettings get org.gnome.shell enabled-extensions)"
    if [[ "$current" != *"$UUID"* ]]; then
        updated="$(python3 -c "
import ast, sys
xs = ast.literal_eval(sys.argv[1])
xs.append(sys.argv[2])
print(str(xs))" "$current" "$UUID")"
        gsettings set org.gnome.shell enabled-extensions "$updated"
    fi
fi

say
say "Installed."
say
if [ "${XDG_SESSION_TYPE:-}" = "x11" ]; then
    say "  Press Alt+F2, type r, and hit Enter to restart the shell."
else
    say "  Now log out and back in. GNOME cannot load a new extension into a"
    say "  running Wayland session — there is no way around it, and it catches"
    say "  everyone once."
fi
say
say "  Call it down:  Super+Alt+L, or click the charm"
say "  Show / hide:   Super+Alt+K"
say "  Settings:      gnome-extensions prefs $UUID"
say
