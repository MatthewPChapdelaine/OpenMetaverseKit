#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/packaging/itchio/out"

usage() {
    cat <<'EOF'
Usage: ./packaging/itchio/publish.sh <web|linux> [--dry-run]

Environment:
  ITCH_IO_USER     Required itch.io account name
  ITCH_IO_PROJECT  Required itch.io project slug
  ITCH_IO_CHANNEL  Optional channel override (defaults to target name)
  BUTLER_API_KEY   Optional butler auth token
EOF
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Required command not found: $1" >&2
        exit 1
    fi
}

TARGET=""
DRY_RUN=0

for arg in "$@"; do
    case "$arg" in
        web|linux)
            if [ -n "$TARGET" ]; then
                echo "Only one target may be specified." >&2
                usage
                exit 1
            fi
            TARGET="$arg"
            ;;
        --dry-run)
            DRY_RUN=1
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg" >&2
            usage
            exit 1
            ;;
    esac
done

if [ -z "$TARGET" ]; then
    usage
    exit 1
fi

: "${ITCH_IO_USER:?Set ITCH_IO_USER to your itch.io username.}"
: "${ITCH_IO_PROJECT:?Set ITCH_IO_PROJECT to your itch.io project slug.}"

require_command npm
require_command node
require_command git

CHANNEL="${ITCH_IO_CHANNEL:-$TARGET}"
VERSION="$(node -p "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')).version" "$ROOT_DIR/package.json")"
GIT_SHA="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
USER_VERSION="${VERSION}+${GIT_SHA}"
DESTINATION="${ITCH_IO_USER}/${ITCH_IO_PROJECT}:${CHANNEL}"
STAGE_DIR="$OUT_DIR/$TARGET"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

case "$TARGET" in
    web)
        npm --prefix "$ROOT_DIR" run build
        cp -R "$ROOT_DIR/dist/." "$STAGE_DIR/"
        ;;
    linux)
        npm --prefix "$ROOT_DIR" run dist:linux
        APPIMAGE_PATH="$(find "$ROOT_DIR/release" -maxdepth 1 -type f -name '*.AppImage' | sort | tail -n 1)"
        if [ -z "$APPIMAGE_PATH" ]; then
            echo "No AppImage was produced under $ROOT_DIR/release" >&2
            exit 1
        fi
        cp "$APPIMAGE_PATH" "$STAGE_DIR/"
        ;;
esac

cat >"$STAGE_DIR/build-info.txt" <<EOF
project=OpenMetaverseKit
target=$TARGET
version=$VERSION
git_sha=$GIT_SHA
source_repo=$(git -C "$ROOT_DIR" remote get-url origin)
EOF

echo "Staged itch.io artifact in $STAGE_DIR"
echo "Destination: $DESTINATION"
echo "User version: $USER_VERSION"

if [ "$DRY_RUN" -eq 1 ]; then
    echo "Dry run enabled; skipping butler push."
    exit 0
fi

require_command butler
butler push "$STAGE_DIR" "$DESTINATION" --userversion "$USER_VERSION"
