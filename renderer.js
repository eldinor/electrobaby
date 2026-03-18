function toFileUrl(windowsPath) {
  const normalized = windowsPath.replace(/\\/g, "/");
  return encodeURI(`file:///${normalized}`);
}

const DEFAULT_ENVIRONMENT_SOURCE = "auto";
const FALLBACK_APP_CONFIG = {
  productName: "BabylonPress GLB GLTF Viewer",
  description: "Desktop GLB/GLTF viewer powered by Babylon Viewer and Electron.",
  links: {
    website: "https://babylonpress.org/",
    source: "https://example.com/source"
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
  copy: {
    emptyState: {
      title: "Drop a GLB or GLTF file to begin",
      bodyHtml:
        'Drag a <kbd>.glb</kbd> or <kbd>.gltf</kbd> file into this window <br>or use <kbd>File -> Open...</kbd> to load a model'
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
      cards: [],
      sections: []
    },
    about: {
      title: "About",
      closeLabel: "Close",
      createdByLabel: "Created by BabylonPress.org",
      sourceLabel: "Source",
      meta: []
    }
  }
};
let APP_CONFIG = FALLBACK_APP_CONFIG;

function getDefaultViewSettings() {
  return APP_CONFIG.defaults?.viewSettings || FALLBACK_APP_CONFIG.defaults.viewSettings;
}

function getDefaultCameraSettings() {
  return APP_CONFIG.defaults?.cameraSettings || FALLBACK_APP_CONFIG.defaults.cameraSettings;
}

let currentViewSettings = { ...getDefaultViewSettings() };
let currentCameraSettings = { ...getDefaultCameraSettings() };

function getFileName(filePath) {
  return filePath.split(/[/\\]/).pop() || "Viewer";
}

function getViewer() {
  return document.getElementById("viewer");
}

function getSupportedModelExtensions() {
  return Array.isArray(APP_CONFIG.files?.modelExtensions) && APP_CONFIG.files.modelExtensions.length
    ? APP_CONFIG.files.modelExtensions.map((extension) => String(extension).toLowerCase())
    : ["glb", "gltf"];
}

function isSupportedModelFileName(fileName) {
  const normalizedName = String(fileName || "").toLowerCase();
  return getSupportedModelExtensions().some((extension) => normalizedName.endsWith(`.${extension}`));
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

function renderEmptyStateCopy() {
  const titleElement = document.getElementById("empty-state-title");
  const bodyElement = document.getElementById("empty-state-body");
  const emptyStateCopy = APP_CONFIG.copy?.emptyState;

  if (!titleElement || !bodyElement || !emptyStateCopy) {
    return;
  }

  titleElement.textContent = emptyStateCopy.title;
  bodyElement.innerHTML = emptyStateCopy.bodyHtml;
}

function renderSettingsPanelCopy() {
  const viewPanelCopy = APP_CONFIG.copy?.viewPanel;
  const cameraPanelCopy = APP_CONFIG.copy?.cameraPanel;
  const aboutCopy = APP_CONFIG.copy?.about;
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element && typeof value === "string") {
      element.textContent = value;
    }
  };

  if (viewPanelCopy) {
    setText("view-panel-title", viewPanelCopy.title);
    setText("close-settings-button", viewPanelCopy.closeLabel);
    setText("reset-view-settings-button", viewPanelCopy.resetLabel);
    setText("tone-mapping-label", viewPanelCopy.fields?.toneMapping);
    setText("tone-mapping-option-standard", viewPanelCopy.fields?.toneMappingOptions?.standard);
    setText("tone-mapping-option-aces", viewPanelCopy.fields?.toneMappingOptions?.aces);
    setText("tone-mapping-option-neutral", viewPanelCopy.fields?.toneMappingOptions?.neutral);
    setText("tone-mapping-option-none", viewPanelCopy.fields?.toneMappingOptions?.none);
    setText("exposure-label", viewPanelCopy.fields?.exposure);
    setText("contrast-label", viewPanelCopy.fields?.contrast);
    setText("environment-intensity-label", viewPanelCopy.fields?.environmentIntensity);
    setText("environment-rotation-label", viewPanelCopy.fields?.environmentRotation);
    setText("skybox-blur-label", viewPanelCopy.fields?.skyboxBlur);
    setText("environment-visible-label", viewPanelCopy.fields?.environmentVisible);
    setText("background-color-label", viewPanelCopy.fields?.backgroundColor);
  }

  if (cameraPanelCopy) {
    setText("camera-panel-title", cameraPanelCopy.title);
    setText("close-camera-settings-button", cameraPanelCopy.closeLabel);
    setText("reset-camera-settings-button", cameraPanelCopy.resetLabel);
    setText("camera-auto-rotate-label", cameraPanelCopy.fields?.autoRotate);
    setText("camera-auto-rotate-speed-label", cameraPanelCopy.fields?.autoRotateSpeed);
    setText("camera-auto-rotate-delay-label", cameraPanelCopy.fields?.autoRotateDelay);
  }

  if (aboutCopy) {
    setText("close-about-panel-button", aboutCopy.closeLabel);
  }
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
  document.title = `Babylon Viewer - ${getFileName(filePath)}`;
  setEmptyStateVisible(false);
}

