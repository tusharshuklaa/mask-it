import { MaskedElement } from "./types";

const $id = (id: string) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = $id("toggleMaskMode") as HTMLButtonElement;
  const clearButton = $id("clearMasks") as HTMLButtonElement;
  const statusDiv = $id("status") as HTMLDivElement;
  const maskedItemsContainer = $id("maskedItems") as HTMLDivElement;
  const maskedItemsTitle = $id("maskedItemsTitle") as HTMLHeadingElement;
  const maskedItemsCount = $id("count") as HTMLSpanElement;

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

    maskedItemsTitle.classList.remove("hide");
    maskedItemsCount.textContent = items.length.toString();
    
    const list = document.createElement('ul');
    list.id = "maskedItemsList";
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
      unmaskBtn.className = "button mini";
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
        toggleButton.textContent = "Start Masking";
        toggleButton.classList.remove("active");
      } else {
        // Activate masking mode
        chrome.tabs.sendMessage(tabs[0].id, { action: "activateMasking" });
        toggleButton.textContent = "Stop Masking";
        toggleButton.classList.add("active");
      }
    });
  });

  clearButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0].id) return;

      chrome.tabs.sendMessage(tabs[0].id, { action: "clearMasks" });
      statusDiv.classList.add("show");
      maskedItemsContainer.innerHTML = "<p>No masked elements on this page.</p>";
      const list = document.getElementById("maskedItemsList");
      const listTitle = document.getElementById("maskedItemsTitle");

      if (list) {
        list.remove();
      }

      if (listTitle) {
        listTitle.classList.add("hide");
      }

      setTimeout(() => {
        statusDiv.classList.remove("show");
      }, 2000);
    });
  });
});
