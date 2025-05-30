# quick-launch
A simple Chrome extension to quickly open pre-selected default websites by clicking the extension icon or using a keyboard shortcut. Allows managing a list of websites, selecting which ones open with the main action, and assigning shortcuts to your top favorite sites.

![Quick Launch Icon](icons/icon128.png)

## Features

*   **Quick Access:** Click the extension icon or use the main keyboard shortcut (configurable) to open all your selected default websites simultaneously in new tabs.
*   **Website Management:** Easily add, remove, and reorder websites through the extension's options page.
*   **Selective Launch:** Choose which websites from your list are included in the main quick launch action.
*   **Favorite Shortcuts:** Assign global shortcuts (`Alt+1`, `Alt+2`, `Alt+3` by default, configurable) to instantly open the first, second, or third website in your ordered list.
*   **Drag & Drop Reordering:** Conveniently reorder your favorite websites to match your preferred shortcut assignment.

## How to Use

1.  Install the extension.
2.  Right-click the extension icon and select "Options" (or find it in `chrome://extensions`).
3.  Add the URLs of websites you frequently visit.
4.  Use the checkboxes to select which websites should open when you click the extension icon or use the main keyboard shortcut (configurable in `chrome://extensions/shortcuts`).
5.  Drag and drop websites to reorder them. The first three websites in the list can be opened with `Alt+1`, `Alt+2`, and `Alt+3` respectively.
6.  Click the extension icon in your Chrome toolbar, or use the configured keyboard shortcuts, to launch your sites!

## Keyboard Shortcuts

*   **Main Action (Open selected sites):** Configurable in `chrome://extensions/shortcuts` (No default suggested key; you'll need to set one).
*   **Open Favorite Website 1:** `Alt+1` (Default, configurable)
*   **Open Favorite Website 2:** `Alt+2` (Default, configurable)
*   **Open Favorite Website 3:** `Alt+3` (Default, configurable)

Note: You can customize these shortcuts via `chrome://extensions/shortcuts`. Be mindful of potential conflicts with existing browser or system shortcuts.