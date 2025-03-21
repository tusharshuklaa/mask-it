![Mask It Chrome Extension Logo](/icons/icon128.png "Mask It Chrome Extension Logo")

# MaskIt Chrome Extension

A Chrome extension that allows users to mask DOM elements on any webpage by clicking on them. The masked elements are saved and reapplied when the user revisits the page.

## Features
- Click on any DOM element to mask it.
- Masked elements are saved in the extension settings.
- Automatically reapplies masks when the page is revisited.
- Access masking features such as 'Toggle Masking Mode', 'Unmask last item', and 'Clear all masks' is available via right click
- Keyboard shortcuts to toggle maskign mode and unmask last item

## How to use

### Activating Mask It
- By Clicking on the extension icon and clicking on ‘Start Masking’ button
- By ‘Right Click’ on the page and selecting ‘Toggle Masking Mode’
- By using keyboard shortcut - ‘Alt/Option + K’

### Deactivating mask It
- By Clicking on the extension icon and clicking on ‘Stop Masking’ button
- By ‘Right Click’ on the page and selecting ‘Toggle Masking Mode’
- By ‘Right Click’ on the page and selecting ‘Toggle Masking Mode’

### How to Mask?
- Once the extension is active, you can see GREEN color border around items that can be masked. Just click and the item would be masked.
- Masked elements will remain masked even when the tab is closed or refreshed

### How to Unmask?
- Once you click on the extension icon, you will see a list of masked items. Just click on the Unmask button and the item would be unmasked.
- You can also click on ‘Clear Masks’ button to remove all masked items from the page
- By pressing Alt/Option + L, last masked element can be unmasked

### Settings
- You can choose to either MASK items or make them invisible
- You can choose how the MASKING would look like by choosing one of the. various themes available
- You can also select the CONTENT that is showed inside the masked item
- You can also turn off the keyboard shortcuts if needed

## Installation
1. Clone this repository.
2. Run `npm i` and `npm build` to install dependencies and build the extension.
3. Open Chrome and go to `chrome://extensions/`.
4. Enable **Developer mode** (if not enabled already).
5. Click **Load unpacked** and select the `dist` folder.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
This project is licensed under the MIT License.
