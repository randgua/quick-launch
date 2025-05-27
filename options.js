const websiteListElement = document.getElementById('website-list');
const newUrlInput = document.getElementById('new-url');
const addBtn = document.getElementById('add-btn');
const statusElement = document.getElementById('status');

// --- Utility Functions ---

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function showStatus(message, duration = 2000) {
    statusElement.textContent = message;
    setTimeout(() => {
        statusElement.textContent = '';
    }, duration);
}

// --- Storage Functions ---

function getStoredData(callback) {
    chrome.storage.sync.get({ websites: [], defaultUrl: null }, (data) => {
        callback(data.websites || [], data.defaultUrl);
    });
}

function storeData(websites, defaultUrl, callback) {
    chrome.storage.sync.set({ websites: websites, defaultUrl: defaultUrl }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving data:", chrome.runtime.lastError);
            showStatus("Error saving settings!");
        } else {
            showStatus("Settings saved.");
            if (callback) callback();
        }
    });
}

// --- UI Rendering --- 

function renderList(websites = [], defaultUrl = null) {
    websiteListElement.innerHTML = ''; // Clear existing list

    if (websites.length === 0) {
        websiteListElement.innerHTML = '<li>No websites added yet.</li>';
        return;
    }

    websites.forEach((url, index) => {
        const listItem = document.createElement('li');

        const radioBtn = document.createElement('input');
        radioBtn.type = 'radio';
        radioBtn.name = 'defaultUrl';
        radioBtn.value = url;
        radioBtn.checked = (url === defaultUrl);
        radioBtn.addEventListener('change', () => {
            setDefaultUrl(url);
        });

        const urlSpan = document.createElement('span');
        urlSpan.textContent = url;

        const upBtn = document.createElement('button');
        upBtn.textContent = '↑';
        upBtn.title = 'Move up';
        upBtn.disabled = index === 0;
        upBtn.addEventListener('click', () => {
            moveWebsite(index, -1);
        });

        const downBtn = document.createElement('button');
        downBtn.textContent = '↓';
        downBtn.title = 'Move down';
        downBtn.disabled = index === websites.length - 1;
        downBtn.addEventListener('click', () => {
            moveWebsite(index, 1);
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('remove-btn');
        removeBtn.dataset.index = index; // Store index for removal
        removeBtn.addEventListener('click', () => {
            removeWebsite(index);
        });

        listItem.appendChild(radioBtn);
        listItem.appendChild(urlSpan);
        listItem.appendChild(upBtn);
        listItem.appendChild(downBtn);
        listItem.appendChild(removeBtn);
        websiteListElement.appendChild(listItem);
    });
}

// --- Event Handlers & Actions ---

function addWebsite() {
    const newUrl = newUrlInput.value.trim();
    if (!newUrl) {
        showStatus("Please enter a URL.");
        return;
    }
    if (!isValidUrl(newUrl)) {
        showStatus("Please enter a valid URL (e.g., https://example.com).");
        return;
    }

    getStoredData((websites, defaultUrl) => {
        if (websites.includes(newUrl)) {
            showStatus("This website is already in the list.");
            return;
        }
        const updatedWebsites = [...websites, newUrl];
        // If it's the first website added, make it the default
        const newDefaultUrl = websites.length === 0 ? newUrl : defaultUrl;
        storeData(updatedWebsites, newDefaultUrl, () => {
            renderList(updatedWebsites, newDefaultUrl);
            newUrlInput.value = ''; // Clear input field
        });
    });
}

function removeWebsite(indexToRemove) {
    getStoredData((websites, defaultUrl) => {
        const urlToRemove = websites[indexToRemove];
        const updatedWebsites = websites.filter((_, index) => index !== indexToRemove);
        let newDefaultUrl = defaultUrl;

        // If the removed website was the default, clear the default
        // or set it to the first item if list is not empty
        if (urlToRemove === defaultUrl) {
            newDefaultUrl = updatedWebsites.length > 0 ? updatedWebsites[0] : null;
        }

        storeData(updatedWebsites, newDefaultUrl, () => {
            renderList(updatedWebsites, newDefaultUrl);
        });
    });
}

function setDefaultUrl(url) {
    getStoredData((websites, _) => {
        storeData(websites, url, () => {
            // Re-render to potentially update radio buttons if needed, although direct change handles it.
            // renderList(websites, url); 
        });
    });
}

// 新增：移动网址排序
function moveWebsite(index, direction) {
    getStoredData((websites, defaultUrl) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= websites.length) return;
        const newWebsites = [...websites];
        const [moved] = newWebsites.splice(index, 1);
        newWebsites.splice(newIndex, 0, moved);
        storeData(newWebsites, defaultUrl, () => {
            renderList(newWebsites, defaultUrl);
        });
    });
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    getStoredData((websites, defaultUrl) => {
        renderList(websites, defaultUrl);
    });

    addBtn.addEventListener('click', addWebsite);

    // Allow adding website by pressing Enter in the input field
    newUrlInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addWebsite();
        }
    });
}); 