# TODO

## High Priority

- Add a loading state with an overlay or progress bar while a model is opening.
- Improve error UX so invalid or failed model loads show clearer, friendlier messages.
- Test and harden packaged-app `.glb` file association behavior from Windows Explorer.

## UX Polish

- Improve drag-and-drop polish with a clearer drop target state and optional filename preview before load.
- Add a first-run hint or small `?` button so Help is easier to discover.
- Add a few one-click view presets such as `Studio`, `Dark`, `Bright`, and `Neutral`.
- Add a small confirmation or status message when opening external links from the About panel.

## Window And Startup

- Persist window size, position, and maximized/fullscreen state between launches.
- Add optional startup polish such as a splash screen.
- Review and polish reopen-last-on-startup behavior in the packaged build.

## Settings And Preferences

- Consolidate persisted settings into a single preferences store instead of splitting between JSON files and `localStorage`.
- Review recent files and recent folders cleanup behavior.
- Add an action such as `Clear Missing Entries` for recent items.

## Help And Diagnostics

- Expand `Help -> About` with more diagnostics, such as build info.
- Add `Help -> Copy Diagnostics`.
- Add `Help -> Open Logs`.

## Packaging And Release

- Verify packaged app icon behavior in installer, taskbar, Start menu, and desktop shortcut.
- Verify uninstall entry and Windows app metadata.
- Review app naming consistency across package metadata, window title, installer, and About panel.
- Run a full packaged-app QA pass rather than relying only on `npm start`.

## Later

- Prepare for macOS packaging and platform polish when ready.
