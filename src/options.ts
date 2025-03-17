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

const THEMES = Object.keys(THEME_MAP).reduce((theme, curr) => {
  theme[curr as ThemeName] = curr as ThemeName;
  return theme;
}, {} as Record<ThemeName, ThemeName>);

// Load saved options
function loadOptions(): void {
  chrome.storage.sync.get(
    {
      theme: THEMES.dark, // Default theme
      defaultContent: "🚫", // Default content
      maskingBehavior: "__mskit_mask", // Default behavior
      needKeyboardShortcuts: true,
    },
    (options: {
      theme: string;
      defaultContent: string;
      maskingBehavior: string;
      needKeyboardShortcuts: boolean;
    }) => {
      const previewBox = document.getElementById(
        "previewBox"
      ) as HTMLDivElement;
      const maskOptions = document.getElementById(
        "maskOptions"
      ) as HTMLDivElement;
      // Set theme
      const themeSelect = document.getElementById("theme") as HTMLSelectElement;
      // Remove all existing theme classes
      previewBox.classList.remove(...Object.values(THEME_MAP));
      // Add new theme class
      previewBox.classList.add(THEME_MAP[options.theme as ThemeName]);
      themeSelect.value = options.theme;

      // Set default content
      const defaultContentInput = document.getElementById(
        "default-content"
      ) as HTMLSelectElement;
      previewBox.setAttribute("data-mask-content", options.defaultContent);
      defaultContentInput.value = options.defaultContent;

      // Set keyboard shortcuts
      const kbdShortcuts = document.getElementById("needKbdShortcuts") as HTMLInputElement;
      kbdShortcuts.checked = options.needKeyboardShortcuts;

      // Set masking behavior
      const maskingBehaviorRadio = document.querySelectorAll(
        `input[name="masking-behavior"]`
      );

      Array.from(maskingBehaviorRadio).forEach((radio) => {
        const radioInput = radio as HTMLInputElement;
        radioInput.checked = radioInput.value === options.maskingBehavior;
        maskOptions.style.display =
          options.maskingBehavior === "__mskit_mask" ? "flex" : "none";

        radioInput.addEventListener("change", () => {
          maskOptions.style.display =
            radioInput.value === "__mskit_mask" ? "flex" : "none";
        });
      });

      // Add event listeners
      themeSelect.addEventListener("change", () => {
        const themeName = themeSelect.value as ThemeName;
        // Remove all existing theme classes
        previewBox.classList.remove(...Object.values(THEME_MAP));
        // Add new theme class
        previewBox.classList.add(THEME_MAP[themeName]);
      });

      defaultContentInput.addEventListener("change", () => {
        previewBox.setAttribute("data-mask-content", defaultContentInput.value);
      });
    }
  );
}

// Save options
function saveOptions(): void {
  const theme = (document.getElementById("theme") as HTMLSelectElement).value;
  const defaultContent = (
    document.getElementById("default-content") as HTMLInputElement
  ).value;
  const maskingBehavior = (
    document.querySelector(
      'input[name="masking-behavior"]:checked'
    ) as HTMLInputElement
  ).value;
  const kbdShortcuts = document.getElementById("needKbdShortcuts") as HTMLInputElement;

  chrome.storage.sync.set({ theme, defaultContent, maskingBehavior, needKeyboardShortcuts: kbdShortcuts.checked }, () => {
    // Show confirmation
    alert("Options saved!");
  });
}

const themeSelect = document.getElementById("theme") as HTMLSelectElement;

// Attach event listeners
document.addEventListener("DOMContentLoaded", loadOptions);
document.getElementById("save")?.addEventListener("click", saveOptions);
