chrome.action.onClicked.addListener(openSelectedWebsites);

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command received: ${command}`);
  if (command === '_execute_action') {
    openSelectedWebsites();
  } else if (command === 'open_favorite_site_1') {
    openFavoriteSite(0); // 0-indexed for array access
  } else if (command === 'open_favorite_site_2') {
    openFavoriteSite(1); // 0-indexed for array access
  } else if (command === 'open_favorite_site_3') {
    openFavoriteSite(2); // 0-indexed for array access
  }
});

/**
 * Opens websites that are marked as 'selected'.
 * If no websites are stored, it initializes with default websites (e.g., Google, YouTube) and then opens them.
 * If websites are stored but none are selected, it opens the extension's options page.
 */
function openSelectedWebsites() {
  chrome.storage.sync.get('websites', (data) => {
    if (chrome.runtime.lastError) {
      console.error(`Error retrieving websites: ${chrome.runtime.lastError.message}`);
      return;
    }
    let websites = data.websites || [];

    // If storage is empty or not an array, initialize with default websites.
    if (!Array.isArray(websites) || websites.length === 0) {
      const defaultWebsites = [
        { id: crypto.randomUUID(), url: 'https://www.google.com', selected: true },
        { id: crypto.randomUUID(), url: 'https://www.youtube.com', selected: true }
      ];
      chrome.storage.sync.set({ websites: defaultWebsites }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error setting default websites: ${chrome.runtime.lastError.message}`);
          return;
        }
        console.log('Quick Launch: Initialized with default websites.');
        // Proceed to open the newly initialized default websites
        processAndOpenSites(defaultWebsites);
      });
      return; // Exit after initiating default setup
    }

    // Proceed with the existing list of websites
    processAndOpenSites(websites);
  });
}

/**
 * Filters the provided list of websites and opens the selected ones.
 * If no sites are selected, it opens the options page.
 * Structurally invalid URLs among selected sites will be skipped.
 * @param {Array<Object>} sitesToProcess - The array of website objects to process.
 */
function processAndOpenSites(sitesToProcess) {
  const sitesToOpen = sitesToProcess.filter(site => site.selected === true && site.url);

  if (sitesToOpen.length === 0) {
    console.log('Quick Launch: No websites selected for quick launch. Opening options page.');
    // Open options page to guide user for setup
    chrome.runtime.openOptionsPage();
    return;
  }

  sitesToOpen.forEach(site => {
    if (isValidUrl(site.url)) {
      chrome.tabs.create({ url: site.url });
    } else {
      console.warn(`Quick Launch: Invalid URL skipped: ${site.url}`);
    }
  });
}

/**
 * Opens a favorite website based on its 0-based index in the stored list.
 * If the site at the given index is not configured, does not exist, has an empty or structurally invalid URL,
 * it opens the extension's options page. This function uses a general structural URL validation.
 * @param {number} index - The 0-based index of the favorite site to open.
 */
function openFavoriteSite(index) {
  chrome.storage.sync.get('websites', (data) => {
    if (chrome.runtime.lastError) {
      console.error(`Error retrieving websites for favorite site: ${chrome.runtime.lastError.message}`);
      return;
    }
    const websites = data.websites || [];
    if (websites.length > index && websites[index] && websites[index].url) {
      if (isValidUrl(websites[index].url)) {
        chrome.tabs.create({ url: websites[index].url });
      } else {
        console.warn(`Quick Launch: Invalid URL for favorite site at index ${index}: ${websites[index].url}. Opening options page.`);
        chrome.runtime.openOptionsPage(); // Open options if URL is invalid
      }
    } else {
      console.log(`Quick Launch: No favorite website configured at index ${index}. Opening options page.`);
      chrome.runtime.openOptionsPage();
    }
  });
}

/**
 * Validates if a given string can be parsed as a URL using the `new URL()` constructor.
 * This is a general URL validator and does not restrict to specific protocols (e.g., http, https, ftp).
 * @param {string} string - The string to validate.
 * @returns {boolean} True if the string is a valid URL, false otherwise.
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}