if (window.desktopViewer?.onOpenModel) {
  window.desktopViewer.onOpenModel((filePath) => {
    loadModel(filePath);
  });
}

function getErrorMessage(errorLike) {
  const rawMessage =
    typeof errorLike?.message === "string"
      ? errorLike.message
      : typeof errorLike === "string"
        ? errorLike
        : typeof errorLike?.detail?.message === "string"
          ? errorLike.detail.message
          : "";
  const normalizedMessage = rawMessage.trim();
  const lowerMessage = normalizedMessage.toLowerCase();

  if (!lowerMessage) {
    return "The model could not be loaded. Check whether the file is a valid .glb or .gltf model.";
  }

  if (
    lowerMessage.includes("404") ||
    lowerMessage.includes("not found") ||
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("networkerror") ||
    lowerMessage.includes("network error")
  ) {
    return "The model could not be loaded because a required file was not found. For .gltf files, keep the .gltf, .bin, and texture files together in the same folder.";
  }

  if (
    lowerMessage.includes("unexpected token") ||
    lowerMessage.includes("json") ||
    lowerMessage.includes("parse")
  ) {
    return `The GLTF file appears to be invalid or malformed. ${normalizedMessage}`;
  }

  if (
    lowerMessage.includes("magic") ||
    lowerMessage.includes("glb") ||
    lowerMessage.includes("binary") ||
    lowerMessage.includes("chunk")
  ) {
    return `The GLB file appears to be invalid or corrupted. ${normalizedMessage}`;
  }

  return `${normalizedMessage} Check whether the file is a valid .glb or .gltf model.`;
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
  const defaultViewSettings = getDefaultViewSettings();

  return {
    toneMapping: typeof rawSettings?.toneMapping === "string" ? rawSettings.toneMapping : defaultViewSettings.toneMapping,
    exposure: Number.isFinite(rawSettings?.exposure) ? rawSettings.exposure : defaultViewSettings.exposure,
    contrast: Number.isFinite(rawSettings?.contrast) ? rawSettings.contrast : defaultViewSettings.contrast,
    environmentIntensity: Number.isFinite(rawSettings?.environmentIntensity)
      ? rawSettings.environmentIntensity
      : defaultViewSettings.environmentIntensity,
    environmentRotation: Number.isFinite(rawSettings?.environmentRotation)
      ? rawSettings.environmentRotation
      : defaultViewSettings.environmentRotation,
    skyboxBlur: Number.isFinite(rawSettings?.skyboxBlur) ? rawSettings.skyboxBlur : defaultViewSettings.skyboxBlur,
    environmentVisible:
      typeof rawSettings?.environmentVisible === "boolean"
        ? rawSettings.environmentVisible
        : defaultViewSettings.environmentVisible,
    backgroundColor:
      typeof rawSettings?.backgroundColor === "string" && /^#[0-9a-fA-F]{6}$/.test(rawSettings.backgroundColor)
        ? rawSettings.backgroundColor
        : defaultViewSettings.backgroundColor
  };
}

function readViewSettings() {
  return { ...currentViewSettings };
}

async function writeViewSettings(settings) {
  if (!window.desktopViewer?.setViewSettings) {
    currentViewSettings = normalizeViewSettings(settings);
    return { ...currentViewSettings };
  }

  currentViewSettings = normalizeViewSettings(await window.desktopViewer.setViewSettings(settings));
  return { ...currentViewSettings };
}

function readCameraSettings() {
  return { ...currentCameraSettings };
}

async function writeCameraSettings(settings) {
  if (!window.desktopViewer?.setCameraSettings) {
    currentCameraSettings = normalizeCameraSettings(settings);
    return { ...currentCameraSettings };
  }

  currentCameraSettings = normalizeCameraSettings(await window.desktopViewer.setCameraSettings(settings));
  return { ...currentCameraSettings };
}

