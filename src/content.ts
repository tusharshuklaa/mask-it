(() => {
  let isMaskingActive = false;
  let hoverElement: Element | null = null;
  const url = window.location.href;
  
  // Load masks when page loads
  chrome.storage.local.get(url, function(data) {
    if (data[url]) {
      applyMasks(data[url] as string[]);
    }
  });
  
  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.action) {
      case "activateMasking":
        activateMaskingMode();
        sendResponse({success: true});
        break;
      case "deactivateMasking":
        deactivateMaskingMode();
        sendResponse({success: true});
        break;
      case "getStatus":
        sendResponse({isMaskingActive: isMaskingActive});
        break;
      case "clearMasks":
        clearMasks();
        sendResponse({success: true});
        break;
    }
    return true;
  });
  
  // Helper function to generate a unique selector for an element
  function generateSelector(element: Element): string {
    if (element.id) {
      return '#' + element.id;
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.trim().length > 0);
      if (classes.length > 0) {
        return '.' + classes.join('.');
      }
    }
    
    let path = '';
    let current: Node | null = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      let selector = el.nodeName.toLowerCase();
      let sibling: Element | null = el;
      let siblingIndex = 1;
      
      while (sibling = sibling.previousElementSibling) {
        if (sibling.nodeName.toLowerCase() === selector) {
          siblingIndex++;
        }
      }
      
      if (siblingIndex > 1) {
        selector += ':nth-of-type(' + siblingIndex + ')';
      }
      
      path = selector + (path ? ' > ' + path : '');
      current = current.parentNode;
    }
    
    return path;
  }
  
  // Activate masking mode
  function activateMaskingMode(): void {
    isMaskingActive = true;
    document.body.classList.add('mask-selector');
    
    // Mouse over event to highlight elements
    document.addEventListener('mouseover', mouseOverHandler);
    
    // Click event to mask elements
    document.addEventListener('click', clickHandler);
  }
  
  function mouseOverHandler(e: MouseEvent): void {
    if (!isMaskingActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as Element;

    const isAlreadyMasked = target.classList.contains('content-mask');
    
    // Remove highlight from previous element
    if (hoverElement) {
      hoverElement.classList.remove('mask-selector-hover');
    }
    
    if (!isAlreadyMasked) {
      // Add highlight to current element
      hoverElement = target;
      hoverElement.classList.add('mask-selector-hover');
    }
  }
  
  function clickHandler(e: MouseEvent): void {
    if (!isMaskingActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target as Element;
    
    // Don't mask elements that are already masked
    if (element.classList.contains('content-mask')) {
      return;
    }
    
    // Add mask class
    element.classList.add('content-mask');
    
    // Save the masked element's selector to storage
    const selector = generateSelector(element);
    saveSelector(selector);
  }
  
  function deactivateMaskingMode(): void {
    isMaskingActive = false;
    document.body.classList.remove('mask-selector');
    
    // Remove hover highlight
    if (hoverElement) {
      hoverElement.classList.remove('mask-selector-hover');
      hoverElement = null;
    }
    
    // Remove event listeners
    document.removeEventListener('mouseover', mouseOverHandler);
    document.removeEventListener('click', clickHandler);
  }
  
  function saveSelector(selector: string): void {
    chrome.storage.local.get(url, function(data) {
      const selectors: string[] = data[url] || [];
      
      // Only add the selector if it's not already saved
      if (!selectors.includes(selector)) {
        selectors.push(selector);
        
        // Save to Chrome storage
        const saveData: Record<string, string[]> = {};
        saveData[url] = selectors;
        chrome.storage.local.set(saveData);
      }
    });
  }
  
  function applyMasks(selectors: string[]): void {
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.classList.add('content-mask');
        });
      } catch (e) {
        console.error('Invalid selector:', selector, e);
      }
    });
  }
  
  function clearMasks(): void {
    // Remove mask class from all elements
    const maskedElements = document.querySelectorAll('.content-mask');
    maskedElements.forEach(el => {
      el.classList.remove('content-mask');
    });
    
    // Clear saved selectors for this URL
    const clearData: Record<string, string[]> = {};
    clearData[url] = [];
    chrome.storage.local.set(clearData);
  }
})();
