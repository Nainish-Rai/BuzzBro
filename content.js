console.log("🚀 BuzzBro extension loaded on:", window.location.href);

let observer = null;
const injectedButtons = new Set();

function initBuzzBro() {
  try {
    console.log("✅ BuzzBro initialized successfully!");

    if (document.getElementById("buzzbro-indicator")) {
      console.log("🔄 BuzzBro already initialized, skipping...");
      return;
    }

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

    setTimeout(() => {
      if (indicator && indicator.parentNode) {
        indicator.remove();
        console.log("🧹 BuzzBro indicator removed");
      }
    }, 1000);

    // Initialize DOM observation
    initDOMObserver();

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

function initDOMObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          findAndInjectButtons(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan for existing reply boxes
  findAndInjectButtons(document.body);
}

function findAndInjectButtons(container) {
  // X/Twitter reply box selectors - updated to match actual DOM structure
  const replyBoxSelectors = [
    '[data-testid="tweetTextarea_0"]',
    '.public-DraftEditor-content[data-testid="tweetTextarea_0"]',
    '.public-DraftEditor-content[contenteditable="true"]',
    '[role="textbox"][data-testid="tweetTextarea_0"]',
  ];

  replyBoxSelectors.forEach((selector) => {
    const replyBoxes = container.querySelectorAll
      ? container.querySelectorAll(selector)
      : [];

    replyBoxes.forEach((replyBox) => {
      if (!injectedButtons.has(replyBox) && isReplyContext(replyBox)) {
        injectGenerateButton(replyBox);
        injectedButtons.add(replyBox);
      }
    });
  });
}

function isReplyContext(replyBox) {
  // Check if this is actually a reply context by looking for the reply structure
  const replyContainer = replyBox.closest(
    '[data-testid="inline_reply_offscreen"]'
  );
  const replyingText =
    document.querySelector('button[dir="ltr"]') &&
    document
      .querySelector('button[dir="ltr"]')
      .textContent.includes("Replying to");

  return !!(replyContainer || replyingText);
}

function injectGenerateButton(replyBox) {
  try {
    // Find the reply container
    const replyContainer =
      replyBox.closest('[data-testid="inline_reply_offscreen"]') ||
      replyBox.closest(".css-175oi2r");

    if (!replyContainer) {
      console.log("No reply container found");
      return;
    }

    // Check if button already exists
    if (replyContainer.querySelector(".buzzbro-generate-btn")) {
      console.log("Button already exists");
      return;
    }

    // Create the Generate Reply button
    const generateButton = document.createElement("button");
    generateButton.className = "buzzbro-generate-btn";
    generateButton.innerHTML = "✨ Generate Reply";
    generateButton.type = "button";

    generateButton.style.cssText = `
      background: linear-gradient(45deg, #1d4ed8, #3b82f6) !important;
      color: white !important;
      border: none !important;
      border-radius: 20px !important;
      padding: 8px 16px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      margin: 8px !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      z-index: 10000 !important;
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 32px !important;
    `;

    // Add hover effect
    generateButton.addEventListener("mouseenter", () => {
      generateButton.style.background =
        "linear-gradient(45deg, #1e40af, #2563eb) !important";
      generateButton.style.transform = "translateY(-1px) !important";
      generateButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2) !important";
    });

    generateButton.addEventListener("mouseleave", () => {
      generateButton.style.background =
        "linear-gradient(45deg, #1d4ed8, #3b82f6) !important";
      generateButton.style.transform = "translateY(0) !important";
      generateButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1) !important";
    });

    // Add click handler
    generateButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleGenerateClick(replyBox);
    });

    // Try multiple injection strategies
    let injected = false;

    // Strategy 1: Inject in the toolbar
    const toolbar =
      replyContainer.querySelector('[data-testid="toolBar"]') ||
      replyContainer.querySelector('nav[role="navigation"]');

    if (toolbar && !injected) {
      const scrollSnapList = toolbar.querySelector(
        '[data-testid="ScrollSnap-List"]'
      );
      if (scrollSnapList) {
        // Create a wrapper div to match X's button structure
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "css-175oi2r r-14tvyh0 r-cpa5s6";
        buttonWrapper.appendChild(generateButton);

        // Insert at the beginning of the scrollable list
        scrollSnapList.insertBefore(buttonWrapper, scrollSnapList.firstChild);
        injected = true;
        console.log(
          "✨ BuzzBro button injected successfully in toolbar ScrollSnap-List"
        );
      }
    }

    // Strategy 2: Inject after the toolbar
    if (!injected && toolbar) {
      const toolbarParent = toolbar.parentElement;
      if (toolbarParent) {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
          display: flex !important;
          justify-content: flex-start !important;
          padding: 8px 16px !important;
          border-top: 1px solid rgba(113, 118, 123, 0.2) !important;
        `;
        buttonContainer.appendChild(generateButton);
        toolbarParent.insertBefore(buttonContainer, toolbar.nextSibling);
        injected = true;
        console.log("✨ BuzzBro button injected successfully after toolbar");
      }
    }

    // Strategy 3: Inject near the reply button
    if (!injected) {
      const replyButton = replyContainer.querySelector(
        '[data-testid="tweetButtonInline"]'
      );
      if (replyButton && replyButton.parentElement) {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
          display: flex !important;
          align-items: center !important;
          margin-left: 8px !important;
        `;
        buttonContainer.appendChild(generateButton);
        replyButton.parentElement.insertBefore(buttonContainer, replyButton);
        injected = true;
        console.log(
          "✨ BuzzBro button injected successfully near reply button"
        );
      }
    }

    // Strategy 4: Fallback - inject at the bottom of the reply container
    if (!injected) {
      const fallbackContainer = document.createElement("div");
      fallbackContainer.style.cssText = `
        display: flex !important;
        justify-content: flex-start !important;
        padding: 12px 16px !important;
        background: rgba(239, 243, 244, 0.03) !important;
        border-radius: 8px !important;
        margin: 8px !important;
      `;
      fallbackContainer.appendChild(generateButton);
      replyContainer.appendChild(fallbackContainer);
      injected = true;
      console.log("✨ BuzzBro button injected successfully (fallback)");
    }

    if (!injected) {
      console.log("❌ Failed to inject button - no suitable container found");
    }
  } catch (error) {
    console.error("❌ Error injecting generate button:", error);
  }
}

