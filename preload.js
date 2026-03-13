const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopViewer", {
  openDialog: () => ipcRenderer.invoke("open-glb-dialog"),
  openExternalUrl: (url) => ipcRenderer.invoke("open-external-url", url),
  getRecentFiles: () => ipcRenderer.invoke("get-recent-files"),
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),
  rememberFile: (filePath) => ipcRenderer.invoke("remember-file", filePath),
  onToggleViewSettings: (callback) => {
    ipcRenderer.on("toggle-view-settings", () => {
      callback();
    });
  },
  onToggleCameraSettings: (callback) => {
    ipcRenderer.on("toggle-camera-settings", () => {
      callback();
    });
  },
  onToggleHelpPanel: (callback) => {
    ipcRenderer.on("toggle-help-panel", () => {
      callback();
    });
  },
  onToggleAboutPanel: (callback) => {
    ipcRenderer.on("toggle-about-panel", () => {
      callback();
    });
  },
  onOpenModel: (callback) => {
    ipcRenderer.on("open-model", (_event, filePath) => {
      callback(filePath);
    });
  }
});
