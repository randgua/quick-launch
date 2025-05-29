// Default websites if none are set yet
// const initialWebsites = [
//   { url: 'https://www.google.com', isQuickLaunch: true },
//   { url: 'https://www.youtube.com', isQuickLaunch: true },
//   { url: 'https://www.facebook.com', isQuickLaunch: true },
//   { url: 'https://www.instagram.com', isQuickLaunch: true },
//   { url: 'https://www.x.com', isQuickLaunch: true },
// ];

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.sync.get('websites', (data) => {
//     if (!data.websites || data.websites.length === 0) {
//       chrome.storage.sync.set({ websites: initialWebsites }, () => {
//         console.log('Quick Launch: Initialized with default websites.');
//       });
//     }
//   });
// });

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

function openSelectedWebsites() {
  chrome.storage.sync.get('websites', (data) => {
    if (chrome.runtime.lastError) {
      console.error(`Error retrieving websites: ${chrome.runtime.lastError.message}`);
      return;
    }
    let websites = data.websites || [];
    // If empty, auto-initialize with default websites
    if (!Array.isArray(websites) || websites.length === 0) {
      websites = [
        { id: '1', url: 'https://www.google.com', selected: true },
        { id: '2', url: 'https://www.youtube.com', selected: true }
      ];
      chrome.storage.sync.set({ websites }, () => {
        // Call again to ensure opening after initialization
        openSelectedWebsites();
      });
      return;
    }
    const sitesToOpen = websites.filter(site => site.selected === true && site.url);
    if (sitesToOpen.length === 0) {
      console.log('Quick Launch: No websites selected for quick launch.');
      return;
    }
    sitesToOpen.forEach(site => {
      if (isValidUrl(site.url)) {
        chrome.tabs.create({ url: site.url });
      } else {
        console.warn(`Quick Launch: Invalid URL skipped: ${site.url}`);
      }
    });
  });
}

function openFavoriteSite(index) {
  chrome.storage.sync.get('websites', (data) => {
    if (chrome.runtime.lastError) {
      console.error(`Error retrieving websites: ${chrome.runtime.lastError.message}`);
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
      console.log(`Quick Launch: No favorite website configured at index ${index}.`);
      // Optionally, open options page or notify user
      // chrome.runtime.openOptionsPage();
    }
  });
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}