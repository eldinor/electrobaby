function toFileUrl(windowsPath) {
  const normalized = windowsPath.replace(/\\/g, "/");
  return encodeURI(`file:///${normalized}`);
}

const VIEW_SETTINGS_STORAGE_KEY = "babylonpress.viewSettings";
const CAMERA_SETTINGS_STORAGE_KEY = "babylonpress.cameraSettings";
const DEFAULT_ENVIRONMENT_SOURCE = "auto";
const DEFAULT_VIEW_SETTINGS = {
  toneMapping: "standard",
  exposure: 1,
  contrast: 1,
  environmentIntensity: 1,
  environmentRotation: 0,
  skyboxBlur: 0.3,
  environmentVisible: true,
  backgroundColor: "#1e1e1e"
};
const DEFAULT_CAMERA_SETTINGS = {
  autoRotate: false,
  autoRotateSpeed: 0.3,
  autoRotateDelay: 2000
};

function getFileName(filePath) {
  return filePath.split(/[/\\]/).pop() || "Viewer";
}

function getViewer() {
  return document.getElementById("viewer");
}

function setStatusMessage(message) {
  const banner = document.getElementById("status-banner");
  if (!banner) {
    return;
  }

  banner.textContent = message || "";
  banner.classList.toggle("hidden", !message);
}

function setEmptyStateVisible(isVisible) {
  const emptyState = document.getElementById("empty-state");
  if (!emptyState) {
    return;
  }

  emptyState.classList.toggle("hidden", !isVisible);
}

function loadModel(filePath) {
  const viewer = getViewer();
  if (!viewer || !filePath) {
    return;
  }

  setStatusMessage("");
  const source = toFileUrl(filePath);
  viewer.setAttribute("source", source);
  viewer.source = source;
  document.title = `Babylon GLB Viewer - ${getFileName(filePath)}`;
  setEmptyStateVisible(false);
}

window.desktopViewer.onOpenModel((filePath) => {
  loadModel(filePath);
});

function getErrorMessage(errorLike) {
  const fallback = "The model could not be loaded. Check if the file is a valid GLB.";

  if (errorLike?.message) {
    return `${errorLike.message} Check if the file is a valid GLB.`;
  }

  if (typeof errorLike === "string") {
    return `${errorLike} Check if the file is a valid GLB.`;
  }

  return fallback;
}

function attachViewerErrorHandling() {
  const viewer = getViewer();
  if (!viewer) {
    return;
  }

  const handleError = (event) => {
    const detail = event?.detail ?? event?.error ?? event;
    setStatusMessage(getErrorMessage(detail));
    setEmptyStateVisible(true);
  };

  viewer.addEventListener("modelerror", handleError);
  viewer.addEventListener("error", handleError);
  viewer.onFaulted = (error) => {
    setStatusMessage(getErrorMessage(error));
    setEmptyStateVisible(true);
  };
}

attachViewerErrorHandling();

function normalizeViewSettings(rawSettings) {
  return {
    toneMapping: typeof rawSettings?.toneMapping === "string" ? rawSettings.toneMapping : DEFAULT_VIEW_SETTINGS.toneMapping,
    exposure: Number.isFinite(rawSettings?.exposure) ? rawSettings.exposure : DEFAULT_VIEW_SETTINGS.exposure,
    contrast: Number.isFinite(rawSettings?.contrast) ? rawSettings.contrast : DEFAULT_VIEW_SETTINGS.contrast,
    environmentIntensity: Number.isFinite(rawSettings?.environmentIntensity)
      ? rawSettings.environmentIntensity
      : DEFAULT_VIEW_SETTINGS.environmentIntensity,
    environmentRotation: Number.isFinite(rawSettings?.environmentRotation)
      ? rawSettings.environmentRotation
      : DEFAULT_VIEW_SETTINGS.environmentRotation,
    skyboxBlur: Number.isFinite(rawSettings?.skyboxBlur) ? rawSettings.skyboxBlur : DEFAULT_VIEW_SETTINGS.skyboxBlur,
    environmentVisible:
      typeof rawSettings?.environmentVisible === "boolean"
        ? rawSettings.environmentVisible
        : DEFAULT_VIEW_SETTINGS.environmentVisible,
    backgroundColor:
      typeof rawSettings?.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(rawSettings.backgroundColor)
        ? rawSettings.backgroundColor
        : DEFAULT_VIEW_SETTINGS.backgroundColor
  };
}

