// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    const newUrlInput = document.getElementById('new-url');
    const addBtn = document.getElementById('add-btn');
    const websiteListUl = document.getElementById('website-list');
    const statusDiv = document.getElementById('status');
  
    let websites = []; // Stores the list of website objects
    let draggedItem = null; // Stores the DOM element being dragged
  
    // Define your predefined default websites here
    // These will be loaded if the storage is empty
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
          console.error("lastError:", chrome.runtime.lastError);
          websites = [];
          renderWebsiteList();
          return;
        }
        websites = data.websites || [];
        if (!Array.isArray(websites) || websites.length === 0) {
          websites = PREDEFINED_DEFAULT_WEBSITES.map((site, idx) => ({
            id: (idx + 1).toString(),
            url: site.url,
            selected: site.selected !== undefined ? site.selected : true
          }));
          chrome.storage.sync.set({ websites }, () => {
            renderWebsiteList();
          });
        } else {
          // 自动补全老数据无id的情况
          let changed = false;
          websites = websites.map((site, idx) => {
            if (!site.id) {
              changed = true;
              return { ...site, id: (idx + 1).toString() };
            }
            return site;
          });
          if (changed) {
            chrome.storage.sync.set({ websites }, () => {
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
      websiteListUl.innerHTML = ''; // Clear the current list before re-rendering
  
      if (!Array.isArray(websites) || websites.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.textContent = 'No websites added yet.';
        emptyLi.style.textAlign = 'center';
        emptyLi.style.width = '100%';
        emptyLi.style.display = 'block';
        websiteListUl.appendChild(emptyLi);
        return;
      }
  
      websites.forEach((website) => { // Removed 'index' as it's safer to use findIndex later
        if (!website || typeof website.id === 'undefined') {
          console.warn("Website object is invalid or missing ID, skipping:", website);
          return;
        }
  
        const listItem = document.createElement('li');
        listItem.setAttribute('draggable', 'true');
        listItem.dataset.id = website.id;
  
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '☰';
        listItem.appendChild(dragHandle);
  
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = website.selected || false;
        checkbox.addEventListener('change', () => {
          const currentIndex = websites.findIndex(site => site.id === website.id);
          if (currentIndex !== -1) {
              websites[currentIndex].selected = checkbox.checked;
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
  
        listItem.addEventListener('dragstart', handleDragStart);
        listItem.addEventListener('dragover', handleDragOver);
        listItem.addEventListener('drop', handleDrop);
        listItem.addEventListener('dragend', handleDragEnd);
        listItem.addEventListener('dragleave', handleDragLeave);
  
        websiteListUl.appendChild(listItem);
      });
    }
  
    /**
     * Adds a new website to the list.
     */
    function addWebsite() {
      let input = newUrlInput.value.trim();
      if (!input) {
        showStatus('Please enter a URL.', 'red');
        return;
      }

      // 支持逗号、空格分割，批量添加
      const urlList = input.split(/[,\s]+/).map(url => url.trim()).filter(Boolean);
      let added = 0, duplicated = 0;
      urlList.forEach(url => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        if (websites.some(site => site.url === url)) {
          duplicated++;
          return;
        }
        const newWebsite = {
          id: crypto.randomUUID(),
          url: url,
          selected: true,
        };
        websites.push(newWebsite);
        added++;
      });
      if (added > 0) {
        saveWebsites();
        renderWebsiteList();
        showStatus(`${added} website(s) added successfully!`, 'green');
      } else if (duplicated > 0) {
        showStatus('All URLs are already in the list.', 'orange');
      }
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
          console.warn(`Website with ID "${id}" not found for removal.`);
          renderWebsiteList(); 
      }
    }
  
    /**
     * Shows a status message to the user.
     * @param {string} message - The message to display.
     * @param {string} color - The CSS color for the message (e.g., 'green', 'red').
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
      draggedItem = this;
      this.classList.add('dragging-item');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.dataset.id);
    }
  
    function handleDragOver(e) {
      e.preventDefault();
      this.classList.add('drag-over-item');
      e.dataTransfer.dropEffect = 'move';
    }
  
    function handleDragLeave(e) {
      this.classList.remove('drag-over-item');
    }
  
    function handleDrop(e) {
      e.stopPropagation();
      this.classList.remove('drag-over-item');
  
      if (draggedItem !== this) {
        const allItems = Array.from(websiteListUl.children);
        const fromIndex = allItems.indexOf(draggedItem);
        const toIndex = allItems.indexOf(this);
  
        if (fromIndex !== -1 && toIndex !== -1) {
          const [reorderedItem] = websites.splice(fromIndex, 1);
          websites.splice(toIndex, 0, reorderedItem);
          saveWebsites();
          renderWebsiteList();
        }
      }
    }
  
    function handleDragEnd(e) {
      this.classList.remove('dragging-item');
      Array.from(websiteListUl.children).forEach(item => {
          item.classList.remove('drag-over-item');
      });
      draggedItem = null;
    }
  });