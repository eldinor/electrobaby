const APP_CONFIG = {
  appId: "com.babylonpress.viewer",
  internalName: "electrobaby",
  productName: "BabylonPress 3D Viewer",
  description: "Desktop GLB viewer powered by Babylon Viewer and Electron.",
  links: {
    website: "https://babylonpress.org/",
    source: "https://example.com/source"
  },
  files: {
    iconWindows: "bplogo.ico",
    iconDefault: "bplogo.svg",
    modelExtensions: ["glb"]
  },
  recent: {
    maxFiles: 10,
    maxFolders: 10
  },
  defaults: {
    viewSettings: {
      toneMapping: "standard",
      exposure: 1,
      contrast: 1,
      environmentIntensity: 1,
      environmentRotation: 0,
      skyboxBlur: 0.3,
      environmentVisible: false,
      backgroundColor: "#1e1e1e"
    },
    cameraSettings: {
      autoRotate: false,
      autoRotateSpeed: 0.3,
      autoRotateDelay: 2000
    }
  },
  ui: {
    openModelDialogTitle: "Open GLB file",
    modelFilterName: "3D Models",
    helpMenuLabel: "User Guide",
    aboutMenuLabel: "About BabylonPress 3D Viewer"
  },
  copy: {
    emptyState: {
      title: "Drop a GLB file to begin",
      bodyHtml: 'Drag a <kbd>.glb</kbd> file into this window <br>or use <kbd>File -> Open...</kbd> to load a model'
    },
    viewPanel: {
      title: "View Settings",
      closeLabel: "Close",
      resetLabel: "Reset View Settings",
      fields: {
        toneMapping: "Tone Mapping",
        toneMappingOptions: {
          standard: "Standard",
          aces: "ACES",
          neutral: "Neutral",
          none: "None"
        },
        exposure: "Exposure",
        contrast: "Contrast",
        environmentIntensity: "Environment Intensity",
        environmentRotation: "Environment Rotation",
        skyboxBlur: "Skybox Blur",
        environmentVisible: "Show Environment",
        backgroundColor: "Background Color"
      }
    },
    cameraPanel: {
      title: "Camera Settings",
      closeLabel: "Close",
      resetLabel: "Reset Camera Settings",
      fields: {
        autoRotate: "Auto Rotate",
        autoRotateSpeed: "Auto Rotate Speed",
        autoRotateDelay: "Auto Rotate Delay"
      }
    },
    help: {
      title: "User Guide",
      cards: [
        {
          title: "Open a Model",
          bodyHtml:
            "<ol><li>Choose <kbd>File</kbd> -> <kbd>Open...</kbd>.</li><li>Select a valid <kbd>.glb</kbd> file.</li><li>The model will load in the viewer.</li></ol>"
        },
        {
          title: "Drag and Drop",
          bodyHtml:
            "<p>Drop a <kbd>.glb</kbd> file directly into the window to open it.</p><p>If the file is invalid, the status banner will explain that the file should be checked.</p>"
        },
        {
          title: "Recent Items",
          bodyHtml:
            "<ul><li><kbd>File</kbd> -> <kbd>Open Recent</kbd></li><li><kbd>File</kbd> -> <kbd>Open Recent Folder</kbd></li><li><kbd>File</kbd> -> <kbd>Reopen Last On Startup</kbd></li></ul>"
        },
        {
          title: "Shortcuts",
          bodyHtml:
            "<ul><li><kbd>Ctrl+O</kbd> / <kbd>Cmd+O</kbd>: Open model</li><li><kbd>F1</kbd>: Open Help</li><li><kbd>F11</kbd>: Fullscreen on Windows/Linux</li><li><kbd>Esc</kbd>: Close open panels</li></ul>"
        }
      ],
      sections: [
        {
          title: "View Settings",
          bodyHtml:
            "<p>Open <kbd>Settings</kbd> -> <kbd>View...</kbd> to adjust tone mapping, exposure, contrast, environment intensity, environment rotation, skybox blur, environment visibility, and background color.</p>"
        },
        {
          title: "Camera Settings",
          bodyHtml:
            "<p>Open <kbd>Settings</kbd> -> <kbd>Camera...</kbd> to control auto rotate, auto rotate speed, and auto rotate delay.</p>"
        },
        {
          title: "Troubleshooting",
          bodyHtml:
            "<ul><li>If a model does not load, confirm that the file is a valid <kbd>.glb</kbd>.</li><li>If the scene looks too dark, enable <kbd>Show Environment</kbd> in <kbd>Settings</kbd> -> <kbd>View...</kbd>.</li></ul>"
        }
      ]
    },
    about: {
      title: "About",
      closeLabel: "Close",
      createdByLabel: "Created by BabylonPress.org",
      sourceLabel: "Source",
      meta: [
        { label: "Supported format", value: "GLB" },
        { label: "Main actions", value: "Open, drag-and-drop, recent files, view settings, camera settings" },
        { label: "Help shortcut", value: "F1" }
      ]
    }
  }
};

module.exports = {
  APP_CONFIG
};
