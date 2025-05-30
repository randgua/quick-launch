// Listen for the extension icon click
chrome.action.onClicked.addListener(openSelectedWebsites);

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  console.log(`Command received: ${command}`);
  if (command === '_execute_action') {
    openSelectedWebsites();
  } else if (command === 'open_favorite_site_1') {
    openFavoriteSite(0); // 0-indexed
  } else if (command === 'open_favorite_site_2') {
    openFavoriteSite(1); // 0-indexed
  } else if (command === 'open_favorite_site_3') {
    openFavoriteSite(2); // 0-indexed
  }
});

/**
 * Opens websites that are marked as 'selected'.
 * If no websites are stored, it initializes with default websites and then opens them.
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
 * Opens a favorite website based on its index in the stored list.
 * If the site is not configured, it can optionally open the options page.
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
        console.warn(`Quick Launch: Invalid URL for favorite site at index ${index}: ${websites[index].url}`);
      }
    } else {
      console.log(`Quick Launch: No favorite website configured at index ${index}. Opening options page.`);
      // Optionally, open options page or notify user
      chrome.runtime.openOptionsPage();
    }
  });
}

/**
 * Validates if a given string is a valid URL.
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