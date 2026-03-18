# Release

## Manual GitHub Release

1. Confirm the app version in `package.json`.
2. Run `npm install` if dependencies changed.
3. Run `npm start` and do a quick smoke test:
   - open a `.glb` or `.gltf`
   - drag and drop a `.glb` or `.gltf`
   - open `Settings -> View...`
   - open `Settings -> Camera...`
   - open `Help -> About`
4. Run `npm run dist`.
5. Check the generated files in `dist/`.
6. Create a Git tag such as `v1.0.0`.
7. Push the tag to GitHub.
8. Create or verify the GitHub Release and attach the artifacts if needed.

## Automated GitHub Release

The repository includes `.github/workflows/release.yml`.

When you push a tag matching `v*`, GitHub Actions will:

- install dependencies
- build the Windows release
- upload the generated release assets to the GitHub Release

## Notes

- The workflow currently targets Windows only.
- Windows code signing is not configured yet.
- If you want the action to publish only from tags and not manual runs, remove `workflow_dispatch`.
