const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateReply(tweetText, apiKey, customPrompt = "") {
  try {
    if (!apiKey) {
      throw new Error("API key is required");
    }

    if (!tweetText) {
      throw new Error("Tweet text is required");
    }

    const defaultPrompt = `Generate a witty, engaging, and thoughtful reply to this tweet. The reply should:
- Be conversational and natural
- Add value to the discussion
- Be under 280 characters
- Avoid controversial topics
- Be positive and constructive

Tweet to reply to: "${tweetText}"

Generate only the reply text, nothing else:`;

    const prompt = customPrompt || defaultPrompt;
    const fullPrompt = customPrompt
      ? `${customPrompt}\n\nTweet: "${tweetText}"\n\nReply:`
      : `${defaultPrompt}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API Error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid response from Gemini API");
    }

    const generatedText = data.candidates[0].content.parts[0].text.trim();

    return generatedText.length > 280
      ? generatedText.substring(0, 277) + "..."
      : generatedText;
  } catch (error) {
    console.error("Error generating reply:", error);
    throw error;
  }
}

async function getStoredSettings() {
  try {
    // Content scripts can't access chrome.storage directly
    // We need to send a message to the background script
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response.settings);
        } else {
          reject(new Error(response?.error || "Failed to get settings"));
        }
      });
    });
  } catch (error) {
    console.error("Error getting stored settings:", error);
    throw error;
  }
}

window.BuzzBroAPI = {
  generateReply,
  getStoredSettings,
};
