console.log("BuzzBro background service worker started");

chrome.runtime.onInstalled.addListener((details) => {
  console.log("BuzzBro installed:", details.reason);

  if (details.reason === "install") {
    chrome.storage.sync.set({
      enabled: true,
      theme: "auto",
      apiKey: "",
      customPrompt: "",
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  switch (request.action) {
    case "getSettings":
      chrome.storage.sync.get(null, (data) => {
        sendResponse(data);
      });
      return true; // Keep message channel open for async response

    case "openOptions":
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      return true;

    default:
      sendResponse({ error: "Unknown action" });
  }
});
