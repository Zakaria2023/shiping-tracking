// Runs beside the MSC page. Receives the TrackingInfo answer from intercept.js,
// asks the background worker to post it to the app, and shows a small note on
// the page saying what happened.
const MARK = "shipment-tracking-msc-result";

const showNote = (text, tone) => {
  const existing = document.getElementById("shipment-tracking-note");
  if (existing) {
    existing.remove();
  }
  const note = document.createElement("div");
  note.id = "shipment-tracking-note";
  note.textContent = text;
  Object.assign(note.style, {
    position: "fixed",
    insetInlineEnd: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    padding: "10px 14px",
    borderRadius: "10px",
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
    color: "#fff",
    background: tone === "error" ? "#c62828" : tone === "warn" ? "#b45309" : "#0b5fa5",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  });
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 8000);
};

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.type !== MARK) {
    return;
  }
  chrome.runtime.sendMessage({ type: "ingest-msc", payload: event.data.payload }, (reply) => {
    if (chrome.runtime.lastError || !reply) {
      showNote("Shipment Tracking: could not reach the extension", "error");
      return;
    }
    if (reply.error) {
      showNote(`Shipment Tracking: ${reply.error}`, "error");
      return;
    }
    const matched = reply.outcomes.filter((o) => o.matched);
    if (matched.length === 0) {
      const numbers = reply.outcomes.map((o) => o.trackingNumber).join(", ");
      showNote(`Shipment Tracking: ${numbers} is not in the app yet`, "warn");
      return;
    }
    const events = matched.reduce((sum, o) => sum + o.newEvents, 0);
    showNote(
      `Shipment Tracking: ${matched.map((o) => `${o.trackingNumber} → ${o.status}`).join(", ")}${
        events ? ` (${events} new event${events === 1 ? "" : "s"})` : ""
      }`,
      "ok",
    );
  });
});
