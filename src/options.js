document.addEventListener('DOMContentLoaded', () => {
  const bulkUrlsInput = document.getElementById('bulk-urls-input');
  const bulkAddBtn = document.getElementById('bulk-add-btn');
  const websiteListDiv = document.getElementById('website-list');
  const statusDiv = document.getElementById('status');

  let websites = [];
  let draggedItem = null; // Stores the list item element being dragged

  const PREDEFINED_DEFAULT_WEBSITES = [
    { url: 'https://www.google.com', selected: true },
    { url: 'https://www.youtube.com', selected: true },
  ];

  loadWebsites();

  bulkAddBtn.addEventListener('click', handleBulkAdd);

  bulkUrlsInput.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleBulkAdd();
    }
  });

  /**
   * Loads websites from chrome.storage.sync.
   * Initializes with predefined defaults if storage is empty or data is invalid.
   * Ensures all websites have a unique ID.
   */
  function loadWebsites() {
    chrome.storage.sync.get({ websites: [] }, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading websites:", chrome.runtime.lastError.message);
        showStatus("Error loading websites: " + chrome.runtime.lastError.message, 'error');
        websites = [];
        renderWebsiteList();
        return;
      }
      websites = data.websites || [];
      if (!Array.isArray(websites) || websites.length === 0) {
        websites = PREDEFINED_DEFAULT_WEBSITES.map(site => ({
          id: crypto.randomUUID(),
          url: site.url,
          selected: site.selected !== undefined ? site.selected : true
        }));
        saveWebsites(() => {
          showStatus('Initialized with default websites.', 'info');
          renderWebsiteList();
        });
      } else {
        let idMigrationNeeded = false;
        websites = websites.map((site) => {
          if (!site.id) {
            idMigrationNeeded = true;
            return { ...site, id: crypto.randomUUID() };
          }
          return site;
        });
        if (idMigrationNeeded) {
          saveWebsites(() => {
            showStatus('Website IDs updated for compatibility.', 'info');
            renderWebsiteList();
          });
        } else {
          renderWebsiteList();
        }
      }
    });
  }

  /**
   * Saves the current 'websites' array to chrome.storage.sync.
   * @param {function} [callback] - Optional callback function to execute after saving.
   */
  function saveWebsites(callback) {
    chrome.storage.sync.set({ websites }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving websites:", chrome.runtime.lastError.message);
        showStatus("Error saving websites: " + chrome.runtime.lastError.message, 'error');
      }
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  /**
   * Renders the list of websites in the UI.
   */
  function renderWebsiteList() {
    websiteListDiv.innerHTML = '';

    if (!Array.isArray(websites) || websites.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.textContent = 'No websites added yet. Use "Bulk Add" to add websites.';
      emptyItem.style.textAlign = 'center';
      emptyItem.style.padding = '10px';
      emptyItem.style.color = '#666';
      websiteListDiv.appendChild(emptyItem);
      return;
    }

    websites.forEach((website) => {
      if (!website || typeof website.id === 'undefined') {
        console.warn("Website object is invalid or missing ID, skipping render:", website);
        return;
      }
      const listItem = createWebsiteListItem(website);
      websiteListDiv.appendChild(listItem);
    });
  }

  /**
   * Creates and returns a DOM element for a single website item in the list.
   * @param {Object} website - The website object containing id, url, and selected status.
   * @returns {HTMLElement} The list item element.
   */
  function createWebsiteListItem(website) {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';
    listItem.setAttribute('draggable', 'true');
    listItem.dataset.id = website.id;

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '☰';
    listItem.appendChild(dragHandle);

    const checkboxCell = document.createElement('div');
    checkboxCell.className = 'list-item-select-cell';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'website-checkbox';
    checkbox.checked = website.selected || false;
    checkbox.addEventListener('change', () => {
      website.selected = checkbox.checked;
      saveWebsites(() => showStatus('Selection updated.', 'success'));
    });
    checkboxCell.appendChild(checkbox);
    listItem.appendChild(checkboxCell);

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'website-url-input';
    urlInput.value = website.url;
    urlInput.placeholder = 'https://example.com, file:///path/to/file, or chrome-extension://id/page.html';
    listItem.appendChild(urlInput);

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container';

    const openLinkBtn = document.createElement('button');
    openLinkBtn.textContent = 'Open';
    openLinkBtn.className = 'open-link-btn';

    if (isValidUrl(website.url)) {
        openLinkBtn.disabled = false;
        openLinkBtn.title = `Open ${website.url} in new tab`;
    } else {
        openLinkBtn.disabled = true;
        openLinkBtn.title = 'Enter a valid URL to enable opening.';
    }
    openLinkBtn.addEventListener('click', () => {
        const urlToOpen = website.url;
        if (isValidUrl(urlToOpen)) {
            if (urlToOpen.startsWith('file:///')) {
                console.log("Attempting to open file URL. Ensure 'Allow access to file URLs' is enabled for this extension.");
            }
            chrome.tabs.create({ url: urlToOpen });
        } else {
            showStatus(`Cannot open: URL is invalid or empty.`, 'error');
        }
    });
    actionsContainer.appendChild(openLinkBtn);

    // Save URL on Cmd/Ctrl+Enter
    urlInput.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            let enteredValue = urlInput.value.trim();
            let newUrlToSave = '';

            if (enteredValue === '') { // If user clears the input
                if (website.url !== '') { // Only update if it actually changed
                    website.url = '';
                    saveWebsites(() => {
                        showStatus('URL cleared. Press Remove or enter a valid URL.', 'info');
                        openLinkBtn.disabled = true;
                        openLinkBtn.title = 'Enter a valid URL to enable opening.';
                    });
                }
                return; // Exit after clearing
            }

            newUrlToSave = formatUrl(enteredValue); // Apply formatting like prepending https://

            if (newUrlToSave && isValidUrl(newUrlToSave)) { // Validate the formatted URL
                const isDuplicate = websites.some(site => site.id !== website.id && site.url === newUrlToSave);
                if (isDuplicate) {
                    showStatus(`URL "${newUrlToSave}" already exists in your list. Please use a unique URL.`, 'error');
                    return;
                }

                if (website.url !== newUrlToSave) { // Only update if it actually changed
                    website.url = newUrlToSave;
                    urlInput.value = newUrlToSave; // Update input field with the potentially formatted URL
                    saveWebsites(() => {
                        showStatus('URL updated successfully.', 'success');
                        openLinkBtn.disabled = false;
                        openLinkBtn.title = `Open ${newUrlToSave} in new tab`;
                    });
                } else {
                    showStatus('URL is unchanged.', 'info'); // If formatting resulted in the same URL
                }
            } else {
                showStatus('Invalid URL. Please enter a valid URL (e.g., example.com, http://example.com, file:///path). It must use http, https, chrome-extension, or file protocols.', 'error');
            }
        }
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to remove "${website.url || 'this empty entry'}"?`)) {
        removeWebsite(website.id);
      }
    });
    actionsContainer.appendChild(removeBtn);
    listItem.appendChild(actionsContainer);

    listItem.addEventListener('dragstart', handleDragStart);
    listItem.addEventListener('dragover', handleDragOver);
    listItem.addEventListener('drop', handleDrop);
    listItem.addEventListener('dragend', handleDragEnd);
    listItem.addEventListener('dragleave', handleDragLeave);

    return listItem;
  }

  /**
   * Validates if a string is a valid HTTP, HTTPS, chrome-extension or file URL.
   * @param {string} string - The string to validate.
   * @returns {boolean} True if valid, false otherwise.
   */
  function isValidUrl(string) {
    if (!string) return false;
    try {
      const url = new URL(string);
      return ["http:", "https:", "chrome-extension:", "file:"].includes(url.protocol);
    } catch (_) {
      return false;
    }
  }

  /**
   * Formats a URL string: trims whitespace, adds 'https://' as a default protocol if none is present
   * and it's not a 'chrome-extension://' or 'file://' URL. Validates structure.
   * @param {string} urlStr - The URL string to format.
   * @returns {string|null} The formatted URL, or null if invalid after formatting.
   */
  function formatUrl(urlStr) {
    let trimmedUrl = urlStr.trim();
    if (!trimmedUrl) return null;

    // Add https:// if no protocol is specified, unless it's a special chrome or file URL
    if (!trimmedUrl.startsWith('http://') &&
        !trimmedUrl.startsWith('https://') &&
        !trimmedUrl.startsWith('chrome-extension://') &&
        !trimmedUrl.startsWith('file://')) {
      trimmedUrl = 'https://' + trimmedUrl;
    }

    try {
      new URL(trimmedUrl); // This will throw an error if the structure is invalid
      return trimmedUrl;
    } catch (e) {
      return null; // Return null if the URL is structurally invalid after formatting
    }
  }

  /**
   * Handles bulk addition of websites. Parses URLs, formats, validates, and adds new ones.
   */
  function handleBulkAdd() {
    const urlsText = bulkUrlsInput.value.trim();
    if (!urlsText) {
      showStatus('Bulk add input is empty.', 'info');
      return;
    }

    const urlEntries = urlsText.split(/[\n,\s]+/).map(u => u.trim()).filter(Boolean);
    const newWebsitesBatch = [];
    let addedCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    urlEntries.forEach(entryUrl => {
      const fullUrl = formatUrl(entryUrl); // Format URL (e.g., add https://)
      if (!fullUrl || !isValidUrl(fullUrl)) { // Validate the formatted URL
        invalidCount++;
        return;
      }
      // Check for duplicates in existing websites or within the current batch
      if (websites.some(site => site.url === fullUrl) || newWebsitesBatch.some(site => site.url === fullUrl)) {
        duplicateCount++;
        return;
      }
      newWebsitesBatch.push({
        id: crypto.randomUUID(),
        url: fullUrl,
        selected: true, // Default new sites to selected
      });
      addedCount++;
    });

    if (newWebsitesBatch.length > 0) {
      websites = [...newWebsitesBatch, ...websites]; // Add new sites to the beginning of the list for visibility
      saveWebsites(() => {
        renderWebsiteList();
        let message = `${addedCount} website(s) added.`;
        if (duplicateCount > 0) message += ` ${duplicateCount} duplicate(s) skipped.`;
        if (invalidCount > 0) message += ` ${invalidCount} invalid entry(ies) skipped.`;
        if (newWebsitesBatch.some(site => site.url.startsWith('file:///'))) {
             message += ' For file:/// URLs to open, ensure "Allow access to file URLs" is enabled for this extension.';
        }
        showStatus(message, 'success');
      });
    } else {
        let message = 'No new websites were added.';
        if (duplicateCount > 0) message += ` ${duplicateCount} duplicate(s) found.`;
        if (invalidCount > 0) message += ` ${invalidCount} invalid entry(ies) found.`;
        showStatus(message, 'info');
    }
    bulkUrlsInput.value = ''; // Clear the input field
  }

  /**
   * Removes a website from the list by its ID.
   * @param {string} id - The ID of the website to remove.
   */
  function removeWebsite(id) {
    const initialCount = websites.length;
    websites = websites.filter(website => website.id !== id);
    if (websites.length < initialCount) { // Check if a website was actually removed
      saveWebsites(() => {
        renderWebsiteList();
        showStatus('Website removed.', 'success');
      });
    } else {
      // This case should ideally not be reached if IDs are managed correctly
      showStatus('Could not find website to remove.', 'error');
    }
  }

  /**
   * Displays a status message to the user.
   * @param {string} message - The message to display.
   * @param {string} type - The type of message: 'success', 'error', or 'info'.
   */
  function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type; // Apply styling based on type
    statusDiv.style.display = 'block';

    // Hide the message after a delay. Longer for errors or messages containing file URL info.
    setTimeout(() => {
      statusDiv.style.display = 'none';
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, type === 'error' || message.includes("file:///") ? 6000 : 4000);
  }

  // --- Drag and Drop Handlers ---
  function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging-item'); // Apply visual style for dragging
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id); // Set website ID for transfer
  }

  function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    const targetItem = e.target.closest('.list-item');
    if (targetItem && targetItem !== draggedItem) {
        // Remove from others and add to current target for visual feedback
        Array.from(websiteListDiv.children).forEach(item => item.classList.remove('drag-over-item'));
        targetItem.classList.add('drag-over-item');
    }
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragLeave(e) {
    const relatedTarget = e.relatedTarget;
    // Remove 'drag-over-item' style only if leaving the item boundaries entirely
    // or moving to another list item child that isn't the item itself.
    if (!this.contains(relatedTarget) || (relatedTarget && !relatedTarget.closest('.list-item'))) {
        this.classList.remove('drag-over-item');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation(); // Stop event from bubbling up

    const targetItem = this; // 'this' is the drop target element
    targetItem.classList.remove('drag-over-item');

    if (draggedItem && draggedItem !== targetItem) {
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = targetItem.dataset.id;

      const fromIndex = websites.findIndex(site => site.id === draggedId);
      const toIndex = websites.findIndex(site => site.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const [movedItem] = websites.splice(fromIndex, 1); // Remove item from original position
        websites.splice(toIndex, 0, movedItem); // Insert item at new position

        saveWebsites(() => {
          renderWebsiteList(); // Re-render the list to reflect the new order
          showStatus('Websites reordered.', 'success');
        });
      } else {
        console.warn("Drag/drop error: Could not find dragged or target item in websites array.");
        renderWebsiteList(); // Re-render to reset any visual glitches
      }
    }
  }

  function handleDragEnd() {
    if (draggedItem) {
        draggedItem.classList.remove('dragging-item');
    }
    // Clean up any remaining drag-over styles from all items
    Array.from(websiteListDiv.children).forEach(item => {
        item.classList.remove('drag-over-item');
    });
    draggedItem = null; // Reset the dragged item reference
  }
});