function readViewSettings() {
  try {
    const rawValue = window.localStorage.getItem(VIEW_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return { ...DEFAULT_VIEW_SETTINGS };
    }

    return normalizeViewSettings(JSON.parse(rawValue));
  } catch (_error) {
    return { ...DEFAULT_VIEW_SETTINGS };
  }
}

function writeViewSettings(settings) {
  window.localStorage.setItem(VIEW_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function readCameraSettings() {
  try {
    const rawValue = window.localStorage.getItem(CAMERA_SETTINGS_STORAGE_KEY);
    if (!rawValue) {
      return { ...DEFAULT_CAMERA_SETTINGS };
    }

    const parsed = JSON.parse(rawValue);
    return {
      autoRotate: typeof parsed?.autoRotate === "boolean" ? parsed.autoRotate : DEFAULT_CAMERA_SETTINGS.autoRotate,
      autoRotateSpeed: Number.isFinite(parsed?.autoRotateSpeed)
        ? parsed.autoRotateSpeed
        : DEFAULT_CAMERA_SETTINGS.autoRotateSpeed,
      autoRotateDelay: Number.isFinite(parsed?.autoRotateDelay)
        ? parsed.autoRotateDelay
        : DEFAULT_CAMERA_SETTINGS.autoRotateDelay
    };
  } catch (_error) {
    return { ...DEFAULT_CAMERA_SETTINGS };
  }
}

function writeCameraSettings(settings) {
  window.localStorage.setItem(CAMERA_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function formatSettingValue(value) {
  return Number(value).toFixed(2);
}

function applyViewSettings(settings) {
  const viewer = getViewer();
  if (!viewer) {
    return;
  }

  viewer.setAttribute("environment", DEFAULT_ENVIRONMENT_SOURCE);
  viewer.environment = DEFAULT_ENVIRONMENT_SOURCE;

  viewer.toneMapping = settings.toneMapping;
  viewer.exposure = settings.exposure;
  viewer.contrast = settings.contrast;
  viewer.environmentIntensity = settings.environmentIntensity;
  viewer.environmentRotation = settings.environmentRotation;
  viewer.skyboxBlur = settings.skyboxBlur;
  viewer.environmentVisible = settings.environmentVisible;
  viewer.setAttribute("clear-color", settings.backgroundColor);
  document.body.style.backgroundColor = settings.backgroundColor;
}

function applyCameraSettings(settings) {
  const viewer = getViewer();
  if (!viewer) {
    return;
  }

  viewer.cameraAutoOrbit = settings.autoRotate;
  viewer.cameraAutoOrbitSpeed = settings.autoRotateSpeed;
  viewer.cameraAutoOrbitDelay = settings.autoRotateDelay;
}

function syncViewSettingsForm(settings) {
  const toneMappingSelect = document.getElementById("tone-mapping-select");
  const exposureRange = document.getElementById("exposure-range");
  const contrastRange = document.getElementById("contrast-range");
  const environmentIntensityRange = document.getElementById("environment-intensity-range");
  const environmentRotationRange = document.getElementById("environment-rotation-range");
  const skyboxBlurRange = document.getElementById("skybox-blur-range");
  const environmentVisibleCheckbox = document.getElementById("environment-visible-checkbox");
  const backgroundColorInput = document.getElementById("background-color-input");
  const exposureValue = document.getElementById("exposure-value");
  const contrastValue = document.getElementById("contrast-value");
  const environmentIntensityValue = document.getElementById("environment-intensity-value");
  const environmentRotationValue = document.getElementById("environment-rotation-value");
  const skyboxBlurValue = document.getElementById("skybox-blur-value");

  toneMappingSelect.value = settings.toneMapping;
  exposureRange.value = String(settings.exposure);
  contrastRange.value = String(settings.contrast);
  environmentIntensityRange.value = String(settings.environmentIntensity);
  environmentRotationRange.value = String(settings.environmentRotation);
  skyboxBlurRange.value = String(settings.skyboxBlur);
  environmentVisibleCheckbox.checked = settings.environmentVisible;
  backgroundColorInput.value = settings.backgroundColor;
  exposureValue.value = formatSettingValue(settings.exposure);
  contrastValue.value = formatSettingValue(settings.contrast);
  environmentIntensityValue.value = formatSettingValue(settings.environmentIntensity);
  environmentRotationValue.value = formatSettingValue(settings.environmentRotation);
  skyboxBlurValue.value = formatSettingValue(settings.skyboxBlur);
  exposureValue.textContent = formatSettingValue(settings.exposure);
  contrastValue.textContent = formatSettingValue(settings.contrast);
  environmentIntensityValue.textContent = formatSettingValue(settings.environmentIntensity);
  environmentRotationValue.textContent = formatSettingValue(settings.environmentRotation);
  skyboxBlurValue.textContent = formatSettingValue(settings.skyboxBlur);
}

function updateViewSetting(partialSettings) {
  const nextSettings = normalizeViewSettings({
    ...readViewSettings(),
    ...partialSettings
  });

  writeViewSettings(nextSettings);
  applyViewSettings(nextSettings);
  syncViewSettingsForm(nextSettings);
}

function updateCameraSettings(partialSettings) {
  const currentSettings = readCameraSettings();
  const nextSettings = {
    autoRotate:
      typeof partialSettings.autoRotate === "boolean" ? partialSettings.autoRotate : currentSettings.autoRotate,
    autoRotateSpeed: Number.isFinite(partialSettings.autoRotateSpeed)
      ? partialSettings.autoRotateSpeed
      : currentSettings.autoRotateSpeed,
    autoRotateDelay: Number.isFinite(partialSettings.autoRotateDelay)
      ? partialSettings.autoRotateDelay
      : currentSettings.autoRotateDelay
  };

  writeCameraSettings(nextSettings);
  applyCameraSettings(nextSettings);
  syncCameraSettingsForm(nextSettings);
}

function setPanelVisible(panelId, isVisible) {
  const panel = document.getElementById(panelId);
  if (!panel) {
    return;
  }

  panel.classList.toggle("hidden", !isVisible);
}

function togglePanel(panelId, otherPanelIds = []) {
  const panel = document.getElementById(panelId);
  if (!panel) {
    return;
  }

  const shouldShow = panel.classList.contains("hidden");
  for (const otherPanelId of otherPanelIds) {
    setPanelVisible(otherPanelId, false);
  }

  setPanelVisible(panelId, shouldShow);
}

function attachViewSettingsControls() {
  const toneMappingSelect = document.getElementById("tone-mapping-select");
  const exposureRange = document.getElementById("exposure-range");
  const contrastRange = document.getElementById("contrast-range");
  const environmentIntensityRange = document.getElementById("environment-intensity-range");
  const environmentRotationRange = document.getElementById("environment-rotation-range");
  const skyboxBlurRange = document.getElementById("skybox-blur-range");
  const environmentVisibleCheckbox = document.getElementById("environment-visible-checkbox");
  const backgroundColorInput = document.getElementById("background-color-input");
  const closeSettingsButton = document.getElementById("close-settings-button");
  const resetViewSettingsButton = document.getElementById("reset-view-settings-button");

  toneMappingSelect.addEventListener("change", () => {
    updateViewSetting({ toneMapping: toneMappingSelect.value });
  });

  exposureRange.addEventListener("input", () => {
    updateViewSetting({ exposure: Number(exposureRange.value) });
  });

  contrastRange.addEventListener("input", () => {
    updateViewSetting({ contrast: Number(contrastRange.value) });
  });

  environmentIntensityRange.addEventListener("input", () => {
    updateViewSetting({ environmentIntensity: Number(environmentIntensityRange.value) });
  });

  environmentRotationRange.addEventListener("input", () => {
    updateViewSetting({ environmentRotation: Number(environmentRotationRange.value) });
  });

  skyboxBlurRange.addEventListener("input", () => {
    updateViewSetting({ skyboxBlur: Number(skyboxBlurRange.value) });
  });

  environmentVisibleCheckbox.addEventListener("change", () => {
    updateViewSetting({ environmentVisible: environmentVisibleCheckbox.checked });
  });

  backgroundColorInput.addEventListener("input", () => {
    updateViewSetting({ backgroundColor: backgroundColorInput.value });
  });

  closeSettingsButton.addEventListener("click", () => {
    setPanelVisible("settings-panel", false);
  });

  resetViewSettingsButton.addEventListener("click", () => {
    writeViewSettings({ ...DEFAULT_VIEW_SETTINGS });
    applyViewSettings(DEFAULT_VIEW_SETTINGS);
    syncViewSettingsForm(DEFAULT_VIEW_SETTINGS);
  });

  const initialSettings = readViewSettings();
  applyViewSettings(initialSettings);
  syncViewSettingsForm(initialSettings);
}

function syncCameraSettingsForm(settings) {
  const autoRotateCheckbox = document.getElementById("camera-auto-rotate-checkbox");
  const autoRotateSpeedRange = document.getElementById("camera-auto-rotate-speed-range");
  const autoRotateDelayRange = document.getElementById("camera-auto-rotate-delay-range");
  const autoRotateSpeedValue = document.getElementById("camera-auto-rotate-speed-value");
  const autoRotateDelayValue = document.getElementById("camera-auto-rotate-delay-value");

  autoRotateCheckbox.checked = settings.autoRotate;
  autoRotateSpeedRange.value = String(settings.autoRotateSpeed);
  autoRotateDelayRange.value = String(settings.autoRotateDelay);
  autoRotateSpeedValue.value = formatSettingValue(settings.autoRotateSpeed);
  autoRotateDelayValue.value = `${Math.round(settings.autoRotateDelay)} ms`;
  autoRotateSpeedValue.textContent = formatSettingValue(settings.autoRotateSpeed);
  autoRotateDelayValue.textContent = `${Math.round(settings.autoRotateDelay)} ms`;
}

function attachCameraSettingsControls() {
  const autoRotateCheckbox = document.getElementById("camera-auto-rotate-checkbox");
  const autoRotateSpeedRange = document.getElementById("camera-auto-rotate-speed-range");
  const autoRotateDelayRange = document.getElementById("camera-auto-rotate-delay-range");
  const closeCameraSettingsButton = document.getElementById("close-camera-settings-button");
  const resetCameraSettingsButton = document.getElementById("reset-camera-settings-button");

  autoRotateCheckbox.addEventListener("change", () => {
    updateCameraSettings({ autoRotate: autoRotateCheckbox.checked });
  });

  autoRotateSpeedRange.addEventListener("input", () => {
    updateCameraSettings({ autoRotateSpeed: Number(autoRotateSpeedRange.value) });
  });

  autoRotateDelayRange.addEventListener("input", () => {
    updateCameraSettings({ autoRotateDelay: Number(autoRotateDelayRange.value) });
  });

  closeCameraSettingsButton.addEventListener("click", () => {
    setPanelVisible("camera-settings-panel", false);
  });

  resetCameraSettingsButton.addEventListener("click", () => {
    writeCameraSettings({ ...DEFAULT_CAMERA_SETTINGS });
    applyCameraSettings(DEFAULT_CAMERA_SETTINGS);
    syncCameraSettingsForm(DEFAULT_CAMERA_SETTINGS);
  });

  const initialSettings = readCameraSettings();
  applyCameraSettings(initialSettings);
  syncCameraSettingsForm(initialSettings);
}

function attachHelpPanelControls() {
  const closeHelpPanelButton = document.getElementById("close-help-panel-button");
  if (!closeHelpPanelButton) {
    return;
  }

  closeHelpPanelButton.addEventListener("click", () => {
    setPanelVisible("help-panel", false);
  });
}

async function hydrateAboutPanel() {
  const nameElement = document.getElementById("about-app-name");
  const versionElement = document.getElementById("about-app-version");
  const descriptionElement = document.getElementById("about-app-description");

  if (!nameElement || !versionElement || !descriptionElement) {
    return;
  }

  try {
    const appInfo = await window.desktopViewer.getAppInfo();
    nameElement.textContent = appInfo?.name || "BabylonPress 3D Viewer";
    versionElement.textContent = `Version ${appInfo?.version || "1.0.0"}`;
    descriptionElement.textContent =
      appInfo?.description || "Desktop GLB viewer powered by Babylon Viewer and Electron.";
  } catch (_error) {
    versionElement.textContent = "Version";
  }
}

function attachAboutPanelControls() {
  const closeAboutPanelButton = document.getElementById("close-about-panel-button");
  if (!closeAboutPanelButton) {
    return;
  }

  closeAboutPanelButton.addEventListener("click", () => {
    setPanelVisible("about-panel", false);
  });

  const aboutPanel = document.getElementById("about-panel");
  aboutPanel?.addEventListener("click", async (event) => {
    const targetLink = event.target.closest("a[href]");
    if (!targetLink) {
      return;
    }

    event.preventDefault();
    await window.desktopViewer.openExternalUrl(targetLink.href);
  });
}

attachViewSettingsControls();
attachCameraSettingsControls();
attachHelpPanelControls();
attachAboutPanelControls();
hydrateAboutPanel();

window.desktopViewer.onToggleViewSettings(() => {
  togglePanel("settings-panel", ["camera-settings-panel", "help-panel", "about-panel"]);
});

window.desktopViewer.onToggleCameraSettings(() => {
  togglePanel("camera-settings-panel", ["settings-panel", "help-panel", "about-panel"]);
});

window.desktopViewer.onToggleHelpPanel(() => {
  togglePanel("help-panel", ["settings-panel", "camera-settings-panel", "about-panel"]);
});

window.desktopViewer.onToggleAboutPanel(() => {
  togglePanel("about-panel", ["settings-panel", "camera-settings-panel", "help-panel"]);
});

function isGlbFile(file) {
  return Boolean(file?.name && file.name.toLowerCase().endsWith(".glb"));
}

let dragDepth = 0;

function setDragState(isActive) {
  document.body.classList.toggle("drag-over", isActive);
}

window.addEventListener("dragenter", (event) => {
  event.preventDefault();
  dragDepth += 1;
  setDragState(true);
});

window.addEventListener("dragover", (event) => {
  event.preventDefault();
  setDragState(true);
});

window.addEventListener("dragleave", (event) => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) {
    setDragState(false);
  }
});

window.addEventListener("drop", async (event) => {
  event.preventDefault();
  dragDepth = 0;
  setDragState(false);

  const [file] = Array.from(event.dataTransfer?.files || []);
  if (!isGlbFile(file)) {
    setStatusMessage("Only .glb files can be dropped into the viewer.");
    return;
  }

  setStatusMessage("");
  await window.desktopViewer.rememberFile(file.path);
  loadModel(file.path);
});

window.addEventListener("keydown", async (event) => {
  const isOpenShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey;
  if (isOpenShortcut && event.key.toLowerCase() === "o") {
    event.preventDefault();
    const filePath = await window.desktopViewer.openDialog();
    if (filePath) {
      loadModel(filePath);
    }
  }

  if (event.key === "Escape") {
    setPanelVisible("settings-panel", false);
    setPanelVisible("camera-settings-panel", false);
    setPanelVisible("help-panel", false);
    setPanelVisible("about-panel", false);
  }
});
