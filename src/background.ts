// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (!tab || !tab.id) {
    console.error("No active tab found!");
    return;
  }

  console.log(`Command: ${command}`);

  if (command === "toggle-masking") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-masking-shortcut" });
  } else if (command === "unmask-last") {
    chrome.tabs.sendMessage(tab.id, { action: "unmask-last-shortcut" });
  } else {
    console.error("Unknown command:", command);
  }
});

chrome.runtime.onInstalled.addListener(function () {
  // Create context menu items
  chrome.contextMenus.create({
    id: "toggle-masking",
    title: "Toggle Masking Mode",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "unmask-last",
    title: "Unmask Last Element",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "clear-all-masks",
    title: "Clear All Masks",
    contexts: ["page"],
  });
});

// Context menu handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  switch (info.menuItemId) {
    case "toggle-masking":
      chrome.tabs.sendMessage(tab.id, { action: "toggle-masking-shortcut" });
      break;
    case "unmask-last":
      chrome.tabs.sendMessage(tab.id, { action: "unmask-last-shortcut" });
      break;
    case "clear-all-masks":
      chrome.tabs.sendMessage(tab.id, { action: "clearMasks" });
      break;
  }
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
