# Electron + Babylon Viewer: menu `File → Open`

Ниже — минимальная версия Electron-приложения, где **всё отображение делает `@babylonjs/viewer`**, а со стороны Electron добавлено только настоящее desktop-меню:

- **File → Open**
- системный диалог Windows Explorer
- загрузка выбранного `.glb` файла в Babylon Viewer

## Идея

Babylon Viewer уже умеет:
- рендерить модель
- orbit / zoom / pan
- базовый UX просмотра

Поэтому со стороны Electron вам нужен только:
- `Menu`
- `dialog.showOpenDialog`
- безопасная передача пути файла в renderer

---

## Структура проекта

```text
babylon-electron-viewer/
├─ package.json
├─ main.js
├─ preload.js
├─ renderer.js
└─ index.html
```

---

## 1) Установка

```bash
mkdir babylon-electron-viewer
cd babylon-electron-viewer
npm init -y
npm install electron @babylonjs/viewer
```

---

## 2) `package.json`

Добавьте script:

```json
{
  "name": "babylon-electron-viewer",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

---

## 3) `main.js`

Это главное окно, меню **File → Open** и системный Open dialog.

```javascript
const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");
  createAppMenu();
}

async function openModelFromDialog() {
  if (!mainWindow) return;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Open GLB file",
    properties: ["openFile"],
    filters: [
      { name: "3D Models", extensions: ["glb"] }
    ]
  });

  if (result.canceled || !result.filePaths?.length) {
    return;
  }

  mainWindow.webContents.send("open-model", result.filePaths[0]);
}

function createAppMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "quit" }
          ]
        }]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Open...",
          accelerator: "Ctrl+O",
          click: async () => {
            await openModelFromDialog();
          }
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Опционально: renderer может тоже попросить открыть файл
ipcMain.handle("open-glb-dialog", async () => {
  const result = await dialog.showOpenDialog({
    title: "Open GLB file",
    properties: ["openFile"],
    filters: [
      { name: "3D Models", extensions: ["glb"] }
    ]
  });

  if (result.canceled || !result.filePaths?.length) {
    return null;
  }

  return result.filePaths[0];
});
```

---

## 4) `preload.js`

Безопасный bridge между Electron и renderer.

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopViewer", {
  openDialog: () => ipcRenderer.invoke("open-glb-dialog"),
  onOpenModel: (callback) => {
    ipcRenderer.on("open-model", (_event, filePath) => {
      callback(filePath);
    });
  }
});
```

---

## 5) `index.html`

Babylon Viewer занимает всё окно. Никакие дополнительные UI-кнопки не нужны, потому что открытие идёт через desktop menu.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Babylon GLB Viewer</title>

  <script type="module">
    import "@babylonjs/viewer";
  </script>

  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #1e1e1e;
    }

    babylon-viewer,
    babylon {
      display: block;
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <babylon id="viewer"></babylon>
  <script src="./renderer.js"></script>
</body>
</html>
```

---

## 6) `renderer.js`

Когда Electron menu выбирает файл, renderer получает путь и обновляет source у Viewer.

```javascript
function toFileUrl(windowsPath) {
  const normalized = windowsPath.replace(/\\/g, "/");
  return "file:///" + normalized;
}

function loadModel(filePath) {
  const viewer = document.getElementById("viewer");
  viewer.source = toFileUrl(filePath);
  document.title = `Babylon GLB Viewer - ${filePath.split(/[/\\]/).pop()}`;
}

// Событие от menu File -> Open
window.desktopViewer.onOpenModel((filePath) => {
  loadModel(filePath);
});

// Опционально: Ctrl+O можно вызывать и из renderer,
// если позже захотите кнопку/toolbar.
window.addEventListener("keydown", async (event) => {
  if (event.ctrlKey && event.key.toLowerCase() == "o") {
    event.preventDefault();
    const filePath = await window.desktopViewer.openDialog();
    if (filePath) {
      loadModel(filePath);
    }
  }
});
```

---

## 7) Запуск

```bash
npm start
```

После запуска:

1. откроется окно приложения
2. в верхнем меню будет **File**
3. выберите **File → Open...**
4. откроется Windows Explorer
5. выберите `.glb`
6. модель загрузится в Babylon Viewer

---

## Что здесь делает Electron, а что Babylon Viewer

### Electron:
- окно приложения
- desktop menu
- File → Open
- Windows Explorer dialog
- передача абсолютного пути выбранного файла

### Babylon Viewer:
- загрузка `.glb`
- рендеринг
- управление камерой
- UX просмотра модели

---

## Что можно не делать

Если всё остальное вас устраивает в Babylon Viewer, то вам **не нужно**:
- писать свой Babylon.js scene bootstrap
- вручную создавать camera/light/environment
- делать свой custom 3D UI

---

## Короткая инструкция для AI agent

Скопируй проект из 5 файлов:

- `package.json`
- `main.js`
- `preload.js`
- `index.html`
- `renderer.js`

Требования:
1. Использовать `electron` и `@babylonjs/viewer`.
2. В `main.js` создать desktop menu:
   - `File`
   - `Open...`
   - shortcut `Ctrl+O`
3. По `Open...` открыть `dialog.showOpenDialog(...)` только для файлов `.glb`.
4. Выбранный абсолютный Windows path отправить в renderer через `webContents.send("open-model", filePath)`.
5. В renderer преобразовать Windows path в `file:///...` URL.
6. Присвоить этот URL в `viewer.source`.
7. Не добавлять свой 3D engine code, если Babylon Viewer уже покрывает нужный UX.
8. Viewer должен занимать всё окно приложения.
9. Заголовок окна страницы обновлять именем открытого файла.

---

## Если захотите позже

Позже можно добавить без изменения основной архитектуры:
- recent files
- drag-and-drop
- ассоциацию `.glb` с приложением
- splash screen
- packaging через `electron-builder`
