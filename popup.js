// BuzzBro Popup Script
// Handles popup interactions and settings

document.addEventListener("DOMContentLoaded", async function () {
  console.log("🚀 BuzzBro popup loaded");

  const statusIndicator = document.getElementById("statusIndicator");
  const statusDescription = document.getElementById("statusDescription");
  const toggleSwitch = document.getElementById("toggleSwitch");
  const settingsBtn = document.getElementById("settingsBtn");
  const helpBtn = document.getElementById("helpBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  let currentSettings = {};

  // Show loading initially
  showLoading(true);

  // Load initial status
  await loadExtensionStatus();

  // Hide loading after initial load
  showLoading(false);

  // Event listeners
  toggleSwitch.addEventListener("click", handleToggleClick);
  settingsBtn.addEventListener("click", openSettings);
  helpBtn.addEventListener("click", showHelp);

  async function loadExtensionStatus() {
    try {
      // Get stored settings
      const result = await chrome.storage.sync.get([
        "enabled",
        "apiKey",
        "customPrompt",
      ]);

      currentSettings = {
        enabled: result.enabled !== false, // Default to true if not set
        apiKey: result.apiKey || "",
        customPrompt: result.customPrompt || "",
      };

      console.log("📊 Current settings:", currentSettings);

      // Update UI based on status
      updateStatusUI(currentSettings.enabled, currentSettings.apiKey);
    } catch (error) {
      console.error("❌ Error loading extension status:", error);
      showNotification("Failed to load extension status", "error");
      updateStatusUI(false, "");
    }
  }

  function updateStatusUI(enabled, hasApiKey) {
    // Update indicator
    statusIndicator.className = `status-indicator ${
      enabled ? "active" : "inactive"
    }`;

    // Update toggle
    toggleSwitch.className = `toggle-switch ${enabled ? "active" : ""}`;

    // Update description based on status
    if (!enabled) {
      statusDescription.textContent =
        "Extension is disabled. Click the toggle to enable.";
    } else if (!hasApiKey) {
      statusDescription.textContent =
        "Extension is enabled but API key is missing. Click Settings to configure.";
      statusDescription.innerHTML = `
        Extension is enabled but API key is missing.
        <span style="color: rgba(59, 130, 246, 1); cursor: pointer;" onclick="openSettings()">Click Settings to configure.</span>
      `;
    } else {
      statusDescription.textContent =
        "Extension is active and ready to generate replies!";
    }

    // Update settings button style if API key is missing
    if (enabled && !hasApiKey) {
      settingsBtn.style.background = "rgba(245, 158, 11, 0.15)";
      settingsBtn.style.borderColor = "rgba(245, 158, 11, 0.3)";
      settingsBtn.style.color = "rgba(245, 158, 11, 1)";
    } else {
      settingsBtn.style.background = "";
      settingsBtn.style.borderColor = "";
      settingsBtn.style.color = "";
    }
  }

  async function handleToggleClick() {
    try {
      showLoading(true);

      const newEnabled = !currentSettings.enabled;

      // Save to storage
      await chrome.storage.sync.set({ enabled: newEnabled });

      // Update current settings
      currentSettings.enabled = newEnabled;

      // Send message to background script
      try {
        await chrome.runtime.sendMessage({
          action: "toggleEnabled",
          enabled: newEnabled,
        });
      } catch (error) {
        console.log("Background script not responding, continuing...");
      }

      // Update UI
      updateStatusUI(newEnabled, currentSettings.apiKey);

      // Show notification
      showNotification(
        `Extension ${newEnabled ? "enabled" : "disabled"} successfully!`,
        "success"
      );

      console.log("✅ Extension toggled:", newEnabled);
    } catch (error) {
      console.error("❌ Error toggling extension:", error);
      showNotification("Failed to toggle extension", "error");
    } finally {
      showLoading(false);
    }
  }

  function openSettings() {
    try {
      // Try to open options page
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        // Fallback for older browsers
        chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
      }

      // Close popup
      window.close();
    } catch (error) {
      console.error("❌ Error opening settings:", error);
      showNotification("Failed to open settings", "error");
    }
  }

  function showHelp() {
    const helpContent = `
      <div style="padding: 20px; max-width: 300px;">
        <h3 style="margin-bottom: 16px; color: rgba(255, 255, 255, 0.9);">🚀 BuzzBro Help</h3>

        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Quick Start:</h4>
          <ol style="margin-left: 16px; color: rgba(255, 255, 255, 0.6); font-size: 13px; line-height: 1.4;">
            <li>Get a free Gemini API key from Google AI Studio</li>
            <li>Enter it in Settings</li>
            <li>Enable the extension</li>
            <li>Visit Twitter/X and start replying!</li>
          </ol>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Features:</h4>
          <ul style="margin-left: 16px; color: rgba(255, 255, 255, 0.6); font-size: 13px; line-height: 1.4;">
            <li>AI-generated contextual replies</li>
            <li>Custom prompt templates</li>
            <li>One-click copy to clipboard</li>
            <li>Works on all Twitter/X pages</li>
          </ul>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Troubleshooting:</h4>
          <ul style="margin-left: 16px; color: rgba(255, 255, 255, 0.6); font-size: 13px; line-height: 1.4;">
            <li>Refresh the page if button doesn't appear</li>
            <li>Check API key in Settings if generation fails</li>
            <li>Make sure extension is enabled</li>
          </ul>
        </div>
      </div>
    `;

    // Create help popup
    const helpPopup = document.createElement("div");
    helpPopup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const helpModal = document.createElement("div");
    helpModal.style.cssText = `
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transform: scale(0.9);
      transition: transform 0.3s ease;
      max-height: 400px;
      overflow-y: auto;
    `;

    helpModal.innerHTML = helpContent;
    helpPopup.appendChild(helpModal);
    document.body.appendChild(helpPopup);

    // Animate in
    requestAnimationFrame(() => {
      helpPopup.style.opacity = "1";
      helpModal.style.transform = "scale(1)";
    });

    // Close on click outside
    helpPopup.addEventListener("click", (e) => {
      if (e.target === helpPopup) {
        helpPopup.style.opacity = "0";
        helpModal.style.transform = "scale(0.9)";
        setTimeout(() => helpPopup.remove(), 300);
      }
    });

    // Auto close after 10 seconds
    setTimeout(() => {
      if (helpPopup.parentNode) {
        helpPopup.style.opacity = "0";
        helpModal.style.transform = "scale(0.9)";
        setTimeout(() => helpPopup.remove(), 300);
      }
    }, 10000);
  }

  function showLoading(show) {
    if (show) {
      loadingOverlay.classList.add("active");
    } else {
      loadingOverlay.classList.remove("active");
    }
  }

  function showNotification(message, type = "success") {
    notificationText.textContent = message;

    // Update notification style based on type
    if (type === "error") {
      notification.classList.add("error");
    } else {
      notification.classList.remove("error");
    }

    // Show notification
    notification.classList.add("show");

    // Auto hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync") {
      console.log("📊 Storage changed:", changes);

      // Update current settings
      if (changes.enabled) {
        currentSettings.enabled = changes.enabled.newValue;
      }
      if (changes.apiKey) {
        currentSettings.apiKey = changes.apiKey.newValue;
      }
      if (changes.customPrompt) {
        currentSettings.customPrompt = changes.customPrompt.newValue;
      }

      // Update UI
      updateStatusUI(currentSettings.enabled, currentSettings.apiKey);
    }
  });

  // Make openSettings available globally for inline onclick
  window.openSettings = openSettings;
});
