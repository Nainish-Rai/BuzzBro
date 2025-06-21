// BuzzBro Background Service Worker
// Handles extension lifecycle and background tasks

console.log("BuzzBro background service worker started");

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log("BuzzBro installed:", details.reason);

  if (details.reason === "install") {
    // Set default options
    chrome.storage.sync.set({
      enabled: true,
      theme: "auto",
    });
  }
});

// Message handler for communication with content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  // Handle different message types here in future
  switch (request.action) {
    case "getSettings":
      chrome.storage.sync.get(null, (data) => {
        sendResponse(data);
      });
      return true; // Keep message channel open for async response

    default:
      sendResponse({ error: "Unknown action" });
  }
});
