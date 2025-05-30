// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  const newUrlInput = document.getElementById('new-url');
  const addBtn = document.getElementById('add-btn');
  const websiteListUl = document.getElementById('website-list');
  const statusDiv = document.getElementById('status');

  let websites = [];
  let draggedItem = null;

  // Default websites to load if storage is empty
  const PREDEFINED_DEFAULT_WEBSITES = [
    { url: 'https://www.google.com', selected: true },
    { url: 'https://www.youtube.com', selected: true },
  ];

  // Load websites from storage when the options page opens
  loadWebsites();

  // --- Event Listeners ---
  addBtn.addEventListener('click', addWebsite);
  newUrlInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      addWebsite();
    }
  });

  // --- Core Functions ---

  /**
   * Loads websites from chrome.storage.sync.
   * If storage is empty, it populates with PREDEFINED_DEFAULT_WEBSITES.
   */
  function loadWebsites() {
    chrome.storage.sync.get({ websites: [] }, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading websites:", chrome.runtime.lastError.message);
        websites = [];
        renderWebsiteList();
        return;
      }
      websites = data.websites || [];
      if (!Array.isArray(websites) || websites.length === 0) {
        // Initialize with predefined defaults if storage is empty or invalid
        websites = PREDEFINED_DEFAULT_WEBSITES.map((site, idx) => ({
          id: crypto.randomUUID(),
          url: site.url,
          selected: site.selected !== undefined ? site.selected : true
        }));
        chrome.storage.sync.set({ websites }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error setting default websites:", chrome.runtime.lastError.message);
          }
          renderWebsiteList();
        });
      } else {
        // Ensure all websites have an ID for backward compatibility
        let changed = false;
        websites = websites.map((site) => {
          if (!site.id) {
            changed = true;
            return { ...site, id: crypto.randomUUID() };
          }
          return site;
        });
        if (changed) {
          chrome.storage.sync.set({ websites }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error saving websites after ID migration:", chrome.runtime.lastError.message);
            }
            renderWebsiteList();
          });
        } else {
          renderWebsiteList();
        }
      }
    });
  }

  /**
   * Saves the current websites array to chrome.storage.sync.
   */
  function saveWebsites() {
    chrome.storage.sync.set({ websites }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving websites:", chrome.runtime.lastError.message);
      }
    });
  }

  /**
   * Renders the list of websites in the UI.
   * Clears the current list and rebuilds it based on the 'websites' array.
   */
  function renderWebsiteList() {
    websiteListUl.innerHTML = '';

    if (!Array.isArray(websites) || websites.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.textContent = 'No websites added yet.';
      emptyLi.style.textAlign = 'center';
      emptyLi.style.width = '100%';
      emptyLi.style.display = 'block';
      emptyLi.style.cursor = 'default';
      websiteListUl.appendChild(emptyLi);
      return;
    }

    websites.forEach((website) => {
      if (!website || typeof website.id === 'undefined') {
        console.warn("Website object is invalid or missing ID, skipping:", website);
        return;
      }

      const listItem = document.createElement('li');
      listItem.setAttribute('draggable', 'true');
      listItem.dataset.id = website.id;

      const dragHandle = document.createElement('span');
      dragHandle.className = 'drag-handle';
      dragHandle.textContent = '☰'; // Unicode for drag handle
      listItem.appendChild(dragHandle);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = website.selected || false;
      checkbox.addEventListener('change', () => {
        const siteToUpdate = websites.find(site => site.id === website.id);
        if (siteToUpdate) {
            siteToUpdate.selected = checkbox.checked;
            saveWebsites();
            showStatus(`Website selection updated.`, 'green');
        }
      });
      listItem.appendChild(checkbox);

      const urlLink = document.createElement('a');
      urlLink.href = website.url;
      urlLink.textContent = website.url;
      urlLink.target = '_blank';
      urlLink.className = 'url-text';
      listItem.appendChild(urlLink);

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'remove-btn';
      removeBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to remove "${website.url}"?`)) {
          removeWebsite(website.id);
        }
      });
      listItem.appendChild(removeBtn);

      // Attach drag-and-drop event listeners
      listItem.addEventListener('dragstart', handleDragStart);
      listItem.addEventListener('dragover', handleDragOver);
      listItem.addEventListener('drop', handleDrop);
      listItem.addEventListener('dragend', handleDragEnd);
      listItem.addEventListener('dragleave', handleDragLeave);

      websiteListUl.appendChild(listItem);
    });
  }

  /**
   * Adds new website(s) to the list. Supports comma or space separated multiple URLs.
   * URLs are prefixed with 'https://' if no protocol is provided.
   * New websites are added to the top of the list, maintaining the order from the input.
   * e.g., if input is "url1.com, url2.com", url1.com will be at the top, followed by url2.com.
   */
  function addWebsite() {
    let input = newUrlInput.value.trim();
    if (!input) {
      showStatus('Please enter a URL.', 'red');
      return;
    }

    const urlList = input.split(/[,\s]+/).map(url => url.trim()).filter(Boolean);
    let duplicateCount = 0;
    const newWebsitesBatch = [];

    urlList.forEach(url => {
      let fullUrl = url;
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = 'https://' + fullUrl;
      }

      // Check for duplicates in existing websites array and in the current batch
      if (websites.some(site => site.url === fullUrl) || newWebsitesBatch.some(site => site.url === fullUrl)) {
        duplicateCount++;
        return;
      }

      const newWebsite = {
        id: crypto.randomUUID(),
        url: fullUrl,
        selected: true,
      };
      newWebsitesBatch.push(newWebsite);
    });

    if (newWebsitesBatch.length > 0) {
      websites = [...newWebsitesBatch, ...websites];
      saveWebsites();
      renderWebsiteList();
      showStatus(`${newWebsitesBatch.length} website(s) added successfully to the top!`, 'green');
    } else if (duplicateCount > 0 && urlList.length === duplicateCount) {
      showStatus('All entered URLs are already in the list or were duplicates within the input.', 'orange');
    } else if (duplicateCount > 0) {
        // This case handles partial success: some duplicates, some new ones (if any new ones were added, the above block handles it)
        // If newWebsitesBatch.length is 0 but duplicateCount > 0 and urlList.length > duplicateCount, it means non-duplicate items were invalid
        // For simplicity, if newWebsitesBatch is empty but there were duplicates, this message is fine.
        showStatus(`${duplicateCount} URL(s) were duplicates and not added.`, 'orange');
    }
    // If newWebsitesBatch.length is 0 and duplicateCount is 0, but urlList was not empty, it means input was invalid (e.g. just spaces after split)
    // This case is implicitly handled as no message is shown if no websites are added and no duplicates found.

    newUrlInput.value = '';
  }

  /**
   * Removes a website from the list by its unique ID.
   * @param {string} id - The unique ID (UUID string) of the website to remove.
   */
  function removeWebsite(id) {
    if (typeof id !== 'string' || id.trim() === '') {
        console.error("Invalid ID passed to removeWebsite:", id);
        showStatus("Error: Could not remove website due to invalid ID.", "red");
        return;
    }
    const initialCount = websites.length;
    websites = websites.filter(website => website && website.id !== id);

    if (websites.length < initialCount) {
        saveWebsites();
        renderWebsiteList();
        showStatus('Website removed.', 'green');
    } else {
        // This case should ideally not happen if IDs are managed correctly
        console.warn(`Website with ID "${id}" not found for removal.`);
        renderWebsiteList(); // Re-render to ensure UI consistency
    }
  }

  /**
   * Shows a status message to the user for a short duration.
   * @param {string} message - The message to display.
   * @param {string} color - The CSS color for the message (e.g., 'green', 'red', 'orange').
   */
  function showStatus(message, color = 'green') {
    statusDiv.textContent = message;
    statusDiv.style.color = color;
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 3000);
  }

  // --- Drag and Drop Handlers ---
  function handleDragStart(e) {
    draggedItem = this; // 'this' refers to the li element being dragged
    this.classList.add('dragging-item');
    e.dataTransfer.effectAllowed = 'move';
    // Use the website's unique ID for data transfer
    e.dataTransfer.setData('text/plain', this.dataset.id);
  }

  function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    if (this !== draggedItem) { // 'this' is the potential drop target
        this.classList.add('drag-over-item');
    }
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over-item');
  }

  function handleDrop(e) {
    e.stopPropagation(); // Prevent event from bubbling up
    this.classList.remove('drag-over-item');

    if (draggedItem !== this) {
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = this.dataset.id; // 'this' is the drop target li

      const fromIndex = websites.findIndex(site => site.id === draggedId);
      const toIndex = websites.findIndex(site => site.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1) {
        // Reorder the websites array
        const [reorderedItem] = websites.splice(fromIndex, 1);
        websites.splice(toIndex, 0, reorderedItem);

        saveWebsites();
        renderWebsiteList();
        showStatus('Websites reordered successfully.', 'green');
      } else {
        console.warn("Could not find dragged or target item in websites array during drop.");
      }
    }
  }

  function handleDragEnd(e) {
    // Clean up styles from all items
    Array.from(websiteListUl.children).forEach(item => {
        item.classList.remove('dragging-item');
        item.classList.remove('drag-over-item');
    });
    draggedItem = null;
  }
});

