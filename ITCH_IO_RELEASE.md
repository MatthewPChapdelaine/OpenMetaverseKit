# OpenMetaverseKit Itch.io Release Kit

This document packages the `itch.io` positioning, page copy, launch checklist, and pricing guidance for `OpenMetaverseKit`.

## Recommended positioning

Lead with the product as a hands-on worldbuilding and WebXR toolkit, not as an "AI" project.

- Core identity: open-source WebXR worldbuilding tool
- Audience: indie creators, WebXR tinkerers, social-space prototypers, Blender users
- Primary value: fast creation of browser-based 3D social spaces with optional VR support
- Best `itch.io` classification: `Tool`
- Best launch framing: free or pay-what-you-want experimental creator software

## Suggested project metadata

- Project title: `OpenMetaverseKit`
- Subtitle: `Build browser-based 3D social spaces with Blender import, multiplayer rooms, and optional VR support.`
- Classification: `Tool`
- Platforms:
  - `HTML` build if the browser version is stable enough for public play
  - `Linux` downloadable build if the desktop package is more reliable than the browser-hosted upload
- Tags:
  - `webxr`
  - `vr`
  - `3d`
  - `worldbuilding`
  - `tool`
  - `multiplayer`
  - `blender`
  - `opensource`

If only one platform is ready at launch, prefer the most stable one rather than publishing multiple weak builds.

## Store page copy

### Tagline

`A creator-focused WebXR toolkit for building and remixing browser-based 3D social spaces.`

### Short description

`OpenMetaverseKit helps you generate themed 3D spaces, import Blender assets, test multiplayer rooms, and explore them on desktop or VR-ready hardware.`

### Full description

`OpenMetaverseKit` is an open-source WebXR toolkit for quickly building browser-based metaverse spaces that feel like real places instead of empty demos.

It gives creators a fast workflow for generating themed 3D environments, importing Blender-exported assets, and testing lightweight social features such as room presence, chat, and avatar gestures.

The project is built for experimentation, remixing, and prototype production. You can use it to sketch social spaces, test interaction ideas, and iterate on world layouts without starting a full engine project from scratch.

#### What you can do with it

- Generate themed 3D spaces from simple world configuration data
- Explore spaces in the browser with optional VR session support where supported
- Import `.glb` and `.gltf` assets exported from Blender
- Save and reload world JSON for remixable scene iteration
- Run lightweight room-based multiplayer with live avatar presence and chat
- Test social interactions with emotes and quick gestures

#### Who it is for

- WebXR developers
- Indie worldbuilders
- Blender creators who want a faster interactive target
- Developers prototyping social VR or browser-based presence systems

#### What makes this different

This is not a static asset dump or a concept-only prototype. `OpenMetaverseKit` is working software aimed at practical scene creation and interaction testing.

The focus is on rapid iteration:

- build a space quickly
- import authored assets
- test it in a browser
- push further into multiplayer and VR when needed

#### Open-source note

`OpenMetaverseKit` is released under the MIT license, making it suitable for experimentation, extension, and community-driven forks.

## Recommended "How to use" section

Add this near the bottom of the page:

```text
Getting started

1. Launch the included build or run the project locally.
2. Generate a world from the provided configuration flow.
3. Import Blender-exported .glb or .gltf assets.
4. Save and remix world JSON configurations.
5. Optionally run the multiplayer room server to test shared presence.
```

## Recommended disclosure language

If you need to address AI concerns at all, keep it brief and grounded:

`OpenMetaverseKit is a functional software tool built through hands-on development and iteration. Any AI-assisted work was limited to support tasks during development; the product itself is an authored interactive toolkit.`

Do not put "AI-powered" in the title, first sentence, or main value proposition unless it is truly central to the user experience.

## Visual asset plan

Before publishing, capture at least:

- one wide hero screenshot showing an explored space in the browser UI
- one screenshot with the editor/control surface visible
- one screenshot featuring imported Blender content
- one screenshot showing multiplayer presence or chat
- one short GIF or video clip showing movement through a generated space

Strong screenshot captions:

- `Generate a themed 3D social space in seconds`
- `Import Blender assets directly into the live scene`
- `Test lightweight room-based multiplayer and presence`
- `Explore the same world on desktop and VR-capable hardware`

## Release checklist

### Product build

- Run `npm install`
- Run `npm run build`
- If shipping desktop Linux, run `npm run dist:linux`
- If shipping multiplayer guidance, verify `npm run multiplayer` still works with the current frontend build
- Confirm exported package contents are clean and documented

### Store assets

- Capture 4 to 6 polished screenshots from actual usage
- Export a cover image and thumbnail that show the 3D world clearly
- Prepare a short gameplay-style clip or GIF
- Avoid text-heavy cover art; let the environment sell the tool

### Page structure

- Lead with the creator-tool framing
- Put the feature list above technical implementation details
- Mention open-source licensing once, clearly
- Move AI disclosure low on the page or into FAQ language if needed
- Add installation and controls notes in plain language

### Packaging

- Upload the most stable public build first
- Include a `README` or quick-start text file in downloadable builds
- If shipping browser and Linux builds together, label them clearly
- Ensure filenames are user-friendly, for example:
  - `OpenMetaverseKit-linux-x64.zip`
  - `OpenMetaverseKit-web-build.zip`

### Launch follow-up

- Publish as free or pay-what-you-want first
- Add a devlog with screenshots and one concrete use case
- Ask early users what part felt most useful: world generation, import flow, or multiplayer testing
- Use that feedback to shape the second page revision

## Pricing strategy

Recommended launch model: `Free` or `Pay what you want`

Why:

- The tool is open-source and experimental, which lowers resistance if users can try it instantly
- `itch.io` audiences respond well to prototype tools when the barrier to entry is low
- Early downloads and comments are more valuable than aggressive upfront pricing at this stage

Good pricing options:

- `Free`: best if the goal is adoption, feedback, and visibility
- `Pay what you want` with a suggested price of `$3`: best if you want lightweight support without suppressing downloads

Do not start with a premium price unless the build includes especially polished creator workflows, strong visuals, and documentation that make it feel production-ready.

## Recommended launch sentence

`OpenMetaverseKit is an open-source worldbuilding toolkit for creating browser-based 3D social spaces with Blender import, multiplayer testing, and optional VR support.`
