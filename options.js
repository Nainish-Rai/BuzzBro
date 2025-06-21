document.addEventListener("DOMContentLoaded", async () => {
  console.log("BuzzBro options page loaded");

  // Get elements
  const enabledToggle = document.getElementById("enabledToggle");
  const themeSelect = document.getElementById("theme");
  const apiKeyInput = document.getElementById("apiKey");
  const customPromptInput = document.getElementById("customPrompt");
  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");

  // Load current settings
  await loadSettings();

  async function loadSettings() {
    try {
      const settings = await chrome.storage.sync.get({
        enabled: true,
        theme: "auto",
        apiKey: "",
        customPrompt: "",
      });

      enabledToggle.checked = settings.enabled;
      themeSelect.value = settings.theme;
      apiKeyInput.value = settings.apiKey;
      customPromptInput.value = settings.customPrompt;
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  // Save settings
  async function saveSettings() {
    try {
      const settings = {
        enabled: enabledToggle.checked,
        theme: themeSelect.value,
        apiKey: apiKeyInput.value,
        customPrompt: customPromptInput.value,
      };

      await chrome.storage.sync.set(settings);

      // Show save confirmation
      saveBtn.textContent = "Saved!";
      saveBtn.classList.add("success");

      setTimeout(() => {
        saveBtn.textContent = "Save Settings";
        saveBtn.classList.remove("success");
      }, 2000);

      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  // Reset to defaults
  async function resetSettings() {
    try {
      const defaults = {
        enabled: true,
        theme: "auto",
        apiKey: "",
        customPrompt: "",
      };

      await chrome.storage.sync.set(defaults);
      await loadSettings();

      console.log("Settings reset to defaults");
    } catch (error) {
      console.error("Error resetting settings:", error);
    }
  }

  // Event listeners
  saveBtn.addEventListener("click", saveSettings);
  resetBtn.addEventListener("click", resetSettings);

  // Auto-save on changes
  enabledToggle.addEventListener("change", saveSettings);
  themeSelect.addEventListener("change", saveSettings);
});
