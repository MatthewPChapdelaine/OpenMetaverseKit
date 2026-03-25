# OpenMetaverseKit

`OpenMetaverseKit` is a free and open-source WebXR package for producing browser-based metaverse spaces with a solid desktop GUI and optional VR session support.

## What it does

- Generates themed 3D social spaces from a simple world configuration
- Supports browser-based viewing plus immersive VR when the device/browser allows it
- Exports and imports world JSON so spaces can be remixed freely
- Imports Blender-exported `.glb` and `.gltf` assets directly into the live scene
- Supports room-based multiplayer presence and chat through a lightweight WebSocket server
- Includes avatar emotes and quick gestures for social expression
- Ships under the MIT license for open-source redistribution

## Stack

- `Three.js`
- `WebXR`
- `Vite`

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Build

```bash
npm run build
```

## Desktop controls

The desktop movement model is tuned for a social-metaverse feel:

- click the viewport or use **Enable Controls** to lock the cursor
- move with `W`, `A`, `S`, `D`
- sprint with `Shift`
- jump with `Space`
- crouch with `C`
- press `Esc` to release the cursor
- trigger emotes with `1` through `4`

## VR controller mappings

In immersive mode, the current interaction mappings are:

- controller trigger: wave emote
- controller grip / squeeze: sit or stand
- controller ray: spatial pointing
- tracked hands: visible when supported by the headset/browser

## Linux desktop shell

With the runtime already running locally:

```bash
npm run desktop
```

By default the desktop window loads `http://127.0.0.1:5173/`.

For a packaged Linux build:

```bash
npm run dist:linux
```

The generated artifact is written to `release/`.

## Linux store packaging

Flatpak packaging files live in `packaging/flatpak/`.

After building the desktop artifact, the Flatpak metadata can be validated with:

```bash
appstreamcli validate packaging/flatpak/com.matthew.OpenMetaverseKit.metainfo.xml
```

For a Flathub-style source build that keeps the local binary-oriented packaging intact, use
`packaging/flathub/` instead. The generated npm cache sources can be refreshed with:

```bash
node packaging/flathub/generate-sources.mjs
```

Then the source-build manifest can be checked locally with:

```bash
flatpak-builder --force-clean flatpak-build packaging/flathub/com.matthew.OpenMetaverseKit.yaml
```

## Itch.io upload automation

Use `packaging/itchio/publish.sh` to build and stage an `itch.io` upload, then push it with `butler`.

Required environment variables:

- `ITCH_IO_USER` - your `itch.io` account name
- `ITCH_IO_PROJECT` - the existing `itch.io` project slug

Optional environment variables:

- `ITCH_IO_CHANNEL` - overrides the default channel name (`web` or `linux`)
- `BUTLER_API_KEY` - used by `butler` if you prefer token-based auth

Examples:

```bash
./packaging/itchio/generate-page.py

ITCH_IO_USER=yourname ITCH_IO_PROJECT=openmetaversekit \
  ./packaging/itchio/publish.sh web --dry-run

ITCH_IO_USER=yourname ITCH_IO_PROJECT=openmetaversekit \
  ./packaging/itchio/publish.sh web

ITCH_IO_USER=yourname ITCH_IO_PROJECT=openmetaversekit \
  ./packaging/itchio/publish.sh linux
```

The `web` target uploads the `dist/` output. The `linux` target packages the AppImage built by `npm run dist:linux`.

`generate-page.py` writes a page-ready markdown description, metadata summary, and browser checklist to `packaging/itchio/out/`.

## Multiplayer

Start the room server:

```bash
npm run multiplayer
```

Then run the frontend:

```bash
npm run dev
```

Open the app in two browser windows, connect both to the same room, and you will see:

- participant roster updates
- room chat
- remote in-world avatars based on live camera position

## Blender import workflow

For the cleanest handoff from Blender:

1. Open your model in Blender.
2. Export with `File -> Export -> glTF 2.0`.
3. Prefer `.glb` so the mesh and materials stay in one file.
4. In `OpenMetaverseKit`, use **Load Blender Asset** and choose the exported file.

Imported assets are normalized, placed around the generated world, and tracked in the control panel.

## Project structure

- `src/main.js` initializes the generator, renderer, and GUI wiring
- `src/metaverseGenerator.js` creates the 3D world from config
- `src/worldPresets.js` contains shareable environment presets
- `src/style.css` provides the desktop control surface styling
- `server/multiplayer-server.js` runs the lightweight social room backend

## Open-source direction

This first package is a foundation for:

- collaborative world templates
- Blender-to-WebXR asset import pipelines
- multiplayer backends
- packaged desktop or store releases
