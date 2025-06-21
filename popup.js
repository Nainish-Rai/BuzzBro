// BuzzBro Popup Script
// Handles popup interactions and settings

document.addEventListener("DOMContentLoaded", async () => {
  console.log("BuzzBro popup loaded");

  // Get elements
  const enabledToggle = document.getElementById("enabledToggle");
  const optionsBtn = document.getElementById("optionsBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  // Load current settings
  try {
    const settings = await chrome.storage.sync.get(["enabled"]);
    enabledToggle.checked = settings.enabled !== false;
  } catch (error) {
    console.error("Error loading settings:", error);
  }

  // Handle toggle change
  enabledToggle.addEventListener("change", async () => {
    try {
      await chrome.storage.sync.set({ enabled: enabledToggle.checked });
      console.log("Extension enabled:", enabledToggle.checked);

      // Send message to content script
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (
        tab &&
        (tab.url.includes("x.com") || tab.url.includes("twitter.com"))
      ) {
        chrome.tabs.sendMessage(tab.id, {
          action: "toggleEnabled",
          enabled: enabledToggle.checked,
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  });

  // Handle options button
  optionsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Handle refresh button
  refreshBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && (tab.url.includes("x.com") || tab.url.includes("twitter.com"))) {
      chrome.tabs.reload(tab.id);
    }
    window.close();
  });
});
