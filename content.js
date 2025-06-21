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
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transform: translateY(-10px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    document.body.appendChild(indicator);

    // Animate in
    requestAnimationFrame(() => {
      indicator.style.transform = "translateY(0)";
      indicator.style.opacity = "1";
    });

    setTimeout(() => {
      if (indicator && indicator.parentNode) {
        indicator.style.transform = "translateY(-10px)";
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300);
        console.log("🧹 BuzzBro indicator removed");
      }
    }, 2000);

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
    const replyContainer =
      replyBox.closest('[data-testid="inline_reply_offscreen"]') ||
      replyBox.closest(".css-175oi2r");

    if (!replyContainer) {
      console.log("No reply container found");
      return;
    }

    if (replyContainer.querySelector(".buzzbro-generate-btn")) {
      console.log("Button already exists");
      return;
    }

    const generateButton = document.createElement("button");
    generateButton.className = "buzzbro-generate-btn";
    generateButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7v10l10 5 10-5V7z"/>
        <path d="m16.5 9.4-5 3-5-3"/>
      </svg>
      <span>Generate</span>
    `;
    generateButton.type = "button";

    generateButton.style.cssText = `
      background: rgba(255, 255, 255, 0.08) !important;
      backdrop-filter: blur(16px) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      color: rgba(255, 255, 255, 0.9) !important;
      border-radius: 8px !important;
      padding: 6px 12px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      margin: 8px !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      z-index: 10000 !important;
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      min-height: 32px !important;
      opacity: 0 !important;
      transform: translateY(4px) !important;
    `;

    requestAnimationFrame(() => {
      generateButton.style.opacity = "1";
      generateButton.style.transform = "translateY(0)";
    });

    generateButton.addEventListener("mouseenter", () => {
      generateButton.style.background = "rgba(255, 255, 255, 0.15) !important";
      generateButton.style.borderColor = "rgba(255, 255, 255, 0.2) !important";
      generateButton.style.transform = "translateY(-1px) !important";
      generateButton.style.boxShadow =
        "0 4px 16px rgba(0, 0, 0, 0.25) !important";
    });

    generateButton.addEventListener("mouseleave", () => {
      if (!generateButton.disabled) {
        generateButton.style.background =
          "rgba(255, 255, 255, 0.08) !important";
        generateButton.style.borderColor =
          "rgba(255, 255, 255, 0.12) !important";
        generateButton.style.transform = "translateY(0) !important";
        generateButton.style.boxShadow =
          "0 2px 8px rgba(0, 0, 0, 0.15) !important";
      }
    });

    generateButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleGenerateClick(replyBox);
    });

    let injected = false;

    const toolbar =
      replyContainer.querySelector('[data-testid="toolBar"]') ||
      replyContainer.querySelector('nav[role="navigation"]');

    if (toolbar && !injected) {
      const scrollSnapList = toolbar.querySelector(
        '[data-testid="ScrollSnap-List"]'
      );
      if (scrollSnapList) {
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "css-175oi2r r-14tvyh0 r-cpa5s6";
        buttonWrapper.appendChild(generateButton);

        scrollSnapList.insertBefore(buttonWrapper, scrollSnapList.firstChild);
        injected = true;
        console.log(
          "✨ BuzzBro button injected successfully in toolbar ScrollSnap-List"
        );
      }
    }

    if (!injected && toolbar) {
      const toolbarParent = toolbar.parentElement;
      if (toolbarParent) {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
          display: flex !important;
          justify-content: flex-start !important;
          padding: 8px 16px !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        `;
        buttonContainer.appendChild(generateButton);
        toolbarParent.insertBefore(buttonContainer, toolbar.nextSibling);
        injected = true;
        console.log("✨ BuzzBro button injected successfully after toolbar");
      }
    }

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

    if (!injected) {
      const fallbackContainer = document.createElement("div");
      fallbackContainer.style.cssText = `
        display: flex !important;
        justify-content: flex-start !important;
        padding: 12px 16px !important;
        background: rgba(0, 0, 0, 0.02) !important;
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

async function handleGenerateClick(replyBox) {
  try {
    const tweetText = extractTweetText(replyBox);
    console.log("🐦 Tweet text extracted:", tweetText);

    if (!tweetText) {
      console.log("No tweet text found");
      showNotification("❌ Could not find tweet text to reply to", "error");
      return;
    }

    const button =
      replyBox
        .closest('[data-testid="inline_reply_offscreen"]')
        ?.querySelector(".buzzbro-generate-btn") ||
      replyBox.closest(".css-175oi2r")?.querySelector(".buzzbro-generate-btn");

    if (!button) {
      console.log("Button not found");
      return;
    }

    const originalText = button.innerHTML;
    button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          animation: buzzbro-spin 0.8s linear infinite;
        "></div>
        <span>Generating...</span>
      </div>
    `;

    if (!document.getElementById("buzzbro-spinner-style")) {
      const style = document.createElement("style");
      style.id = "buzzbro-spinner-style";
      style.textContent = `
        @keyframes buzzbro-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    button.disabled = true;
    button.style.background = "rgba(59, 130, 246, 0.15) !important";
    button.style.borderColor = "rgba(59, 130, 246, 0.3) !important";
    button.style.cursor = "not-allowed !important";

    try {
      const settings = await window.BuzzBroAPI.getStoredSettings();

      if (!settings.apiKey) {
        throw new Error(
          "Please configure your Gemini API key in the extension settings"
        );
      }

      if (!settings.enabled) {
        throw new Error("BuzzBro is disabled. Please enable it in settings");
      }

      const generatedReply = await window.BuzzBroAPI.generateReply(
        tweetText,
        settings.apiKey,
        settings.customPrompt
      );

      if (generatedReply) {
        try {
          await navigator.clipboard.writeText(generatedReply);

          button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span>Copied!</span>
          `;
          button.style.background = "rgba(16, 185, 129, 0.15) !important";
          button.style.borderColor = "rgba(16, 185, 129, 0.3) !important";
          button.style.color = "rgba(16, 185, 129, 1) !important";

          const preview =
            generatedReply.length > 50
              ? generatedReply.substring(0, 50) + "..."
              : generatedReply;
          showNotification(`📋 Copied: "${preview}"`, "success");

          console.log("✅ Reply generated and copied:", generatedReply);

          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.style.background = "rgba(255, 255, 255, 0.08) !important";
            button.style.borderColor = "rgba(255, 255, 255, 0.12) !important";
            button.style.color = "rgba(255, 255, 255, 0.9) !important";
            button.style.cursor = "pointer !important";
          }, 3000);
        } catch (clipboardError) {
          console.error("Clipboard failed, showing popup fallback");
          showReplyPopup(generatedReply, replyBox);

          button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>Check Popup</span>
          `;
          button.style.background = "rgba(245, 158, 11, 0.15) !important";
          button.style.borderColor = "rgba(245, 158, 11, 0.3) !important";
          button.style.color = "rgba(245, 158, 11, 1) !important";

          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.style.background = "rgba(255, 255, 255, 0.08) !important";
            button.style.borderColor = "rgba(255, 255, 255, 0.12) !important";
            button.style.color = "rgba(255, 255, 255, 0.9) !important";
            button.style.cursor = "pointer !important";
          }, 3000);
        }
      }
    } catch (error) {
      console.error("❌ Error generating reply:", error);

      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>Retry</span>
      `;
      button.style.background = "rgba(220, 38, 38, 0.15) !important";
      button.style.borderColor = "rgba(220, 38, 38, 0.3) !important";
      button.style.color = "rgba(220, 38, 38, 1) !important";
      button.style.cursor = "pointer !important";

      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.background = "rgba(255, 255, 255, 0.08) !important";
        button.style.borderColor = "rgba(255, 255, 255, 0.12) !important";
        button.style.color = "rgba(255, 255, 255, 0.9) !important";
      }, 4000);

      if (error.message.includes("API key")) {
        const userConfirmed = confirm(
          "Please configure your Gemini API key in the extension settings. Open settings now?"
        );
        if (userConfirmed) {
          chrome.runtime.sendMessage({ action: "openOptions" });
        }
      } else {
        showNotification(`❌ Error: ${error.message}`, "error");
      }
    }
  } catch (error) {
    console.error("❌ Error handling generate click:", error);
  }
}

