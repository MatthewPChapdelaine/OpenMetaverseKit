#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MANIFEST="$ROOT_DIR/packaging/flathub/com.matthew.OpenMetaverseKit.yaml"
BUILD_DIR="$ROOT_DIR/packaging/flathub/build-dir"
REPO_DIR="$ROOT_DIR/packaging/flathub/repo"

flatpak-builder \
  --user \
  --install-deps-from=flathub \
  --force-clean \
  --repo="$REPO_DIR" \
  "$BUILD_DIR" \
  "$MANIFEST"
