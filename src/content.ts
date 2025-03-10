(() => {
  let isMaskingActive = false;
  let hoverElement: Element | null = null;
  const url = window.location.href;
  
  // Load masks when page loads
  chrome.storage.local.get(url, function(data) {
    if (data[url]) {
      applyMasks(data[url] as Array<string>);
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
  
  /**
 * Generates a unique and reliable CSS selector for any DOM element
 * This handles elements without IDs or classes and ensures uniqueness even with similar elements
 */
function generateUniqueSelector(element: Element): string {
  // Try to use ID if available (most specific)
  if (element.id) {
    return '#' + CSS.escape(element.id);
  }
  
  // Check if the element has any attribute that could be identifying
  // like data-* attributes, name, etc.
  const dataAttributes = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-') || 
                    ['name', 'role', 'aria-label'].includes(attr.name));
  
  if (dataAttributes.length > 0) {
    // Use attribute for selector with tag name for more specificity
    const attr = dataAttributes[0];
    return `${element.tagName.toLowerCase()}[${attr.name}="${CSS.escape(attr.value)}"]`;
  }
  
  // Build a selector from the element's position in its siblings
  const buildPathSegment = (el: Element): string => {
    const tagName = el.tagName.toLowerCase();
    
    // Get all siblings with same tag
    const siblings = Array.from(el.parentElement?.children || [])
      .filter(sibling => sibling.tagName.toLowerCase() === tagName);
    
    // If element is unique among siblings by tag name
    if (siblings.length === 1) {
      return tagName;
    }
    
    // Find the index position
    const index = siblings.indexOf(el) + 1;
    
    // Add nth-of-type for uniqueness
    return `${tagName}:nth-of-type(${index})`;
  };
  
  // Build full path from element up to a unique parent
  const buildFullPath = (): string => {
    const path: string[] = [];
    let currentElement: Element | null = element;
    
    // This safety counter prevents infinite loops
    // in case of very deep DOM structures
    let maxDepth = 10;
    
    while (currentElement && currentElement !== document.documentElement && maxDepth > 0) {
      // Add current element to path
      const segment = buildPathSegment(currentElement);
      path.unshift(segment);
      
      // Check if we've built a unique selector so far
      const partialSelector = path.join(' > ');
      const matchingElements = document.querySelectorAll(partialSelector);
      
      // If we have a unique selector, we can stop
      if (matchingElements.length === 1) {
        return partialSelector;
      }
      
      // Move up to parent
      currentElement = currentElement.parentElement;
      maxDepth--;
    }
    
    // Add html tag as root if needed
    if (path.length > 0) {
      path.unshift('html');
    }
    
    return path.join(' > ');
  };
  
  // First attempt: Try to build a unique path
  const pathSelector = buildFullPath();
  
  // Verify uniqueness of our selector
  const matchingElements = document.querySelectorAll(pathSelector);
  if (matchingElements.length === 1) {
    return pathSelector;
  }
  
  // If we still don't have a unique selector, add index-based nth-child selectors
  // to get more specific by walking up the DOM tree
  const buildPositionalSelector = (): string => {
    const path: string[] = [];
    let currentElement: Element | null = element;
    
    while (currentElement && currentElement !== document.documentElement) {
      // For each element, add its tag with its position among all siblings
      const tag = currentElement.tagName.toLowerCase();
      
      // Get its position among ALL siblings, not just same tag
      const allSiblings = Array.from(currentElement.parentElement?.children || []);
      const position = allSiblings.indexOf(currentElement) + 1;
      
      path.unshift(`${tag}:nth-child(${position})`);
      
      // Check if we have a unique path
      const selector = path.join(' > ');
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // Add html tag as root
    path.unshift('html');
    return path.join(' > ');
  };
  
  // Return the most specific selector
  return buildPositionalSelector();
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
    const selector = generateUniqueSelector(element);
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
      const selectors: Array<string> = data[url] || [];

      console.log('🚀 -----------------------------------------------------🚀');
      console.log('🚀 ~ chrome.storage.local.get ~ selectors:', selectors);
      console.log('🚀 -----------------------------------------------------🚀');
      
      // Only add the selector if it's not already saved
      if (!selectors.includes(selector)) {
        // Remove mask class from selector
        const actualSelector = selector
          .replace('.content-mask', '')
          .replace('.mask-selector-hover', '')
          .replace('.mask-selector', '');
        selectors.push(actualSelector);
        
        // Save to Chrome storage
        const saveData: Record<string, Array<string>> = {};
        saveData[url] = selectors;
        console.log('🚀 ---------------------------------------------------🚀');
        console.log('🚀 ~ chrome.storage.local.get ~ saveData:', saveData);
        console.log('🚀 ---------------------------------------------------🚀');
        chrome.storage.local.set(saveData);
      }
    });
  }
  
  function applyMasks(selectors: Array<string>): void {
    console.log('Applying masks:', selectors);
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
    const clearData: Record<string, Array<string>> = {};
    clearData[url] = [];
    chrome.storage.local.set(clearData);
  }
})();
