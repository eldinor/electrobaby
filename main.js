const { app, BrowserWindow, Menu, dialog, ipcMain, nativeImage, shell } = require("electron");
const fs = require("fs");
const path = require("path");

const MAX_RECENT_FILES = 10;
const MAX_RECENT_FOLDERS = 10;
const APP_ICON_PATH = path.join(__dirname, process.platform === "win32" ? "bplogo.ico" : "bplogo.svg");
let mainWindow = null;
let pendingFileToOpen = getFilePathFromArgv(process.argv);

function getRecentStorePath() {
  return path.join(app.getPath("userData"), "recent-files.json");
}

function getPreferencesStorePath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

function normalizeExistingDirectory(directoryPath) {
  return typeof directoryPath === "string" && fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory()
    ? directoryPath
    : null;
}

function normalizeExistingFile(filePath) {
  return typeof filePath === "string" && fs.existsSync(filePath) && fs.statSync(filePath).isFile()
    ? filePath
    : null;
}

function readRecentFiles() {
  try {
    const storePath = getRecentStorePath();
    if (!fs.existsSync(storePath)) {
      return [];
    }

    const parsed = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeExistingFile).filter(Boolean);
  } catch (error) {
    console.error("Failed to read recent files:", error);
    return [];
  }
}

function writeRecentFiles(items) {
  try {
    fs.writeFileSync(getRecentStorePath(), JSON.stringify(items, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write recent files:", error);
  }
}

function readPreferences() {
  try {
    const storePath = getPreferencesStorePath();
    if (!fs.existsSync(storePath)) {
      return {
        reopenLastOnStartup: false,
        recentFolders: [],
        lastOpenDirectory: null
      };
    }

    const parsed = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    return {
      reopenLastOnStartup: Boolean(parsed?.reopenLastOnStartup),
      recentFolders: Array.isArray(parsed?.recentFolders)
        ? parsed.recentFolders.map(normalizeExistingDirectory).filter(Boolean).slice(0, MAX_RECENT_FOLDERS)
        : [],
      lastOpenDirectory: normalizeExistingDirectory(parsed?.lastOpenDirectory)
    };
  } catch (error) {
    console.error("Failed to read preferences:", error);
    return {
      reopenLastOnStartup: false,
      recentFolders: [],
      lastOpenDirectory: null
    };
  }
}

function writePreferences(preferences) {
  try {
    fs.writeFileSync(getPreferencesStorePath(), JSON.stringify(preferences, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write preferences:", error);
  }
}

function addRecentFile(filePath) {
  const folderPath = path.dirname(filePath);
  const preferences = readPreferences();
  const recentFolders = [folderPath, ...preferences.recentFolders.filter((item) => item !== folderPath)].slice(
    0,
    MAX_RECENT_FOLDERS
  );

  const updated = [filePath, ...readRecentFiles().filter((item) => item !== filePath)].slice(
    0,
    MAX_RECENT_FILES
  );

  writeRecentFiles(updated);
  writePreferences({
    ...preferences,
    recentFolders,
    lastOpenDirectory: folderPath
  });
  createAppMenu();
}

function clearRecentFiles() {
  writeRecentFiles([]);
  createAppMenu();
}

function setReopenLastOnStartup(enabled) {
  const preferences = readPreferences();
  writePreferences({
    ...preferences,
    reopenLastOnStartup: Boolean(enabled)
  });
  createAppMenu();
}

function getRecentFolders() {
  return readPreferences().recentFolders;
}

function getDefaultOpenDirectory() {
  const preferences = readPreferences();
  return preferences.lastOpenDirectory || preferences.recentFolders[0] || undefined;
}

function clearRecentFolders() {
  const preferences = readPreferences();
  writePreferences({
    ...preferences,
    recentFolders: [],
    lastOpenDirectory: null
  });
  createAppMenu();
}

function sendFileToRenderer(filePath) {
  const normalizedFilePath = normalizeExistingFile(filePath);
  if (!mainWindow || !normalizedFilePath) {
    return;
  }

  addRecentFile(normalizedFilePath);
  mainWindow.webContents.send("open-model", normalizedFilePath);
}

async function showOpenDialog(targetWindow = mainWindow, directoryPath = getDefaultOpenDirectory()) {
  const result = await dialog.showOpenDialog(targetWindow, {
    title: "Open GLB file",
    defaultPath: directoryPath,
    properties: ["openFile"],
    filters: [{ name: "3D Models", extensions: ["glb"] }]
  });

  if (result.canceled || !result.filePaths?.length) {
    return null;
  }

  return result.filePaths[0];
}

async function openModelFromDialog() {
  const filePath = await showOpenDialog(mainWindow);
  if (filePath) {
    sendFileToRenderer(filePath);
  }
}

async function openModelFromFolder(folderPath) {
  const directoryPath = normalizeExistingDirectory(folderPath);
  if (!directoryPath) {
    return;
  }

  const filePath = await showOpenDialog(mainWindow, directoryPath);
  if (filePath) {
    sendFileToRenderer(filePath);
  }
}

function createRecentFoldersSubmenu() {
  const items = getRecentFolders();

  if (!items.length) {
    return [{ label: "No Recent Folders", enabled: false }];
  }

  return [
    ...items.map((folderPath) => ({
      label: path.basename(folderPath) || folderPath,
      sublabel: folderPath,
      click: async () => {
        await openModelFromFolder(folderPath);
      }
    })),
    { type: "separator" },
    {
      label: "Clear Recent Folders",
      click: () => clearRecentFolders()
    }
  ];
}

function createRecentSubmenu() {
  const items = readRecentFiles();

  if (!items.length) {
    return [{ label: "No Recent Files", enabled: false }];
  }

  return [
    ...items.map((filePath) => ({
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
  const preferences = readPreferences();
  const fullscreenAccelerator = isMac ? "Ctrl+Cmd+F" : "F11";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }]
          }
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Open...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            await openModelFromDialog();
          }
        },
        {
          label: "Open Recent",
          submenu: createRecentSubmenu()
        },
        {
          label: "Open Recent Folder",
          submenu: createRecentFoldersSubmenu()
        },
        {
          label: "Reopen Last On Startup",
          type: "checkbox",
          checked: preferences.reopenLastOnStartup,
          click: (menuItem) => {
            setReopenLastOnStartup(menuItem.checked);
          }
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit", label: "Exit" }
      ]
    },
    {
      label: "Settings",
      submenu: [
        {
          label: "View...",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            mainWindow?.webContents.send("toggle-view-settings");
          }
        },
        {
          label: "Camera...",
          accelerator: "CmdOrCtrl+Shift+,",
          click: () => {
            mainWindow?.webContents.send("toggle-camera-settings");
          }
        }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggledevtools" },
        { type: "separator" },
        {
          role: "togglefullscreen",
          accelerator: fullscreenAccelerator
        }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "User Guide",
          accelerator: "F1",
          click: () => {
            openUserGuideWindow();
          }
        },
        {
          label: "About BabylonPress 3D Viewer",
          click: () => {
            mainWindow?.webContents.send("toggle-about-panel");
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function openUserGuideWindow() {
  mainWindow?.webContents.send("toggle-help-panel");
}

function createWindow() {
  const windowIcon = fs.existsSync(APP_ICON_PATH) ? nativeImage.createFromPath(APP_ICON_PATH) : undefined;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: windowIcon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");
  createAppMenu();

  mainWindow.webContents.once("did-finish-load", () => {
    const preferences = readPreferences();
    const [lastFile] = readRecentFiles();

    if (pendingFileToOpen) {
      sendFileToRenderer(pendingFileToOpen);
      pendingFileToOpen = null;
      return;
    }

    if (preferences.reopenLastOnStartup && lastFile) {
      sendFileToRenderer(lastFile);
    }
  });
}

function getFilePathFromArgv(argv) {
  for (const value of argv.slice(1)) {
    if (!value || value.startsWith("-")) {
      continue;
    }

    const normalizedPath = path.resolve(value);
    if (path.extname(normalizedPath).toLowerCase() === ".glb" && normalizeExistingFile(normalizedPath)) {
      return normalizedPath;
    }
  }

  return null;
}

function handleFileOpenRequest(filePath) {
  const normalizedFilePath = normalizeExistingFile(filePath);
  if (!normalizedFilePath) {
    return;
  }

  pendingFileToOpen = normalizedFilePath;

  if (mainWindow?.webContents?.isLoading()) {
    return;
  }

  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
    sendFileToRenderer(normalizedFilePath);
    pendingFileToOpen = null;
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const filePath = getFilePathFromArgv(argv);
    if (filePath) {
      handleFileOpenRequest(filePath);
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("open-file", (event, filePath) => {
  event.preventDefault();
  handleFileOpenRequest(filePath);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("open-glb-dialog", async () => {
  const filePath = await showOpenDialog();
  if (filePath) {
    addRecentFile(filePath);
  }

  return filePath;
});

ipcMain.handle("get-recent-files", async () => {
  return readRecentFiles();
});

ipcMain.handle("remember-file", async (_event, filePath) => {
  if (!normalizeExistingFile(filePath)) {
    return false;
  }

  addRecentFile(filePath);
  return true;
});

ipcMain.handle("get-app-info", async () => {
  return {
    name: "BabylonPress 3D Viewer",
    version: app.getVersion(),
    description: "Desktop GLB viewer powered by Babylon Viewer and Electron."
  };
});

ipcMain.handle("open-external-url", async (_event, url) => {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return false;
  }

  await shell.openExternal(url);
  return true;
});
