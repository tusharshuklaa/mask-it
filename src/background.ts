chrome.runtime.onInstalled.addListener(function () {
  console.log("Content Masker extension installed");
});

// Inject content script when page loads to apply masks
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
      })
      .catch((err) => console.error(err));
  }
});