function normalizeCameraSettings(rawSettings) {
  const defaultCameraSettings = getDefaultCameraSettings();

  return {
    autoRotate: typeof rawSettings?.autoRotate === "boolean" ? rawSettings.autoRotate : defaultCameraSettings.autoRotate,
    autoRotateSpeed: Number.isFinite(rawSettings?.autoRotateSpeed)
      ? rawSettings.autoRotateSpeed
      : defaultCameraSettings.autoRotateSpeed,
    autoRotateDelay: Number.isFinite(rawSettings?.autoRotateDelay)
      ? rawSettings.autoRotateDelay
      : defaultCameraSettings.autoRotateDelay
  };
}

function formatSettingValue(value) {
  return Number(value).toFixed(2);
}

function applyViewSettings(settings) {
  const viewer = getViewer();
  if (!viewer) {
    return;
  }

  viewer.environmentLighting = DEFAULT_ENVIRONMENT_SOURCE;
  viewer.environmentSkybox = settings.environmentVisible ? DEFAULT_ENVIRONMENT_SOURCE : null;

  viewer.toneMapping = settings.toneMapping;
  viewer.exposure = settings.exposure;
  viewer.contrast = settings.contrast;
  viewer.environmentIntensity = settings.environmentIntensity;
  viewer.environmentRotation = settings.environmentRotation;
  viewer.skyboxBlur = settings.skyboxBlur;
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

async function updateViewSetting(partialSettings) {
  const nextSettings = normalizeViewSettings({
    ...readViewSettings(),
    ...partialSettings
  });

  await writeViewSettings(nextSettings);
  applyViewSettings(nextSettings);
  syncViewSettingsForm(nextSettings);
}

async function updateCameraSettings(partialSettings) {
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

  await writeCameraSettings(nextSettings);
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

  toneMappingSelect.addEventListener("change", async () => {
    await updateViewSetting({ toneMapping: toneMappingSelect.value });
  });

  exposureRange.addEventListener("input", async () => {
    await updateViewSetting({ exposure: Number(exposureRange.value) });
  });

  contrastRange.addEventListener("input", async () => {
    await updateViewSetting({ contrast: Number(contrastRange.value) });
  });

  environmentIntensityRange.addEventListener("input", async () => {
    await updateViewSetting({ environmentIntensity: Number(environmentIntensityRange.value) });
  });

  environmentRotationRange.addEventListener("input", async () => {
    await updateViewSetting({ environmentRotation: Number(environmentRotationRange.value) });
  });

  skyboxBlurRange.addEventListener("input", async () => {
    await updateViewSetting({ skyboxBlur: Number(skyboxBlurRange.value) });
  });

  environmentVisibleCheckbox.addEventListener("change", async () => {
    await updateViewSetting({ environmentVisible: environmentVisibleCheckbox.checked });
  });

  backgroundColorInput.addEventListener("input", async () => {
    await updateViewSetting({ backgroundColor: backgroundColorInput.value });
  });

  closeSettingsButton.addEventListener("click", () => {
    setPanelVisible("settings-panel", false);
  });

  resetViewSettingsButton.addEventListener("click", async () => {
    const defaultViewSettings = { ...getDefaultViewSettings() };
    await writeViewSettings(defaultViewSettings);
    applyViewSettings(defaultViewSettings);
    syncViewSettingsForm(defaultViewSettings);
  });
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

  autoRotateCheckbox.addEventListener("change", async () => {
    await updateCameraSettings({ autoRotate: autoRotateCheckbox.checked });
  });

  autoRotateSpeedRange.addEventListener("input", async () => {
    await updateCameraSettings({ autoRotateSpeed: Number(autoRotateSpeedRange.value) });
  });

  autoRotateDelayRange.addEventListener("input", async () => {
    await updateCameraSettings({ autoRotateDelay: Number(autoRotateDelayRange.value) });
  });

  closeCameraSettingsButton.addEventListener("click", () => {
    setPanelVisible("camera-settings-panel", false);
  });

  resetCameraSettingsButton.addEventListener("click", async () => {
    const defaultCameraSettings = { ...getDefaultCameraSettings() };
    await writeCameraSettings(defaultCameraSettings);
    applyCameraSettings(defaultCameraSettings);
    syncCameraSettingsForm(defaultCameraSettings);
  });
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

function renderHelpPanel() {
  const titleElement = document.getElementById("help-panel-title");
  const contentElement = document.getElementById("help-panel-content");
  const helpCopy = APP_CONFIG.copy?.help;

  if (!titleElement || !contentElement || !helpCopy) {
    return;
  }

  titleElement.textContent = helpCopy.title;

  const cardsHtml = helpCopy.cards
    .map(
      (card) => `
        <section class="help-card">
          <h3>${card.title}</h3>
          ${card.bodyHtml}
        </section>
      `
    )
    .join("");

  const sectionsHtml = helpCopy.sections
    .map(
      (section) => `
        <section>
          <h3>${section.title}</h3>
          ${section.bodyHtml}
        </section>
      `
    )
    .join("");

  contentElement.innerHTML = `
    <div class="help-grid">${cardsHtml}</div>
    ${sectionsHtml}
  `;
}

async function hydrateAboutPanel() {
  const aboutTitleElement = document.getElementById("about-panel-title");
  const nameElement = document.getElementById("about-app-name");
  const versionElement = document.getElementById("about-app-version");
  const descriptionElement = document.getElementById("about-app-description");
  const primaryLinksElement = document.getElementById("about-primary-links");
  const secondaryLinksElement = document.getElementById("about-secondary-links");
  const metaElement = document.getElementById("about-meta");
  const aboutCopy = APP_CONFIG.copy?.about;

  if (!nameElement || !versionElement || !descriptionElement || !primaryLinksElement || !secondaryLinksElement || !metaElement) {
    return;
  }

  if (aboutTitleElement && aboutCopy?.title) {
    aboutTitleElement.textContent = aboutCopy.title;
  }

  if (aboutCopy) {
    primaryLinksElement.innerHTML = `
      <a href="${APP_CONFIG.links?.website || "#"}" target="_blank" rel="noreferrer">${aboutCopy.createdByLabel}</a>
    `;
    secondaryLinksElement.innerHTML = `
      <a href="${APP_CONFIG.links?.source || "#"}" target="_blank" rel="noreferrer">${aboutCopy.sourceLabel}</a>
    `;
    metaElement.innerHTML = aboutCopy.meta
      .map((item) => `<p><strong>${item.label}:</strong> ${item.value}</p>`)
      .join("");
  }

  try {
    const appInfo = window.desktopViewer?.getAppInfo ? await window.desktopViewer.getAppInfo() : null;
    nameElement.textContent = appInfo?.name || APP_CONFIG.productName || "BabylonPress GLB GLTF Viewer";
    versionElement.textContent = `Version ${appInfo?.version || "1.0.0"}`;
    descriptionElement.textContent =
      appInfo?.description || APP_CONFIG.description || "Desktop GLB/GLTF viewer powered by Babylon Viewer and Electron.";

    if (appInfo?.viewerVersion) {
      const viewerVersionHtml = `<p><strong>Babylon Viewer:</strong> ${appInfo.viewerVersion}</p>`;
      if (!metaElement.innerHTML.includes("Babylon Viewer:")) {
        metaElement.innerHTML += viewerVersionHtml;
      }
    }

    if (appInfo?.electronVersion) {
      const electronVersionHtml = `<p><strong>Electron:</strong> ${appInfo.electronVersion}</p>`;
      if (!metaElement.innerHTML.includes("Electron:")) {
        metaElement.innerHTML += electronVersionHtml;
      }
    }

    if (appInfo?.buildVersion) {
      const buildVersionHtml = `<p><strong>Build:</strong> ${appInfo.buildVersion}</p>`;
      if (!metaElement.innerHTML.includes("Build:")) {
        metaElement.innerHTML += buildVersionHtml;
      }
    }
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
    if (!targetLink || !window.desktopViewer?.openExternalUrl) {
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
renderEmptyStateCopy();
renderSettingsPanelCopy();
renderHelpPanel();
hydrateAboutPanel();

async function initializeSettings() {
  if (window.desktopViewer?.getAppConfig) {
    try {
      const remoteConfig = await window.desktopViewer.getAppConfig();
      if (remoteConfig && typeof remoteConfig === "object") {
        APP_CONFIG = {
          ...FALLBACK_APP_CONFIG,
          ...remoteConfig,
          links: {
            ...FALLBACK_APP_CONFIG.links,
            ...remoteConfig.links
          },
          defaults: {
            ...FALLBACK_APP_CONFIG.defaults,
            ...remoteConfig.defaults,
            viewSettings: {
              ...FALLBACK_APP_CONFIG.defaults.viewSettings,
              ...remoteConfig.defaults?.viewSettings
            },
            cameraSettings: {
              ...FALLBACK_APP_CONFIG.defaults.cameraSettings,
              ...remoteConfig.defaults?.cameraSettings
            }
          },
          copy: {
            ...FALLBACK_APP_CONFIG.copy,
            ...remoteConfig.copy,
            viewPanel: {
              ...FALLBACK_APP_CONFIG.copy.viewPanel,
              ...remoteConfig.copy?.viewPanel,
              fields: {
                ...FALLBACK_APP_CONFIG.copy.viewPanel.fields,
                ...remoteConfig.copy?.viewPanel?.fields,
                toneMappingOptions: {
                  ...FALLBACK_APP_CONFIG.copy.viewPanel.fields.toneMappingOptions,
                  ...remoteConfig.copy?.viewPanel?.fields?.toneMappingOptions
                }
              }
            },
            cameraPanel: {
              ...FALLBACK_APP_CONFIG.copy.cameraPanel,
              ...remoteConfig.copy?.cameraPanel,
              fields: {
                ...FALLBACK_APP_CONFIG.copy.cameraPanel.fields,
                ...remoteConfig.copy?.cameraPanel?.fields
              }
            },
            help: {
              ...FALLBACK_APP_CONFIG.copy.help,
              ...remoteConfig.copy?.help
            },
            about: {
              ...FALLBACK_APP_CONFIG.copy.about,
              ...remoteConfig.copy?.about
            }
          }
        };
      }
    } catch (_error) {
      APP_CONFIG = FALLBACK_APP_CONFIG;
    }
  }

  renderEmptyStateCopy();
  renderSettingsPanelCopy();
  renderHelpPanel();
  await hydrateAboutPanel();

  if (window.desktopViewer?.getViewSettings) {
    currentViewSettings = normalizeViewSettings(await window.desktopViewer.getViewSettings());
  } else {
    currentViewSettings = normalizeViewSettings(currentViewSettings);
  }

  if (window.desktopViewer?.getCameraSettings) {
    currentCameraSettings = normalizeCameraSettings(await window.desktopViewer.getCameraSettings());
  } else {
    currentCameraSettings = normalizeCameraSettings(currentCameraSettings);
  }

  applyViewSettings(currentViewSettings);
  syncViewSettingsForm(currentViewSettings);
  applyCameraSettings(currentCameraSettings);
  syncCameraSettingsForm(currentCameraSettings);
}

initializeSettings();

if (window.desktopViewer?.onToggleViewSettings) {
  window.desktopViewer.onToggleViewSettings(() => {
    togglePanel("settings-panel", ["camera-settings-panel", "help-panel", "about-panel"]);
  });
}

if (window.desktopViewer?.onToggleCameraSettings) {
  window.desktopViewer.onToggleCameraSettings(() => {
    togglePanel("camera-settings-panel", ["settings-panel", "help-panel", "about-panel"]);
  });
}

if (window.desktopViewer?.onToggleHelpPanel) {
  window.desktopViewer.onToggleHelpPanel(() => {
    togglePanel("help-panel", ["settings-panel", "camera-settings-panel", "about-panel"]);
  });
}

if (window.desktopViewer?.onToggleAboutPanel) {
  window.desktopViewer.onToggleAboutPanel(() => {
    togglePanel("about-panel", ["settings-panel", "camera-settings-panel", "help-panel"]);
  });
}

function isSupportedModelFile(file) {
  return Boolean(file?.name && isSupportedModelFileName(file.name));
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
  if (!isSupportedModelFile(file)) {
    setStatusMessage("Only .glb and .gltf files can be dropped into the viewer.");
    return;
  }

  const filePath = window.desktopViewer?.getPathForFile ? window.desktopViewer.getPathForFile(file) : file?.path;
  if (!filePath) {
    setStatusMessage("The dropped file could not be opened.");
    return;
  }

  setStatusMessage("");
  if (window.desktopViewer?.rememberFile) {
    await window.desktopViewer.rememberFile(filePath);
  }
  loadModel(filePath);
});

window.addEventListener("keydown", async (event) => {
  const isOpenShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey;
  if (isOpenShortcut && event.key.toLowerCase() === "o") {
    event.preventDefault();
    const filePath = window.desktopViewer?.openDialog ? await window.desktopViewer.openDialog() : null;
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
