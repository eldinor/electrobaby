# Release

## Changelog

### 1.0.3

- Added `.gltf` support alongside `.glb` for file open, drag-and-drop, recent items, and command-line/Explorer open handling.
- Added an installer option to associate `.glb` and `.gltf` files from Windows Explorer.
- Improved load error messages for invalid `.glb`, invalid `.gltf`, and missing `.gltf` sidecar file cases.
- Renamed the app consistently to `BabylonPress GLB GLTF Viewer` across the app UI, packaging, and documentation.
- Updated the help and user guide copy to clarify that `.gltf` files require valid references to their `.bin` and texture files.
- Excluded test assets and test directories from packaged release bundles.

## Manual GitHub Release

1. Confirm the app version in `package.json`.
2. Run `npm install` if dependencies changed.
3. Run `npm start` and do a development smoke test:
   - open a valid `.glb`
   - open a valid `.gltf`
   - drag and drop a `.glb` or `.gltf`
   - try one intentionally broken `.glb` or `.gltf` and confirm the error message is understandable
   - open `Settings -> View...`
   - open `Settings -> Camera...`
   - open `Help -> About`
   - open `Help -> User Guide`
4. Run `npm run dist`.
5. Check the generated files in `dist/`.
6. Run a packaged-build QA pass:
   - launch the packaged app directly
   - confirm the app name is `BabylonPress GLB GLTF Viewer` in the executable, window title, About panel, and installer
   - open a `.glb` from `File -> Open...`
   - open a `.gltf` with valid `.bin` and texture references
   - confirm an invalid `.glb` or `.gltf` shows a friendly error
   - verify `Open Recent`, `Open Recent Folder`, and `Reopen Last On Startup`
   - verify the app icon looks correct in the executable, taskbar, and Start menu
7. Test installer and Explorer integration:
   - run the NSIS installer
   - verify the optional `.glb` and `.gltf` association checkbox appears
   - if associations are enabled, double-click `.glb` and `.gltf` from Explorer
   - uninstall and verify the uninstall entry looks correct in Windows Apps & Features
8. Create a Git tag such as `v1.0.0`.
9. Push the tag to GitHub.
10. Create or verify the GitHub Release and attach the artifacts if needed.

## Automated GitHub Release

The repository includes `.github/workflows/release.yml`.

When you push a tag matching `v*`, GitHub Actions will:

- install dependencies
- build the Windows release
- upload the generated release assets to the GitHub Release

## Notes

- The workflow currently targets Windows only.
- Windows code signing is not configured yet.
- `.gltf` files depend on valid references to required `.bin` and texture files.
- If `npm run dist` or `npm run dist:dir` fails because `dist/win-unpacked/resources/app.asar` is locked, close anything holding files in `dist/` or build to a fresh output folder.
- If you want the action to publish only from tags and not manual runs, remove `workflow_dispatch`.
