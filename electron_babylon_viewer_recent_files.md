# Electron + Babylon Viewer: `File → Open` + `Recent Files`

Ниже — расширение предыдущего варианта: настоящее desktop-меню в Electron, где есть:

- **File → Open...**
- **File → Open Recent**
- сохранение списка последних файлов
- загрузка `.glb` в `@babylonjs/viewer`

Babylon Viewer по-прежнему отвечает за сам просмотр модели. Electron отвечает только за shell-функции desktop app.

---

## Что получится

В приложении будет меню:

```text
File
 ├─ Open...
 ├─ Open Recent
 │   ├─ model1.glb
 │   ├─ scene.glb
 │   └─ Clear Recent
 └─ Exit
```

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

Этот файл делает всё desktop-side:

- создаёт окно
- показывает `File → Open...`
- хранит список recent files
- пересобирает меню после каждого открытия
- отправляет путь файла в renderer

```javascript
const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;

function getRecentStorePath() {
  return path.join(app.getPath("userData"), "recent-files.json");
}

function readRecentFiles() {
  try {
    const filePath = getRecentStorePath();
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(p => typeof p === "string" && fs.existsSync(p));
  } catch (error) {
    console.error("Failed to read recent files:", error);
    return [];
  }
}

function writeRecentFiles(items) {
  try {
    fs.writeFileSync(
      getRecentStorePath(),
      JSON.stringify(items, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Failed to write recent files:", error);
  }
}

function addRecentFile(filePath) {
  const current = readRecentFiles().filter(p => p !== filePath);
  const updated = [filePath, ...current].slice(0, 10);
  writeRecentFiles(updated);
  createAppMenu();
}

function clearRecentFiles() {
  writeRecentFiles([]);
  createAppMenu();
}

function sendFileToRenderer(filePath) {
  if (!mainWindow || !filePath) return;
  if (!fs.existsSync(filePath)) return;

  addRecentFile(filePath);
  mainWindow.webContents.send("open-model", filePath);
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

  sendFileToRenderer(result.filePaths[0]);
}

function createRecentSubmenu() {
  const items = readRecentFiles();

  if (!items.length) {
    return [
      {
        label: "No Recent Files",
        enabled: false
      }
    ];
  }

  return [
    ...items.map(filePath => ({
      label: path.basename(filePath),
      sublabel: filePath,
      click: () => sendFileToRenderer(filePath)
    })),
    { type: "separator" },
    {
      label: "Clear Recent",
      click: () => clearRecentFiles()
    }
  ];
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
        {
          label: "Open Recent",
          submenu: createRecentSubmenu()
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit", label: "Exit" }
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

ipcMain.handle("get-recent-files", async () => {
  return readRecentFiles();
});
```

---

## 4) `preload.js`

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopViewer", {
  openDialog: () => ipcRenderer.invoke("open-glb-dialog"),
  getRecentFiles: () => ipcRenderer.invoke("get-recent-files"),
  onOpenModel: (callback) => {
    ipcRenderer.on("open-model", (_event, filePath) => {
      callback(filePath);
    });
  }
});
```

---

## 5) `index.html`

Babylon Viewer занимает всё окно.

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

Renderer только получает путь файла и назначает `source` Viewer-у.

```javascript
function toFileUrl(windowsPath) {
  const normalized = windowsPath.replace(/\\/g, "/");
  return "file:///" + normalized;
}

function getFileName(filePath) {
  return filePath.split(/[/\\]/).pop() || "Viewer";
}

function loadModel(filePath) {
  const viewer = document.getElementById("viewer");
  viewer.source = toFileUrl(filePath);
  document.title = `Babylon GLB Viewer - ${getFileName(filePath)}`;
}

window.desktopViewer.onOpenModel((filePath) => {
  loadModel(filePath);
});

// Опционально: support Ctrl+O и со стороны renderer
window.addEventListener("keydown", async (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === "o") {
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
2. выберите **File → Open...**
3. откроется Windows Explorer
4. выберите `.glb`
5. модель загрузится
6. файл автоматически появится в **File → Open Recent**

---

## Где хранится список recent files

Список хранится в:

```text
app.getPath("userData")/recent-files.json
```

На Windows это обычно что-то вроде:

```text
C:\Users\<USER>\AppData\Roaming\<app-name>\recent-files.json
```

---

## Поведение `Recent Files`

Текущая реализация:

- хранит до **10** файлов
- удаляет дубликаты
- поднимает последний открытый файл наверх
- скрывает битые пути, если файл уже удалён
- поддерживает `Clear Recent`

---

## Минимальная инструкция для AI agent

Собери Electron desktop viewer на базе `@babylonjs/viewer`.

Требования:
1. Не писать собственную 3D-сцену, использовать только Babylon Viewer.
2. Сделать меню:
   - `File → Open...`
   - `File → Open Recent`
   - `File → Exit`
3. Для `Open...` использовать `dialog.showOpenDialog(...)` с фильтром только `glb`.
4. Хранить recent files в JSON-файле внутри `app.getPath("userData")`.
5. Хранить максимум 10 путей.
6. При повторном открытии файла поднимать его наверх списка.
7. В `Open Recent` показывать basename файла, а полный путь хранить как значение.
8. По клику на recent item отправлять путь в renderer.
9. В renderer преобразовать Windows path в `file:///...` URL.
10. Назначать этот URL в `viewer.source`.
11. Viewer должен занимать всё окно.
12. Заголовок окна должен содержать имя текущего файла.

---

## Что можно добавить потом

Без изменения базовой схемы можно быстро добавить:

- **drag-and-drop**
- **recent folders**
- **ассоциацию `.glb` с приложением**
- **Open With...**
- **последний открытый файл при старте**
- **splash screen**
- **electron-builder packaging**

---

## Полезное упрощение

Если нужен только desktop shell вокруг Babylon Viewer, этого уже достаточно. Не нужно:
- писать свою Babylon.js camera logic
- вручную создавать light/environment
- строить отдельный custom viewer UI
