// Runs in the page's own world, before any of MSC's scripts. It wraps fetch
// and XMLHttpRequest so that when the page receives its TrackingInfo answer,
// a copy is handed to the content script (content.js) through postMessage.
// Nothing is sent anywhere from here, and nothing else on the page is touched.
(() => {
  const MARK = "shipment-tracking-msc-result";
  const isTrackingUrl = (url) => typeof url === "string" && /TrackingInfo/i.test(url);

  const publish = (text) => {
    try {
      const payload = JSON.parse(text);
      window.postMessage({ type: MARK, payload }, "*");
    } catch {
      // Not JSON; not ours.
    }
  };

  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const response = await originalFetch.call(this, input, init);
    const url = typeof input === "string" ? input : input && input.url;
    if (isTrackingUrl(url)) {
      response
        .clone()
        .text()
        .then(publish)
        .catch(() => {});
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (isTrackingUrl(url)) {
      this.addEventListener("load", () => {
        if (this.responseType === "" || this.responseType === "text") {
          publish(this.responseText);
        }
      });
    }
    return originalOpen.call(this, method, url, ...rest);
  };
})();