function showReplyPopup(generatedText, replyBox) {
  const existingPopup = document.getElementById("buzzbro-reply-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement("div");
  popup.id = "buzzbro-reply-popup";
  popup.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) scale(0.95) !important;
    background: rgba(0, 0, 0, 0.85) !important;
    backdrop-filter: blur(24px) !important;
    -webkit-backdrop-filter: blur(24px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 16px !important;
    padding: 24px !important;
    z-index: 999999 !important;
    max-width: 500px !important;
    width: 90vw !important;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5) !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    color: rgba(255, 255, 255, 0.9) !important;
    opacity: 0 !important;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  `;

  popup.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 8px 0; color: rgba(255, 255, 255, 0.95); font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7v10l10 5 10-5V7z"/>
          <path d="m16.5 9.4-5 3-5-3"/>
        </svg>
        Generated Reply
      </h3>
      <p style="margin: 0; color: rgba(255, 255, 255, 0.6); font-size: 14px;">
        Copy the text below and paste it into the reply box
      </p>
    </div>

    <div style="margin-bottom: 24px;">
      <textarea id="buzzbro-generated-text" readonly style="
        width: 100%;
        height: 120px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: rgba(255, 255, 255, 0.9);
        transition: all 0.2s ease;
      " onfocus="this.style.borderColor='rgba(59, 130, 246, 0.5)'; this.style.background='rgba(255, 255, 255, 0.08)';" onblur="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.background='rgba(255, 255, 255, 0.05)';">${generatedText}</textarea>
    </div>

    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="buzzbro-copy-btn" style="
        background: rgba(59, 130, 246, 0.15);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: rgba(59, 130, 246, 1);
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      " onmouseover="this.style.background='rgba(59, 130, 246, 0.25)'; this.style.borderColor='rgba(59, 130, 246, 0.5)';" onmouseout="this.style.background='rgba(59, 130, 246, 0.15)'; this.style.borderColor='rgba(59, 130, 246, 0.3)';">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copy to Clipboard
      </button>

      <button id="buzzbro-close-btn" style="
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'; this.style.borderColor='rgba(255, 255, 255, 0.2)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.borderColor='rgba(255, 255, 255, 0.1)';">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Close
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  const backdrop = document.createElement("div");
  backdrop.id = "buzzbro-backdrop";
  backdrop.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    z-index: 999998 !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
  `;
  document.body.appendChild(backdrop);

  requestAnimationFrame(() => {
    backdrop.style.opacity = "1";
    popup.style.opacity = "1";
    popup.style.transform = "translate(-50%, -50%) scale(1)";
  });

  const textArea = popup.querySelector("#buzzbro-generated-text");
  const copyBtn = popup.querySelector("#buzzbro-copy-btn");
  const closeBtn = popup.querySelector("#buzzbro-close-btn");

  textArea.select();
  textArea.focus();

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Copied!
      `;
      copyBtn.style.background = "rgba(16, 185, 129, 0.15)";
      copyBtn.style.borderColor = "rgba(16, 185, 129, 0.3)";
      copyBtn.style.color = "rgba(16, 185, 129, 1)";

      showNotification(
        "✅ Reply copied to clipboard! Paste it in the reply box.",
        "success"
      );

      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy to Clipboard
        `;
        copyBtn.style.background = "rgba(59, 130, 246, 0.15)";
        copyBtn.style.borderColor = "rgba(59, 130, 246, 0.3)";
        copyBtn.style.color = "rgba(59, 130, 246, 1)";
      }, 2000);
    } catch (error) {
      textArea.select();
      document.execCommand("copy");
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Copied!
      `;
      copyBtn.style.background = "rgba(16, 185, 129, 0.15)";
      copyBtn.style.borderColor = "rgba(16, 185, 129, 0.3)";
      copyBtn.style.color = "rgba(16, 185, 129, 1)";

      showNotification(
        "✅ Reply copied to clipboard! Paste it in the reply box.",
        "success"
      );

      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy to Clipboard
        `;
        copyBtn.style.background = "rgba(59, 130, 246, 0.15)";
        copyBtn.style.borderColor = "rgba(59, 130, 246, 0.3)";
        copyBtn.style.color = "rgba(59, 130, 246, 1)";
      }, 2000);
    }
  });

  const closePopup = () => {
    popup.style.opacity = "0";
    popup.style.transform = "translate(-50%, -50%) scale(0.95)";
    backdrop.style.opacity = "0";

    setTimeout(() => {
      popup.remove();
      backdrop.remove();
    }, 300);
  };

  closeBtn.addEventListener("click", closePopup);
  backdrop.addEventListener("click", closePopup);

  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      closePopup();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  try {
    navigator.clipboard.writeText(generatedText);
    showNotification("🚀 Reply generated and copied to clipboard!", "success");
  } catch (error) {
    console.log("Auto-copy failed, user can use copy button");
  }
}

