import { MaskedElement } from "./types";

const $id = (id: string) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = $id("toggleMaskMode") as HTMLButtonElement;
  const clearButton = $id("clearMasks") as HTMLButtonElement;
  const statusDiv = $id("status") as HTMLDivElement;
  const maskedItemsContainer = $id("maskedItems") as HTMLDivElement;

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

      // Load masked items list
      chrome.tabs.sendMessage(tabs[0].id, {action: "getMaskedItems"}, function(response: {items: Array<MaskedElement>} | undefined) {
        if (response && response.items && response.items.length > 0) {
          renderMaskedItems(response.items);
        } else {
          maskedItemsContainer.innerHTML = "<p>No masked elements on this page.</p>";
        }
      });
    }
  });

  function renderMaskedItems(items: Array<MaskedElement>): void {
    maskedItemsContainer.innerHTML = "";
    
    const title = document.createElement('h3');
    title.textContent = "Masked Elements";
    maskedItemsContainer.appendChild(title);
    
    const list = document.createElement('ul');
    list.className = "masked-items-list";
    
    items.forEach((item, index) => {
      const li = document.createElement('li');
      
      // Format the date
      const date = new Date(item.timestamp);
      const dateString = date.toLocaleString();
      
      // Create item content
      const itemText = document.createElement('span');
      itemText.textContent = `Element ${index + 1} (${dateString})`;
      
      // Create unmask button
      const unmaskBtn = document.createElement('button');
      unmaskBtn.textContent = "Unmask";
      unmaskBtn.className = "unmask-btn";
      unmaskBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (!tabs[0].id) return;
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "unmaskElement",
            selector: item.selector
          }, function() {
            // Remove from list on success
            li.remove();
            if (list.children.length === 0) {
              maskedItemsContainer.innerHTML = "<p>No masked elements on this page.</p>";
            }
          });
        });
      });
      
      li.appendChild(itemText);
      li.appendChild(unmaskBtn);
      list.appendChild(li);
    });
    
    maskedItemsContainer.appendChild(list);
  }

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
