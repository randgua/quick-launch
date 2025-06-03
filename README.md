# quick-launch
A simple Chrome extension to quickly open pre-selected default websites by clicking the extension icon or using a keyboard shortcut. Allows managing a list of websites, selecting which ones open with the main action, and assigning shortcuts to your top favorite sites.

<p align="center">
  <img src="src/icons/icon128.png" alt="Quick Launch Icon">
</p>

## Features

*   **Quick Access:** Click the extension icon or use the main keyboard shortcut (configurable) to open all your *selected* websites simultaneously in new tabs. If no websites are stored, it initializes with default sites (e.g., Google, YouTube) and opens them. If websites are stored but none are selected, the extension's options page will open to guide you.
*   **Website Management:** Easily add websites using the bulk add feature, edit existing URLs (which can be cleared to be an 'empty entry' or updated), remove, and reorder websites through the extension's options page. URLs can be edited directly in the list and saved with Cmd/Ctrl+Enter.
*   **Selective Launch:** Choose which websites from your list are included in the main quick launch action.
*   **Favorite Shortcuts:** Global shortcuts (`Alt+1`, `Alt+2`, `Alt+3` by default, configurable) instantly open the first, second, or third website in your ordered list. If a favorite site is not configured at that position, its URL is empty, or its URL is structurally invalid (e.g., malformed), the extension's options page will open. (Note: URLs are validated for `http(s)`, `chrome-extension`, or `file` protocols when added or edited via the options page.)
*   **Drag & Drop Reordering:** Conveniently reorder your favorite websites to match your preferred shortcut assignment.

## How to Use

1.  Install the extension.
2.  Right-click the extension icon and select "Options" (or find it in `chrome://extensions`).
3.  Add the URLs of websites you frequently visit using the **bulk add feature**. You can also edit existing URLs directly in the list (and save with Cmd/Ctrl+Enter).
4.  Use the checkboxes to select which websites should open when you click the extension icon or use the main keyboard shortcut (configurable in `chrome://extensions/shortcuts`).
5.  Drag and drop websites to reorder them. The first three websites in the list can be opened with `Alt+1`, `Alt+2`, and `Alt+3` respectively.
6.  Click the extension icon in your Chrome toolbar, or use the configured keyboard shortcuts, to launch your selected sites! If no sites are selected (and sites *are* stored), the options page will open.

## Keyboard Shortcuts

*   **Main Action (Open selected sites):** Configurable in `chrome://extensions/shortcuts` (No default suggested key; you'll need to set one).
*   **Open Favorite Website 1:** `Alt+1` (Default, configurable)
*   **Open Favorite Website 2:** `Alt+2` (Default, configurable)
*   **Open Favorite Website 3:** `Alt+3` (Default, configurable)

Note: You can customize these shortcuts via `chrome://extensions/shortcuts`. Be mindful of potential conflicts with existing browser or system shortcuts. If a favorite shortcut (e.g., `Alt+1`) is triggered for a position where no website is configured, the configured URL is empty, or the URL is structurally invalid, the extension's options page will open.