document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById(
    "toggleMaskMode"
  ) as HTMLButtonElement;
  const clearButton = document.getElementById(
    "clearMasks"
  ) as HTMLButtonElement;
  const statusDiv = document.getElementById("status") as HTMLDivElement;

  // Check if masking mode is already active
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getStatus" },
        function (response: { isMaskingActive: boolean } | undefined) {
          if (response && response.isMaskingActive) {
            toggleButton.textContent = "Stop Masking Elements";
            toggleButton.classList.add("active");
          }
        }
      );
    }
  });

  toggleButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0].id) return;

      const isActive = toggleButton.classList.contains("active");

      if (isActive) {
        // Deactivate masking mode
        chrome.tabs.sendMessage(tabs[0].id, { action: "deactivateMasking" });
        toggleButton.textContent = "Start Masking Elements";
        toggleButton.classList.remove("active");
      } else {
        // Activate masking mode
        chrome.tabs.sendMessage(tabs[0].id, { action: "activateMasking" });
        toggleButton.textContent = "Stop Masking Elements";
        toggleButton.classList.add("active");
      }
    });
  });

  clearButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0].id) return;

      chrome.tabs.sendMessage(tabs[0].id, { action: "clearMasks" });
      statusDiv.textContent = "All masks cleared for this page!";
      setTimeout(() => {
        statusDiv.textContent = "";
      }, 2000);
    });
  });
});
