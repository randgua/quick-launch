// Listen for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Retrieve the default URL from storage
  chrome.storage.sync.get(['defaultUrl'], function(result) {
    const defaultUrl = result.defaultUrl;

    if (defaultUrl) {
      // Open the default URL in a new tab
      chrome.tabs.create({ url: defaultUrl });
    } else {
      // If no default URL is set, open the options page
      chrome.runtime.openOptionsPage();
    }
  });
});

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  chrome.storage.sync.get(['websites'], function(result) {
    const websites = result.websites || [];
    let index = null;
    if (command === 'open_site_1') index = 0;
    else if (command === 'open_site_2') index = 1;
    else if (command === 'open_site_3') index = 2;
    else if (command === 'open_site_4') index = 3;
    else if (command === 'open_site_5') index = 4;
    
    if (index !== null && websites[index]) {
      chrome.tabs.create({ url: websites[index] });
    } else if (index !== null && !websites[index]) {
      // If the shortcut is used but the website is not set, open options page
      chrome.runtime.openOptionsPage();
    }
  });
});

// Set default websites on first install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    const defaultWebsites = [
      "https://aistudio.google.com",
      "https://www.notion.so",
      "https://www.bilibili.com"
    ];
    chrome.storage.sync.set({
      websites: defaultWebsites,
      defaultUrl: defaultWebsites.length > 0 ? defaultWebsites[0] : null // Set the first website as the default for icon click
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error initializing default websites:", chrome.runtime.lastError);
      } else {
        console.log("Default websites initialized.");
      }
    });
  }
});