function handleGenerateClick(replyBox) {
  try {
    // Extract tweet text from the parent tweet
    const tweetText = extractTweetText(replyBox);

    console.log("🐦 Tweet text extracted:", tweetText);
    console.log("📝 Generate reply clicked for tweet:", tweetText);

    // Show loading state
    const button = replyBox.parentElement.querySelector(
      ".buzzbro-generate-btn"
    );
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = "⏳ Generating...";
      button.disabled = true;

      // Reset button after 2 seconds (placeholder for actual generation)
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 2000);
    }
  } catch (error) {
    console.error("❌ Error handling generate click:", error);
  }
}

function extractTweetText(replyBox) {
  try {
    // Find the parent tweet container
    const tweetContainer =
      replyBox.closest('[data-testid="tweet"]') ||
      replyBox.closest('[data-testid="cellInnerDiv"]');

    if (!tweetContainer) {
      console.log("No tweet container found for reply box:", replyBox);
      return "";
    }

    // Look for tweet text in various possible selectors
    const textSelectors = [
      '[data-testid="tweetText"]',
      "[lang]",
      ".css-901oao",
      '[dir="auto"]',
    ];

    for (const selector of textSelectors) {
      const textElement = tweetContainer.querySelector(selector);
      if (textElement && textElement.textContent.trim()) {
        return textElement.textContent.trim();
      }
    }

    return "";
  } catch (error) {
    console.error("❌ Error extracting tweet text:", error);
    return "";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBuzzBro);
} else {
  initBuzzBro();
}
