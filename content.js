// BuzzBro Content Script
// This script runs on Twitter/X pages

console.log("🚀 BuzzBro extension loaded on:", window.location.href);

// Test function to verify the extension is working
function initBuzzBro() {
  try {
    console.log("✅ BuzzBro initialized successfully!");

    // Check if already initialized to prevent duplicates
    if (document.getElementById("buzzbro-indicator")) {
      console.log("🔄 BuzzBro already initialized, skipping...");
      return;
    }

    // Add a visual indicator that the extension is loaded
    const indicator = document.createElement("div");
    indicator.id = "buzzbro-indicator";
    indicator.textContent = "🚀 BuzzBro Active";
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #1d4ed8;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    document.body.appendChild(indicator);

    // Remove indicator after 3 seconds
    setTimeout(() => {
      if (indicator && indicator.parentNode) {
        indicator.remove();
        console.log("🧹 BuzzBro indicator removed");
      }
    }, 3000);

    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("📨 Content script received message:", request);

      if (request.action === "toggleEnabled") {
        console.log(
          "🔄 Extension toggled:",
          request.enabled ? "enabled" : "disabled"
        );
        sendResponse({ success: true });
      }
    });
  } catch (error) {
    console.error("❌ BuzzBro initialization failed:", error);
  }
}

// Wait for page to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBuzzBro);
} else {
  initBuzzBro();
}