function showNotification(message, type = "info") {
  const existingNotification = document.getElementById("buzzbro-notification");
  if (existingNotification) {
    existingNotification.style.transform = "translateX(400px)";
    setTimeout(() => existingNotification.remove(), 300);
  }

  const notification = document.createElement("div");
  notification.id = "buzzbro-notification";

  const typeStyles = {
    success: {
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.3)",
      color: "rgba(16, 185, 129, 1)",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    },
    error: {
      bg: "rgba(220, 38, 38, 0.15)",
      border: "rgba(220, 38, 38, 0.3)",
      color: "rgba(220, 38, 38, 1)",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    },
    info: {
      bg: "rgba(59, 130, 246, 0.15)",
      border: "rgba(59, 130, 246, 0.3)",
      color: "rgba(59, 130, 246, 1)",
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    },
  };

  const style = typeStyles[type];

  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: ${style.bg} !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: 1px solid ${style.border} !important;
    color: ${style.color} !important;
    padding: 16px 20px !important;
    border-radius: 12px !important;
    z-index: 999999 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    max-width: 350px !important;
    transform: translateX(400px) !important;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  `;

  notification.innerHTML = `
    ${style.icon}
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    notification.style.transform = "translateX(400px)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 5000);
}

function extractTweetText(replyBox) {
  try {
    const tweetContainer =
      replyBox.closest('[data-testid="tweet"]') ||
      replyBox.closest('[data-testid="cellInnerDiv"]');

    if (!tweetContainer) {
      console.log("No tweet container found for reply box:", replyBox);
      return "";
    }

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
