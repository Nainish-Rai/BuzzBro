document.addEventListener("DOMContentLoaded", async function () {
  console.log("🚀 BuzzBro options page loaded");

  const enabledToggle = document.getElementById("enabledToggle");
  const apiKeyInput = document.getElementById("apiKey");
  const customPromptInput = document.getElementById("customPrompt");
  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const toggleApiKeyBtn = document.getElementById("toggleApiKey");
  const apiKeyStatus = document.getElementById("apiKeyStatus");
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  let hasUnsavedChanges = false;

  // Load existing settings
  await loadSettings();

  // Set up event listeners
  enabledToggle.addEventListener("change", markAsChanged);
  apiKeyInput.addEventListener("input", handleApiKeyChange);
  customPromptInput.addEventListener("input", markAsChanged);
  saveBtn.addEventListener("click", saveSettings);
  resetBtn.addEventListener("click", resetSettings);
  toggleApiKeyBtn.addEventListener("click", toggleApiKeyVisibility);

  // Auto-save on input (debounced)
  let saveTimeout;
  [enabledToggle, apiKeyInput, customPromptInput].forEach((input) => {
    input.addEventListener("input", () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(autoSave, 2000); // Auto-save after 2 seconds of inactivity
    });
  });

  // Warn about unsaved changes
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
    }
  });

  async function loadSettings() {
    try {
      showLoading(true);

      const result = await chrome.storage.sync.get([
        "enabled",
        "apiKey",
        "customPrompt",
      ]);

      // Set form values
      enabledToggle.checked = result.enabled !== false; // Default to true
      apiKeyInput.value = result.apiKey || "";
      customPromptInput.value = result.customPrompt || "";

      // Update API key status
      updateApiKeyStatus(result.apiKey);

      hasUnsavedChanges = false;
      updateSaveButtonState();

      console.log("✅ Settings loaded successfully");
    } catch (error) {
      console.error("❌ Error loading settings:", error);
      showNotification("Failed to load settings", "error");
    } finally {
      showLoading(false);
    }
  }

  async function saveSettings() {
    try {
      showLoading(true);

      const settings = {
        enabled: enabledToggle.checked,
        apiKey: apiKeyInput.value.trim(),
        customPrompt: customPromptInput.value.trim(),
      };

      // Validate API key if provided
      if (settings.apiKey && !isValidApiKey(settings.apiKey)) {
        throw new Error(
          "Invalid API key format. Please check your Gemini API key."
        );
      }

      // Save to storage
      await chrome.storage.sync.set(settings);

      // Update API key status
      updateApiKeyStatus(settings.apiKey);

      hasUnsavedChanges = false;
      updateSaveButtonState();

      // Send message to background script
      try {
        await chrome.runtime.sendMessage({
          action: "settingsUpdated",
          settings: settings,
        });
      } catch (error) {
        console.log("Background script not responding, continuing...");
      }

      showNotification("Settings saved successfully!", "success");
      console.log("✅ Settings saved:", settings);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      showNotification(error.message || "Failed to save settings", "error");
    } finally {
      showLoading(false);
    }
  }

  async function autoSave() {
    if (hasUnsavedChanges) {
      try {
        await saveSettings();
        console.log("🔄 Auto-saved settings");
      } catch (error) {
        console.log("Auto-save failed, will retry on manual save");
      }
    }
  }

  async function resetSettings() {
    if (
      confirm(
        "Are you sure you want to reset all settings to defaults? This action cannot be undone."
      )
    ) {
      try {
        showLoading(true);

        // Clear storage
        await chrome.storage.sync.clear();

        // Reset form to defaults
        enabledToggle.checked = true;
        apiKeyInput.value = "";
        customPromptInput.value = "";

        // Update status
        updateApiKeyStatus("");
        hasUnsavedChanges = false;
        updateSaveButtonState();

        showNotification("Settings reset to defaults", "success");
        console.log("🔄 Settings reset to defaults");
      } catch (error) {
        console.error("❌ Error resetting settings:", error);
        showNotification("Failed to reset settings", "error");
      } finally {
        showLoading(false);
      }
    }
  }

  function toggleApiKeyVisibility() {
    const isPassword = apiKeyInput.type === "password";

    if (isPassword) {
      apiKeyInput.type = "text";
      toggleApiKeyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      `;
    } else {
      apiKeyInput.type = "password";
      toggleApiKeyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
    }
  }

  function handleApiKeyChange() {
    markAsChanged();

    const apiKey = apiKeyInput.value.trim();
    updateApiKeyStatus(apiKey);

    // Validate in real-time
    if (apiKey && !isValidApiKey(apiKey)) {
      apiKeyInput.style.borderColor = "rgba(220, 38, 38, 0.5)";
      apiKeyInput.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.1)";
    } else {
      apiKeyInput.style.borderColor = "";
      apiKeyInput.style.boxShadow = "";
    }
  }

  function updateApiKeyStatus(apiKey) {
    if (!apiKey) {
      apiKeyStatus.style.display = "none";
      return;
    }

    apiKeyStatus.style.display = "inline-flex";

    if (isValidApiKey(apiKey)) {
      apiKeyStatus.className = "status-indicator success";
      apiKeyStatus.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Valid
      `;
    } else {
      apiKeyStatus.className = "status-indicator error";
      apiKeyStatus.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Invalid
      `;
    }
  }

  function isValidApiKey(apiKey) {
    // Basic validation for Gemini API key format
    return apiKey && apiKey.length > 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
  }

  function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveButtonState();
  }

  function updateSaveButtonState() {
    if (hasUnsavedChanges) {
      saveBtn.style.background = "rgba(245, 158, 11, 0.15)";
      saveBtn.style.borderColor = "rgba(245, 158, 11, 0.3)";
      saveBtn.style.color = "rgba(245, 158, 11, 1)";
      saveBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        Save Changes
      `;
    } else {
      saveBtn.style.background = "";
      saveBtn.style.borderColor = "";
      saveBtn.style.color = "";
      saveBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17,21 17,13 7,13 7,21"/>
          <polyline points="7,3 7,8 15,8"/>
        </svg>
        Save Settings
      `;
    }
  }

  function showLoading(show) {
    const container = document.querySelector(".options-container");
    if (show) {
      container.classList.add("loading");
    } else {
      container.classList.remove("loading");
    }
  }

  function showNotification(message, type = "success") {
    notificationText.textContent = message;

    // Update notification style
    if (type === "error") {
      notification.classList.add("error");
      notification.querySelector("svg").innerHTML = `
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      `;
    } else {
      notification.classList.remove("error");
      notification.querySelector("svg").innerHTML = `
        <path d="M20 6L9 17l-5-5"/>
      `;
    }

    // Show notification
    notification.classList.add("show");

    // Auto hide after 4 seconds
    setTimeout(() => {
      notification.classList.remove("show");
    }, 4000);
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveSettings();
    }

    // Escape to reset focus
    if (e.key === "Escape") {
      document.activeElement.blur();
    }
  });

  // Focus management for better accessibility
  apiKeyInput.addEventListener("focus", () => {
    apiKeyInput.parentElement.style.borderColor = "rgba(59, 130, 246, 0.5)";
  });

  apiKeyInput.addEventListener("blur", () => {
    if (!apiKeyInput.value || isValidApiKey(apiKeyInput.value)) {
      apiKeyInput.parentElement.style.borderColor = "";
    }
  });

  // Animate sections on load
  const sections = document.querySelectorAll(".section");
  sections.forEach((section, index) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";

    setTimeout(() => {
      section.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
      section.style.opacity = "1";
      section.style.transform = "translateY(0)";
    }, index * 150);
  });

  console.log("✅ BuzzBro options page initialized");
});
