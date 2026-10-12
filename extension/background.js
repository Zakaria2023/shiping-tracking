// Posts a captured MSC result to the app. The app URL and the shared token
// come from the options page and live in chrome.storage.
const settings = () =>
  new Promise((resolve) => {
    chrome.storage.sync.get({ appUrl: "http://localhost:3010", token: "" }, resolve);
  });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "ingest-msc") {
    return false;
  }
  (async () => {
    const { appUrl, token } = await settings();
    if (!token) {
      sendResponse({ error: "set the app URL and token in the extension options" });
      return;
    }
    try {
      const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/tracking/msc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message.payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        sendResponse({ error: body.error || `the app answered ${response.status}` });
        return;
      }
      sendResponse(body);
    } catch (error) {
      sendResponse({ error: `could not reach ${appUrl}` });
    }
  })();
  // Keep the channel open for the async reply.
  return true;
});
