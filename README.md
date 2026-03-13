# BabylonPress 3D Viewer

BabylonPress 3D Viewer is a desktop GLB viewer for Windows built with Electron and Babylon Viewer.

It is designed as a lightweight desktop shell around `@babylonjs/viewer`, with file opening, recent files, drag-and-drop, view settings, camera settings, and in-app help.

## Features

- Open `.glb` files from `File -> Open...`
- Drag-and-drop `.glb` files into the viewer window
- Recent files and recent folders
- Reopen last file on startup
- File association support for `.glb` in packaged Windows builds
- `Settings -> View...`
- `Settings -> Camera...`
- `Help -> User Guide`
- `Help -> About BabylonPress 3D Viewer`
- Windows packaging with `electron-builder`

## Tech Stack

- Electron
- `@babylonjs/viewer`
- `electron-builder`

## Requirements

- Node.js 18+
- npm
- Windows for the current packaging target

## Install

```bash
npm install
```

## Run In Development

```bash
npm start
```

## Build Windows Release

```bash
npm run dist
```

Build output is generated in `dist/`.

## Main Shortcuts

- `Ctrl+O` or `Cmd+O`: Open a model
- `F1`: Open the user guide
- `F11`: Toggle fullscreen on Windows/Linux
- `Ctrl+Cmd+F`: Toggle fullscreen on macOS
- `Esc`: Close open panels

## GitHub Releases

You can distribute desktop builds through GitHub Releases by:

1. Running `npm run dist`
2. Taking the generated files from `dist/`
3. Uploading them as release assets on GitHub

## Current Limitations

- Windows is the only packaging target currently configured.
- macOS packaging is not set up yet.
- Linux packaging is not set up yet.
- The app is focused on `.glb` viewing only.

## Notes

- In development mode, Windows may still show the Electron icon instead of the packaged app icon.
- The packaged Windows build uses `bplogo.ico`.
- Babylon Viewer itself handles model viewing and animation UI; this app focuses on desktop app behavior around it.
