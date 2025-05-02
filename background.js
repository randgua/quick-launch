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