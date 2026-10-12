const appUrlInput = document.getElementById("appUrl");
const tokenInput = document.getElementById("token");
const saved = document.getElementById("saved");

chrome.storage.sync.get({ appUrl: "http://localhost:3010", token: "" }, (items) => {
  appUrlInput.value = items.appUrl;
  tokenInput.value = items.token;
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set(
    { appUrl: appUrlInput.value.trim(), token: tokenInput.value.trim() },
    () => {
      saved.textContent = "Saved";
      setTimeout(() => (saved.textContent = ""), 2000);
    },
  );
});
