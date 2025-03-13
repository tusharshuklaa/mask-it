(() => {
  let isMaskingActive = false;
  let hoverElement: Element | null = null;
  const url = window.location.href;
  const maskingClass = "__mskit_mask";
  const maskMode = "__mskit_mask-selector";
  const maskModeHover = "__xmskit_mask-selector-hover";
  const THEME_MAP = {
    dark: "__mskit_dark",
    light: "__mskit_light",
    soothing: "__mskit_soothing",
    lilly: "__mskit_lilly",
    rose: "__mskit_rose",
    sky: "__mskit_sky",
    ocean: "__mskit_ocean",
  } as const;

  type ThemeName = keyof typeof THEME_MAP;

  const THEMES = Object.keys(THEME_MAP).reduce(
    (theme, curr) => {
      theme[curr as ThemeName] = curr as ThemeName;
      return theme;
    },
    {} as Record<ThemeName, ThemeName>
  );

  type MaskingOptions = {
    theme: ThemeName;
    defaultContent: string;
    maskingBehavior: string;
  };

  // Store masked elements with timestamps
  type MaskedElement = {
    selector: string;
    timestamp: number;
  };

  // Setup mutation observer for SPAs
  const observer = new MutationObserver(() => {
    // If DOM has changed, reapply masks
    chrome.storage.local.get(url, (data) => {
      if (data[url] && Array.isArray(data[url])) {
        applyMasks(data[url].map((item: MaskedElement) => item.selector));
      }
    });
  });

  // Start observing DOM changes
  function startObserving(): void {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  // Load masks when page loads
  function initializeMasks(): void {
    chrome.storage.local.get(url, function (data) {
      if (data[url] && Array.isArray(data[url])) {
        applyMasks(data[url].map((item: MaskedElement) => item.selector));
        startObserving();
      }
    });
  }

  // Initialize masks on load
  initializeMasks();

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener(function (
    request,
    _sender,
    sendResponse
  ) {
    switch (request.action) {
      case "activateMasking":
        activateMaskingMode();
        sendResponse({ success: true });
        break;
      case "deactivateMasking":
        deactivateMaskingMode();
        sendResponse({ success: true });
        break;
      case "getStatus":
        sendResponse({ isMaskingActive: isMaskingActive });
        break;
      case "clearMasks":
        clearMasks();
        sendResponse({ success: true });
        break;
      case "getMaskedItems":
        getMaskedItems().then((items) => {
          sendResponse({ items: items });
        });
        return true; // Keep connection open for async response
      case "unmaskElement":
        unmaskElement(request.selector);
        sendResponse({ success: true });
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
      return "#" + CSS.escape(element.id);
    }

    // Check if the element has any attribute that could be identifying
    // like data-* attributes, name, etc except data-mask-content.
    const dataAttributes = Array.from(element.attributes).filter(
      (attr) =>
        (attr.name.startsWith("data-") && attr.name !== "data-mask-content") ||
        ["name", "role", "aria-label"].includes(attr.name)
    );

    if (dataAttributes.length > 0) {
      // Use attribute for selector with tag name for more specificity
      const attr = dataAttributes[0];
      return `${element.tagName.toLowerCase()}[${attr.name}="${CSS.escape(
        attr.value
      )}"]`;
    }

    // Build a selector from the element's position in its siblings
    const buildPathSegment = (el: Element): string => {
      const tagName = el.tagName.toLowerCase();

      // Get all siblings with same tag
      const siblings = Array.from(el.parentElement?.children || []).filter(
        (sibling) => sibling.tagName.toLowerCase() === tagName
      );

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
      const path: Array<string> = [];
      let currentElement: Element | null = element;

      // This safety counter prevents infinite loops
      // in case of very deep DOM structures
      let maxDepth = 20;

      while (
        currentElement &&
        currentElement !== document.documentElement &&
        maxDepth > 0
      ) {
        // Add current element to path
        const segment = buildPathSegment(currentElement);
        path.unshift(segment);

        // Check if we've built a unique selector so far
        const partialSelector = path.join(" > ");
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
        path.unshift("html");
      }

      return path.join(" > ");
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
      const path: Array<string> = [];
      let currentElement: Element | null = element;

      while (currentElement && currentElement !== document.documentElement) {
        // For each element, add its tag with its position among all siblings
        const tag = currentElement.tagName.toLowerCase();

        // Get its position among ALL siblings, not just same tag
        const allSiblings = Array.from(
          currentElement.parentElement?.children || []
        );
        const position = allSiblings.indexOf(currentElement) + 1;

        path.unshift(`${tag}:nth-child(${position})`);

        // Check if we have a unique path
        const selector = path.join(" > ");
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }

        currentElement = currentElement.parentElement;
      }

      // Add html tag as root
      path.unshift("html");
      return path.join(" > ");
    };

    // Return the most specific selector
    return buildPositionalSelector();
  }

  // Activate masking mode
  function activateMaskingMode(): void {
    isMaskingActive = true;
    document.body.classList.add(maskMode);

    // Mouse over event to highlight elements
    document.addEventListener("mouseover", mouseOverHandler);

    // Click event to mask elements
    document.addEventListener("click", clickHandler);
  }

  function mouseOverHandler(e: MouseEvent): void {
    if (!isMaskingActive) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as Element;

    const isAlreadyMasked = target.classList.contains(maskingClass);

    // Remove highlight from previous element
    if (hoverElement) {
      hoverElement.classList.remove(maskModeHover);
    }

    if (!isAlreadyMasked) {
      // Add highlight to current element
      hoverElement = target;
      hoverElement.classList.add(maskModeHover);
    }
  }

  function getMaskingOptions(): Promise<MaskingOptions> {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        theme: THEMES.dark,
        defaultContent: '🚫',
        maskingBehavior: '__mskit_mask'
      },
      (options: MaskingOptions) => resolve(options));
    });
  }

  function getMaskingClasses(maskingOptions: MaskingOptions): Array<string> {
    const maskingClasses = [
      THEME_MAP[maskingOptions.theme],
      maskingOptions.maskingBehavior,
    ];

    return maskingClasses;
  }

  async function clickHandler(e: MouseEvent): Promise<void> {
    if (!isMaskingActive) return;

    e.preventDefault();
    e.stopPropagation();

    const element = e.target as Element;

    // Don't mask elements that are already masked
    if (element.className.includes("__mskit")) {
      return;
    }

    const maskingOptions = await getMaskingOptions();
    const allMaskingClasses = getMaskingClasses(maskingOptions);
    // Save the masked element's selector to storage
    const selector = generateUniqueSelector(element);

    // Add mask class
    element.classList.add(...allMaskingClasses);
    element.setAttribute('data-mask-content', maskingOptions.defaultContent);

    saveSelector(selector);
  }

  function deactivateMaskingMode(): void {
    isMaskingActive = false;
    document.body.classList.remove(maskMode);

    // Remove hover highlight
    if (hoverElement) {
      hoverElement.classList.remove(maskModeHover);
      hoverElement = null;
    }

    // Remove event listeners
    document.removeEventListener("mouseover", mouseOverHandler);
    document.removeEventListener("click", clickHandler);
  }

  function saveSelector(selector: string): void {
    chrome.storage.local.get(url, function (data) {
      const maskedElements: Array<MaskedElement> = data[url] || [];

      // Only add the selector if it's not already saved
      if (!maskedElements.some((item) => item.selector === selector)) {
        // Remove mask class from selector
        const maskingClasses = selector.split(".").filter((cls) => cls.startsWith("__mskit_")).map((cls) => `.${cls}`);
        let actualSelector = selector;
        maskingClasses.forEach((cls) => {
          actualSelector = selector.replace(cls, "");
        });

        maskedElements.push({
          selector: actualSelector,
          timestamp: Date.now(),
        });

        // Save to Chrome storage
        const saveData: Record<string, Array<MaskedElement>> = {};
        saveData[url] = maskedElements;
        chrome.storage.local.set(saveData);
      }
    });
  }

  async function applyMasks(selectors: Array<string>): Promise<void> {
    const maskingOptions = await getMaskingOptions();
    const allMaskingClasses = getMaskingClasses(maskingOptions);

    selectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          el.setAttribute('data-mask-content', maskingOptions.defaultContent);
          el.classList.add(...allMaskingClasses);
        });
      } catch (e) {
        console.error("Invalid selector:", selector, e);
      }
    });
  }

  function getElementMaskingClasses(element: Element): Array<string> {
    return Array.from(element.classList).filter((cls) => cls.startsWith("__mskit_"));
  }

  function clearMasks(): void {
    // Remove mask class from all elements
    const maskedElements = document.querySelectorAll('[class*="__mskit_"]');
    maskedElements.forEach((el) => {
      const maskingClasses = getElementMaskingClasses(el);
      el.classList.remove(...maskingClasses);
    });

    // Clear saved selectors for this URL
    const clearData: Record<string, Array<MaskedElement>> = {};
    clearData[url] = [];
    chrome.storage.local.set(clearData);

    // Stop observing - no need to watch for DOM changes
    observer.disconnect();
  }

  // Get all masked items for the current page
  async function getMaskedItems(): Promise<Array<MaskedElement>> {
    return new Promise((resolve) => {
      chrome.storage.local.get(url, function (data) {
        resolve(data[url] || []);
      });
    });
  }

  // Unmask a specific element by selector
  function unmaskElement(selector: string): void {
    try {
      // Remove mask from DOM
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const maskingClasses = getElementMaskingClasses(el);
        el.classList.remove(...maskingClasses);
      });

      // Remove from storage
      chrome.storage.local.get(url, function (data) {
        const maskedElements: Array<MaskedElement> = data[url] || [];
        const updatedElements = maskedElements.filter(
          (item) => item.selector !== selector
        );

        const saveData: Record<string, Array<MaskedElement>> = {};
        saveData[url] = updatedElements;
        chrome.storage.local.set(saveData);

        // If no masks left, stop observing
        if (updatedElements.length === 0) {
          observer.disconnect();
        }
      });
    } catch (e) {
      console.error("Error unmasking element:", e);
    }
  }

  // Initialize listener for keyboard shortcuts from background
  function initKeyboardShortcutListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "toggle-masking-shortcut") {
        if (isMaskingActive) {
          deactivateMaskingMode();
        } else {
          activateMaskingMode();
        }
      } else if (message.action === "unmask-last-shortcut") {
        // Unmask the most recently masked element
        chrome.storage.local.get(url, function (data) {
          const maskedElements: Array<MaskedElement> = data[url] || [];
          if (maskedElements.length > 0) {
            // Sort by timestamp (newest first)
            maskedElements.sort((a, b) => b.timestamp - a.timestamp);
            // Unmask the most recent one
            unmaskElement(maskedElements[0].selector);
          }
        });
      }
    });
  }

  // Initialize keyboard shortcuts
  initKeyboardShortcutListener();
})();
