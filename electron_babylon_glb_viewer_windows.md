# Electron + Babylon Viewer GLB Viewer (Windows)

This guide describes how to build a **desktop GLB viewer for Windows**
using:

-   Electron
-   @babylonjs/viewer (Babylon Viewer Web Component)
-   Windows File Explorer dialog to open `.glb` files

The result is a simple desktop app that lets the user click **Open GLB**
and select a model from Windows Explorer.

------------------------------------------------------------------------

# 1. Prerequisites

Install:

-   Node.js 18+
-   npm

Check:

    node -v
    npm -v

------------------------------------------------------------------------

# 2. Create Project

    mkdir babylon-electron-viewer
    cd babylon-electron-viewer
    npm init -y

Install dependencies:

    npm install electron @babylonjs/viewer

------------------------------------------------------------------------

# 3. Project Structure

    babylon-electron-viewer
    │
    ├── main.js
    ├── preload.js
    ├── renderer.js
    ├── index.html
    └── package.json

------------------------------------------------------------------------

# 4. main.js (Electron main process)

``` javascript
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

ipcMain.handle("open-glb-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "GLB Models", extensions: ["glb"] }
    ]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});
```

------------------------------------------------------------------------

# 5. preload.js

Expose a safe API from Electron to the browser.

``` javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openGLB: () => ipcRenderer.invoke("open-glb-dialog")
});
```

------------------------------------------------------------------------

# 6. renderer.js

Loads the selected GLB into Babylon Viewer.

``` javascript
document.getElementById("openButton").onclick = async () => {

  const filePath = await window.electronAPI.openGLB();

  if (!filePath) return;

  const viewer = document.querySelector("babylon");

  viewer.source = "file://" + filePath.replace(/\\/g, "/");
};
```

------------------------------------------------------------------------

# 7. index.html

``` html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Babylon GLB Viewer</title>

<script type="module">
import "@babylonjs/viewer";
</script>

<style>
body{
margin:0;
overflow:hidden;
font-family:sans-serif;
}

#toolbar{
position:absolute;
top:10px;
left:10px;
z-index:10;
background:white;
padding:10px;
border-radius:6px;
box-shadow:0 0 10px rgba(0,0,0,0.2);
}
</style>

</head>

<body>

<div id="toolbar">
<button id="openButton">Open GLB</button>
</div>

<babylon style="width:100vw;height:100vh;"></babylon>

<script src="renderer.js"></script>

</body>
</html>
```

------------------------------------------------------------------------

# 8. package.json

Replace scripts with:

``` json
"scripts": {
  "start": "electron ."
}
```

------------------------------------------------------------------------

# 9. Run the Viewer

    npm start

You will get a desktop window.

Click:

    Open GLB

Windows Explorer opens → select a `.glb` file → model loads.

------------------------------------------------------------------------

# 10. Optional Improvements

### Drag and Drop Support

Add to `renderer.js`:

``` javascript
window.addEventListener("drop", e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if(file.name.endsWith(".glb")){
    document.querySelector("babylon").source = "file://" + file.path.replace(/\\/g,"/");
  }
});

window.addEventListener("dragover", e => e.preventDefault());
```

------------------------------------------------------------------------

# 11. Packaging as EXE

Install builder:

    npm install electron-builder --save-dev

Add to package.json:

``` json
"build": {
  "appId": "babylon.glb.viewer",
  "win": {
    "target": "nsis"
  }
}
```

Build:

    npx electron-builder

Produces:

    dist/BabylonViewerSetup.exe

------------------------------------------------------------------------

# Result

You now have a **Windows desktop GLB viewer using Babylon Viewer and
Electron**.
