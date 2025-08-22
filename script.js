const MAX_CAPACITY = 18;
const MAX_CHILDREN = 9; // Max children, not total with adults
let isReadonly = false;

// Configuration object for course selections
const courseConfig = {
    soups: {
        maxSelections: 2,
        allowMultiple: true,
        displayName: 'Soups',
        required: true
    },
    starters: {
        maxSelections: 2, // This will be updated by courseCountChange
        allowMultiple: true,
        displayName: 'Starters',
        required: true
    },
    mains: {
        maxSelections: 2, // Can be 1 or 2 for sharing
        allowMultiple: true,
        displayName: 'Main Courses',
        required: true
    },
    desserts: {
        maxSelections: 3,
        allowMultiple: true,
        displayName: 'Desserts',
        required: true
    },
    addons: {
        maxSelections: 99, // Effectively unlimited for practical purposes
        allowMultiple: true,
        displayName: 'Add-ons',
        required: false // Users can select zero add-ons
    }
};

// Initialize selectedItems based on configuration
const selectedItems = Object.keys(courseConfig).reduce((acc, category) => {
    acc[category] = courseConfig[category].allowMultiple ? [] : null;
    return acc;
}, {});

// Menu prices configuration
const menuPrices = {
    4: 448,
    5: 580,
    6: 638,
    7: 688,
    8: 728
};

// Define course count availability
let courseCountAvailability = {
    4: { label: '4 Course Lunch Menu - 1 starter ($448)', meals: ['lunch'], isDefault: true, starterCount: 1 },
    5: { label: '5 Course Menu - 2 starters ($580)', meals: ['both'], isDefault: false, starterCount: 2 },
    6: { label: '6 Course Menu - 3 starters ($638)', meals: ['both'], isDefault: true, starterCount: 3 },
    7: { label: '7 Course Menu - 4 starters ($688)', meals: ['both'], isDefault: false, starterCount: 4 },
    8: { label: '8 Course Menu - 5 starters ($728)', meals: ['both'], isDefault: false, starterCount: 5 }
};

// Track current menu price
let currentMenuPrice = 0;
// Track current serving style
let currentServingStyle = 'individual';
// Initialize item quantities object
const itemQuantities = {};


async function fetchMenuData() {
    try {
        const PUBLISHED_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQp_lmQ3G1BBHVC5Lotsbtid6IO9kA83VGmKeI2e_Q31_LXtsFM8v2ZyvloRxo7FMixbu46ofyPq9JF/pub?gid=0&single=true&output=csv';
        const timestamp = new Date().getTime();
        const urlWithCacheBust = `${PUBLISHED_CSV_URL}&_=${timestamp}`;
        console.log('Fetching menu data...');

        const proxyServices = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy?quest='
        ];

        let csvText = null;

        for (const proxy of proxyServices) {
            try {
                const proxyUrl = proxy + encodeURIComponent(urlWithCacheBust);
                console.log(`Trying proxy: ${proxy}`);
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for proxy ${proxy}`);
                const text = await response.text();
                if (!text || text.trim() === '') throw new Error(`Empty response received from proxy ${proxy}`);
                csvText = text;
                console.log('Successfully fetched CSV data through proxy');
                break; 
            } catch (error) {
                console.log(`Failed with proxy ${proxy}:`, error.message);
            }
        }

        if (!csvText) {
            try {
                console.log('Trying direct fetch as last resort...');
                const response = await fetch(urlWithCacheBust);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for direct fetch`);
                const text = await response.text();
                if (!text || text.trim() === '') throw new Error('Empty response received from direct fetch');
                csvText = text;
                console.log('Successfully fetched CSV data directly');
            } catch (error) {
                console.log('Direct fetch failed:', error.message);
                throw new Error('All fetch attempts failed. Please check your network or the CSV URL.');
            }
        }
        
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.data && results.data.length > 0) {
                        console.log('Raw CSV data (first 3 rows):', results.data.slice(0, 3));
                        resolve(processCSVData(results.data));
                    } else {
                        reject(new Error('No data found in CSV after parsing.'));
                    }
                },
                error: function(error) {
                    console.error('PapaParse error:', error);
                    reject(new Error('Error parsing CSV data: ' + error.message));
                }
            });
        });

    } catch (error) {
        console.error('Error fetching menu data:', error);
        const container = document.querySelector('.container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = `Error loading menu data: ${error.message}. Please try refreshing the page.`;
            // Clear loading messages before adding error
            document.querySelectorAll('.loading').forEach(el => el.remove());
            container.appendChild(errorDiv);
        }
        return null;
    }
}

function processCSVData(csvData) {
    const menuData = {
        soups: [],
        starters: [],
        mains: {
            individual: [],
            sharing: []
        },
        desserts: [],
        addons: [] // Initialize addons array
    };
    const defaultImage = 'https://placehold.co/250x250/eeeeee/cccccc?text=No+Image';

    function getDirectImageUrl(driveUrl) {
        if (!driveUrl) return defaultImage;
        if (!driveUrl.includes('drive.google.com')) return driveUrl;
        const fileIdMatch = driveUrl.match(/[-\w]{25,}/);
        return fileIdMatch ? `https://drive.google.com/thumbnail?id=${fileIdMatch[0]}&sz=w1000` : defaultImage;
    }

    csvData.forEach(row => {
        if (!row.Category || !row.ID || !row.Name) {
            console.warn('Skipping row due to missing Category, ID, or Name:', row);
            return;
        }

        const isActive = String(row.IsActive).toUpperCase();
        if (!['TRUE', '1', 'YES'].includes(isActive)) {
            console.log(`Skipping inactive item: ${row.Name}`);
            return;
        }

        const item = {
            id: row.ID.trim(),
            name: row.Name.trim(),
            description: row.Description || '',
            image: getDirectImageUrl(row['Image URL']),
            upgradePrice: parseFloat(row['Upgrade Price']) || 0,
            upgradeCaption: row['Upgrade Caption'] || '',
            additionalRemarks: row.AdditionalRemarks || '',
            servingStyle: (row['ServingStyle'] || 'individual').toLowerCase().trim(),
            isSignature: ['TRUE', 'YES', '1'].includes(String(row.IsSignature).toUpperCase()),
            mealAvailability: (row['MealAvailability'] || 'Both').toLowerCase().trim(),
            remarksColor: row.RemarksColor || null // Add this line
        };

        const categoryKey = row.Category.toLowerCase().replace(/\s+/g, '');
        if (categoryKey === 'mains') {
            if (item.servingStyle === 'sharing') {
                menuData.mains.sharing.push(item);
            } else {
                menuData.mains.individual.push(item);
            }
        } else if (menuData[categoryKey]) {
            menuData[categoryKey].push(item);
        } else {
            console.warn(`Unknown category: ${row.Category} for item ${item.name}`);
        }
    });
    return menuData;
}

function createMenuItem(item, category) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.dataset.id = item.id;
    div.dataset.category = category;

    const isChecked = Array.isArray(selectedItems[category]) ? selectedItems[category].some(selItem => selItem.id === item.id) : (selectedItems[category] && selectedItems[category].id === item.id);

    let quantityDropdownHTML = '';
    if (!isReadonly && category === 'addons') {
        let optionsHTML = '<option value="" disabled selected>#Portions:</option>';
        for (let i = 1; i <= 5; i++) {
            optionsHTML += `<option value="${i}">${i}</option>`;
        }
        quantityDropdownHTML = `
            <select class="quantity-select" data-item-id="${item.id}" style="display: ${isChecked ? 'block' : 'none'}; position: absolute; bottom: 15px; left: 15px; width: calc(100% - 30px); max-width: 190px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.7em; z-index: 2;">
                ${optionsHTML}
            </select>
        `;
    } else if (!isReadonly && category !== 'starters' && category !== 'addons' && currentServingStyle !== 'sharing') {
         quantityDropdownHTML = `
            <select class="quantity-select" data-item-id="${item.id}" style="display: ${isChecked ? 'block' : 'none'}; position: absolute; bottom: 15px; left: 15px; width: calc(100% - 30px); max-width: 190px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.7em; z-index: 2;">
                <option value="" disabled selected>[Optional] #Guests?</option>
            </select>
        `;
    }
    
    // Determine how to display the upgrade price based on the category
    let upgradePriceText = '';
    if (item.upgradePrice > 0) {
        const priceString = `+$${item.upgradePrice.toFixed(0)}`;
        const caption = item.upgradeCaption ? ` ${item.upgradeCaption}` : '';
        upgradePriceText = `(${priceString}${caption})`;
    }

    // Determine ribbon style
    const ribbonStyle = item.remarksColor ? `style="background-color: ${item.remarksColor};"` : '';

    div.innerHTML = `
        <input type="checkbox" id="item-${item.id}" ${isChecked ? 'checked' : ''} style="z-index: 3;" ${isReadonly ? 'disabled' : ''}>
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/250x250/eeeeee/cccccc?text=No+Image'" class="menu-image">
        <h3>${item.name}${item.isSignature ? ' ⭐' : ''}</h3>
        <p>${item.description}${upgradePriceText ? `<br><b class="price-upgrade">${upgradePriceText}</b>` : ''}</p>
        ${item.additionalRemarks ? `<div class="ribbon" ${ribbonStyle}><span>${item.additionalRemarks}</span></div>` : ''}
        ${quantityDropdownHTML}
    `;

    if (quantityDropdownHTML) { 
        const selectElement = div.querySelector('.quantity-select');
        if (category === 'addons') {
            // For addons, options are pre-built. Just restore value if it exists.
            const quantity = getItemQuantity(item.id);
            if (quantity > 0) {
                selectElement.value = quantity;
            }
        } else {
            updateQuantityDropdown(selectElement);
        }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const mealType = (urlParams.get('meal') || 'dinner').toLowerCase();
    if (item.mealAvailability !== 'both' && item.mealAvailability !== mealType) {
        div.style.display = 'none';
    }

    const checkbox = div.querySelector('input[type="checkbox"]');
    if (isReadonly) {
        checkbox.style.display = 'none';
    } else {
    checkbox.addEventListener('change', () => {
            if (isReadonly) return;
            if (!div.classList.contains('disabled')) {
                selectItem(item, category, div);
            }
        });
    }

    const selectElement = div.querySelector('.quantity-select');
    if (selectElement) {
        selectElement.addEventListener('change', (event) => {
            handleQuantityChange(event, item.id);
        });
        selectElement.addEventListener('click', (event) => event.stopPropagation()); // Prevent item click when interacting with dropdown
    }

    div.addEventListener('click', (event) => {
        if (isReadonly) return;
        if (event.target.matches('input[type="checkbox"]') || event.target.matches('select.quantity-select') || event.target.matches('select.quantity-select option')) {
            return; // Let the specific handlers work
        }
        if (!checkbox.disabled) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
    
    return div;
}

function updateQuantityDropdown(selectElement) {
    if (!selectElement) return;
    const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
    const currentVal = selectElement.value;

    selectElement.innerHTML = '<option value="" disabled>[Optional] #Guests?</option>';
    for (let i = 0; i <= adultCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === 0 ? "0 (None)" : i;
        selectElement.appendChild(option);
    }
    // Try to restore previous value if valid
    if (currentVal && parseInt(currentVal) <= adultCount) {
        selectElement.value = currentVal;
    } else {
         selectElement.selectedIndex = 0; // Select the placeholder
    }
}


function handleQuantityChange(event, itemId) {
    const quantity = parseInt(event.target.value);
    if (!isNaN(quantity)) {
        itemQuantities[itemId] = quantity;
    } else {
        delete itemQuantities[itemId]; // Remove if "Optional" is re-selected or invalid
    }
    updateSummary();
}

function getItemQuantity(itemId) {
    return itemQuantities[itemId] || 0;
}

function clearItemQuantitiesForCategory(category) {
    if (selectedItems[category]) {
        const itemsInCategory = Array.isArray(selectedItems[category]) ? selectedItems[category] : [selectedItems[category]];
        itemsInCategory.forEach(item => {
            if (item && item.id && itemQuantities[item.id]) {
                delete itemQuantities[item.id];
                const menuItemDiv = document.querySelector(`.menu-item[data-id="${item.id}"] .quantity-select`);
                if (menuItemDiv) {
                    menuItemDiv.value = ""; // Reset dropdown
                }
            }
        });
    }
}


function updateSelectionCount(category) {
    const config = courseConfig[category];
    if (!config.allowMultiple) return;

    const countElement = document.getElementById(`${category}-count`);
    if (!countElement) return;

    const selectedCount = selectedItems[category].length;
    const maxCount = config.maxSelections;
    
    if (category === 'starters') {
        countElement.textContent = `Please select ${maxCount} ${config.displayName.toLowerCase()} (${selectedCount} selected)`;
    } else {
        countElement.textContent =  (category === 'addons' ? '' : `Please select up to ${maxCount} ${config.displayName.toLowerCase()} (${selectedCount} selected)`);
    }
    
    countElement.classList.remove('error', 'partial-success', 'success');

    if (category === 'starters') {
        if (selectedCount === maxCount) {
            countElement.classList.add('success');
        } else if (config.required) { // Any other count is an error for required starters
            countElement.classList.add('error');
        }
    } else {
        if (selectedCount === 0 && config.required) {
            countElement.classList.add('error');
        } else if (selectedCount > maxCount) {
            countElement.classList.add('error');
        } else if (selectedCount > 0 && selectedCount < maxCount) {
            countElement.classList.add('partial-success');
        } else if (selectedCount === maxCount) {
            countElement.classList.add('success');
        }
    }
    const menuItemsInCategory = document.querySelectorAll(`#${category} .menu-item`);
    menuItemsInCategory.forEach(itemDiv => {
        const checkbox = itemDiv.querySelector('input[type="checkbox"]');
        if (!itemDiv.classList.contains('selected')) {
            const isDisabled = selectedCount >= maxCount;
            itemDiv.classList.toggle('disabled', isDisabled);
            if(checkbox) checkbox.disabled = isDisabled;
        } else {
             if(checkbox) checkbox.disabled = false; // Ensure selected items are never disabled by this logic
        }
    });
}

function selectItem(item, category, element) {
    const config = courseConfig[category];
    const checkbox = element.querySelector('input[type="checkbox"]');
    const quantitySelect = element.querySelector('.quantity-select');

    if (config.allowMultiple) {
        const itemIndex = selectedItems[category].findIndex(i => i.id === item.id);
        
        if (itemIndex > -1) { // Item is currently selected, so deselect it
            selectedItems[category].splice(itemIndex, 1);
            element.classList.remove('selected');
            if(checkbox) checkbox.checked = false;
            if (quantitySelect) quantitySelect.style.display = 'none';
            delete itemQuantities[item.id]; // Clear quantity on deselect
            if (quantitySelect) quantitySelect.value = "";
        } else { // Item is not selected, so select it
            if (selectedItems[category].length < config.maxSelections) {
                selectedItems[category].push(item);
                element.classList.add('selected');
                if(checkbox) checkbox.checked = true;
                if (quantitySelect) {
                    quantitySelect.style.display = 'block';
                    if (category === 'addons') {
                        // Default to 1 portion if none is selected yet
                        if (!quantitySelect.value) {
                            quantitySelect.value = '1';
                            handleQuantityChange({ target: quantitySelect }, item.id);
                        }
                    }
                }
            } else {
                // Max reached, prevent selection
                if(checkbox) checkbox.checked = false;
                // Optionally, provide feedback to the user, e.g., a temporary message or shake animation
                console.warn(`Max selections reached for ${category}`);
            }
        }
        updateSelectionCount(category);
    } else { // Single selection mode (not currently used by default config but good to have)
        // Deselect previous if any
        if (selectedItems[category] && selectedItems[category].id !== item.id) {
            const prevSelectedElement = document.querySelector(`#${category} .menu-item[data-id="${selectedItems[category].id}"]`);
            if (prevSelectedElement) {
                prevSelectedElement.classList.remove('selected');
                const prevCheckbox = prevSelectedElement.querySelector('input[type="checkbox"]');
                if(prevCheckbox) prevCheckbox.checked = false;
                const prevQuantitySelect = prevSelectedElement.querySelector('.quantity-select');
                if (prevQuantitySelect) prevQuantitySelect.style.display = 'none';
                delete itemQuantities[selectedItems[category].id];
                 if (prevQuantitySelect) prevQuantitySelect.value = "";
            }
        }
        
        if (selectedItems[category] && selectedItems[category].id === item.id) { // Clicked on already selected item (toggle off)
            selectedItems[category] = null;
            element.classList.remove('selected');
            if(checkbox) checkbox.checked = false;
            if (quantitySelect) quantitySelect.style.display = 'none';
            delete itemQuantities[item.id];
            if (quantitySelect) quantitySelect.value = "";
        } else { // Select new item
            selectedItems[category] = item;
            element.classList.add('selected');
            if(checkbox) checkbox.checked = true;
            if (quantitySelect) quantitySelect.style.display = 'block';
        }
    }
    
    updateSummary();
    updateButtonStates();
}

function updateSummary() {
    const summaryElement = document.getElementById('selected-items');
    const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
    let html = '';
    let overallQuantityValid = true;

    Object.entries(courseConfig).forEach(([category, config]) => {
        const categoryDisplayName = config.displayName;
        const items = selectedItems[category];
        const errorElement = document.getElementById(`${category}-quantity-error`);

        if (!items || (Array.isArray(items) && items.length === 0)) {
            if (errorElement) errorElement.style.display = 'none'; // Hide error if no items selected
            return;
        }

        html += `<p><strong>${categoryDisplayName}:</strong></p>`;
        let totalQuantityInCategory = 0;
        const categoryItemsForSummary = Array.isArray(items) ? items : [items];

        categoryItemsForSummary.forEach(item => {
            if (item && !item.disabled) { // Ensure item is not undefined
                let priceInfo = '';
                if (item.upgradePrice > 0) {
                    const priceString = `+$${item.upgradePrice.toFixed(0)}`;
                    const caption = item.upgradeCaption ? ` ${item.upgradeCaption}` : '';
                    priceInfo = `(${priceString}${caption})`;
                }
                const quantity = getItemQuantity(item.id);
                totalQuantityInCategory += quantity;
                html += `<p>• ${item.name} ${quantity > 0 ? `(x${quantity})` : ''} ${priceInfo}</p>`;
            }
        });
        
        const isQuantityValidationApplicable = category !== 'starters' && category !== 'addons' && (category !== 'mains' || currentServingStyle === 'individual');

        if (isQuantityValidationApplicable && totalQuantityInCategory > adultCount && adultCount > 0) {
            if (errorElement) {
                errorElement.textContent = `Total quantity for ${categoryDisplayName} (${totalQuantityInCategory}) exceeds the number of adults (${adultCount}).`;
                errorElement.style.display = 'block';
            }
            overallQuantityValid = false;
            categoryItemsForSummary.forEach(item => {
                if (item) { // Ensure item is not undefined
                    const menuItemDiv = document.querySelector(`.menu-item[data-id="${item.id}"]`);
                    if (menuItemDiv) menuItemDiv.classList.add('error');
                }
            });
        } else {
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            categoryItemsForSummary.forEach(item => {
                 if (item) { // Ensure item is not undefined
                    const menuItemDiv = document.querySelector(`.menu-item[data-id="${item.id}"]`);
                    if (menuItemDiv) menuItemDiv.classList.remove('error');
                 }
            });
        }
    });

    // Add specifics to the summary
    const arrivalTimeEl = document.getElementById('arrival-time');
    const arrivalTime = arrivalTimeEl ? arrivalTimeEl.value.trim() : '';
    const allergies = document.getElementById('allergies').value;
    const occasion = document.getElementById('occasion').value;
    const specialRequestsChecked = Array.from(document.querySelectorAll('input[name="special-requests"]:checked'))
        .filter(checkbox => checkbox.value !== 'others') // Exclude 'others' checkbox itself
        .map(checkbox => checkbox.nextElementSibling.textContent.trim());
    const othersRequestInput = document.querySelector('input[name="special-requests-others"]');
    const othersRequestValue = (othersRequestInput && !othersRequestInput.disabled) ? othersRequestInput.value.trim() : '';

    if (allergies) html += `<p><strong>Allergies/Restrictions:</strong> ${allergies}</p>`;
    if (occasion) html += `<p><strong>Occasion:</strong> ${occasion}</p>`;
    
    let specialRequestsSummary = specialRequestsChecked.join(', ');
    if (othersRequestValue) {
        specialRequestsSummary += (specialRequestsSummary ? ', ' : '') + `Others: ${othersRequestValue}`;
    }
    if (specialRequestsSummary) {
        html += `<p><strong>Special Requests:</strong> ${specialRequestsSummary}</p>`;
    }
    
    summaryElement.innerHTML = html;
    // updateButtonStates relies on validateQuantities which is similar to the logic here.
    // We call updateButtonStates to ensure buttons reflect the latest state.
    updateButtonStates();
}


function validateQuantities() { // This function checks if total quantities per category exceed adult count
    const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
    if (adultCount === 0) return true; // No adults, no quantity validation needed like this

    let isValid = true;
    for (const category in courseConfig) {
        const config = courseConfig[category];
        const items = selectedItems[category];
        
        const isQuantityValidationApplicable = category !== 'starters' && category !== 'addons' && (category !== 'mains' || currentServingStyle === 'individual');

        if (isQuantityValidationApplicable && items && Array.isArray(items) && items.length > 0) {
            let totalQuantity = 0;
            items.forEach(item => {
                totalQuantity += getItemQuantity(item.id);
            });
            if (totalQuantity > adultCount) {
                isValid = false;
                // UI update for errors is handled in updateSummary
                break; 
            }
        } else if (isQuantityValidationApplicable && items && !Array.isArray(items)) { // Single select item
             if (getItemQuantity(items.id) > adultCount) {
                isValid = false;
                break;
             }
        }
    }
    return isValid;
}


function initializeSelectionCounts() {
    Object.keys(courseConfig).forEach(category => {
        if (courseConfig[category].allowMultiple) {
            updateSelectionCount(category);
        }
    });
}

function updateMainCourseDisplay() {
    const mainsContainer = document.getElementById('mains');
    if (!window.menuData || !window.menuData.mains) {
        console.error("Menu data for mains not available for display update.");
        if (mainsContainer) mainsContainer.innerHTML = '<div class="error">Main courses data is missing.</div>';
        return;
    }

    mainsContainer.innerHTML = ''; // Clear existing items

    const servingStyle = document.querySelector('input[name="serving-style"]:checked').value;
    currentServingStyle = servingStyle; // Update global tracker

    const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
    if (servingStyle === 'sharing') {
        courseConfig.mains.maxSelections = adultCount > 8 ? 2 : 1;
    } else { // individual
        courseConfig.mains.maxSelections = 2; // Default for individual
    }
    
    // Clear previous mains selections and their quantities
    selectedItems.mains = []; 
    clearItemQuantitiesForCategory('mains');


    const itemsToDisplay = window.menuData.mains[servingStyle];
    if (itemsToDisplay && itemsToDisplay.length > 0) {
        itemsToDisplay.forEach(item => {
            mainsContainer.appendChild(createMenuItem(item, 'mains'));
        });
    } else {
        mainsContainer.innerHTML = '<div class="error">No items available for this serving style.</div>';
    }

    updateSelectionCount('mains'); // Update the "Please select..." text
    updateSummary(); // Update the summary section
    updateButtonStates(); // Update submit buttons
}


function setupServingStyleControls() {
    document.querySelectorAll('input[name="serving-style"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.radio-label').forEach(label => label.classList.remove('selected'));
            const checkedLabel = radio.closest('.radio-label');
            if (checkedLabel) checkedLabel.classList.add('selected');
            
            const helperText = document.getElementById('sharing-helper-text');
            const isSharing = radio.value === 'sharing';
            helperText.style.display = isSharing ? 'block' : 'none';
            
            updateMainCourseDisplay(); // This will clear selections, quantities, and redraw
        });
    });
     // Initial state for selected radio label
    const initiallyCheckedRadio = document.querySelector('input[name="serving-style"]:checked');
    if (initiallyCheckedRadio) {
        const label = initiallyCheckedRadio.closest('.radio-label');
        if (label) label.classList.add('selected');
        document.getElementById('sharing-helper-text').style.display = initiallyCheckedRadio.value === 'sharing' ? 'block' : 'none';
    }
}


function updateTitleBasedOnQueryParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const mealType = urlParams.get('meal');
    populateCourseCountDropdown(mealType && mealType.toLowerCase() === 'lunch' ? 'lunch' : 'dinner');
}

function populateCourseCountDropdown(mealType) {
    const courseCountSelect = document.getElementById('course-count');
    courseCountSelect.innerHTML = ''; // Clear existing options

    let defaultSelected = false;
    const availableOptions = [];

    for (const count in courseCountAvailability) {
        const optionData = courseCountAvailability[count];
        if (optionData.meals.includes('both') || optionData.meals.includes(mealType)) {
            availableOptions.push({ value: count, text: optionData.label, isDefault: optionData.isDefault });
        }
    }
    
    if (availableOptions.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No menus available for this type";
        option.disabled = true;
        option.selected = true;
        courseCountSelect.appendChild(option);
    } else {
        availableOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            if (opt.isDefault && !defaultSelected) {
                option.selected = true;
                defaultSelected = true;
            }
            courseCountSelect.appendChild(option);
        });

        if (!defaultSelected && courseCountSelect.options.length > 0) {
            courseCountSelect.options[0].selected = true; // Select first if no default matched
        }
    }
    courseCountSelect.dispatchEvent(new Event('change')); // Trigger updates
}

async function initializeMenu() {
    try {
        console.log('Starting menu initialization...');
        document.querySelectorAll('.menu-items').forEach(el => {
            el.innerHTML = '<div class="loading">Loading menu items...</div>';
        });

        const menuData = await fetchMenuData();
        console.log('Menu data received:', menuData);

        if (menuData) {
            window.menuData = menuData; // Store globally for access

            for (const category in courseConfig) { // Iterate over defined courseConfig to maintain order
                const container = document.getElementById(category);
                if (!container) {
                    console.warn(`Container not found for category: ${category}`);
                    continue;
                }
                container.innerHTML = ''; // Clear loading message

                let itemsForCategory;
                if (category === 'mains') {
                    // Mains are handled by updateMainCourseDisplay, which is called after serving style setup
                    // For initial load, we can call it here if needed, or rely on DOMContentLoaded setup
                    // updateMainCourseDisplay(); // This will be called by serving style setup
                    continue; // Skip direct population for mains here
                } else {
                    itemsForCategory = menuData[category];
                }

                if (itemsForCategory && itemsForCategory.length > 0) {
                    itemsForCategory.forEach(item => {
                        container.appendChild(createMenuItem(item, category));
                    });
                } else {
                    container.innerHTML = `<div class="error">No items found for ${courseConfig[category].displayName}.</div>`;
                }
                 updateSelectionCount(category); // Update count display after populating
            }
            updateMainCourseDisplay(); // Ensure mains are populated based on default serving style
        } else {
            // Error message already handled by fetchMenuData
            console.error('Menu data is null, initialization incomplete.');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        const container = document.querySelector('.container');
        if (container) { // Fallback error display
             document.querySelectorAll('.loading').forEach(el => el.remove());
            if (!container.querySelector('.error')) { // Avoid duplicate generic errors
                container.innerHTML += `<div class="error">Error initializing menu: ${error.message}</div>`;
            }
        }
    }
}


function updateBookingDateLabel() { // This function seems to be for a hidden meal input, which is not present.
                                   // The label text is static in HTML. If dynamic update is needed, HTML needs adjustment.
    const urlParams = new URLSearchParams(window.location.search);
    const mealType = (urlParams.get('meal') || 'dinner').toLowerCase();
    // Example: If you had <span id="meal-type-display"> in your label:
    // const mealTypeDisplayElement = document.getElementById('meal-type-display');
    // if (mealTypeDisplayElement) mealTypeDisplayElement.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function setupDatePicker() {
    const dateInput = document.getElementById('booking-date');
    const dateError = document.getElementById('date-error');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Booking must be at least for tomorrow
    tomorrow.setHours(0, 0, 0, 0); 

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Max 3 months in advance
    maxDate.setHours(23,59,59,999);

    const formatDateForInput = (date) => date.toISOString().split('T')[0];

    dateInput.min = formatDateForInput(tomorrow);
    dateInput.max = formatDateForInput(maxDate);

    dateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value + "T00:00:00"); // Ensure time part for comparison
        dateError.textContent = '';
        dateError.style.display = 'none';

        if (selectedDate < today || selectedDate > maxDate) {
            dateError.textContent = 'Please select a date up to 3 months in advance.';
            dateError.style.display = 'block';
            e.target.value = ''; // Clear invalid date
        }
        updateButtonStates();
    });
}

function setupNumberSelects() {
    const adultSelect = document.getElementById('adult-count');
    const kidSelect = document.getElementById('kid-count');
    const toddlerSelect = document.getElementById('toddler-count');

    // Populate adult count (min 2, max MAX_CAPACITY)
    for (let i = 2; i <= MAX_CAPACITY; i++) {
        adultSelect.add(new Option(i, i));
    }
    // Populate kid count (0 to MAX_CHILDREN)
    for (let i = 1; i <= MAX_CHILDREN; i++) {
        kidSelect.add(new Option(i, i));
    }
    // Populate toddler count (0 to MAX_CHILDREN or a reasonable limit)
    for (let i = 1; i <= MAX_CHILDREN; i++) { // Assuming toddlers also up to MAX_CHILDREN for simplicity
        toddlerSelect.add(new Option(i, i));
    }

    [adultSelect, kidSelect].forEach(sel => sel.addEventListener('change', () => {
        validateAdultKidCount();
        // If adult count changes, quantity dropdowns for menu items need update
        if (sel === adultSelect) {
                document.querySelectorAll('.menu-item:not([data-category="addons"]) .quantity-select').forEach(qs => updateQuantityDropdown(qs));

            // Special logic for dessert selection based on adult count
            const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
            const originalMaxDesserts = 3; // Default max from config
            const newMaxDesserts = (adultCount === 2) ? 2 : originalMaxDesserts;

            if (courseConfig.desserts.maxSelections !== newMaxDesserts) {
                courseConfig.desserts.maxSelections = newMaxDesserts;

                // Reset selections for desserts if they exceed the new max
                if (selectedItems.desserts.length > newMaxDesserts) {
                    const itemsToKeep = selectedItems.desserts.slice(0, newMaxDesserts);
                    const itemsToDeselect = selectedItems.desserts.slice(newMaxDesserts);
                    
                    selectedItems.desserts = itemsToKeep;

                    itemsToDeselect.forEach(item => {
                        const itemDiv = document.querySelector(`#desserts .menu-item[data-id="${item.id}"]`);
                        if (itemDiv) {
                            itemDiv.classList.remove('selected');
                            const checkbox = itemDiv.querySelector('input[type="checkbox"]');
                            if (checkbox) checkbox.checked = false;
                        }
                    });
                }
                updateSelectionCount('desserts');
            }
            updateSummary(); // Re-validate quantities in summary and button states
        }
         // If adult count changes and main course is sharing, update its display rules
        if (sel === adultSelect && currentServingStyle === 'sharing') {
            updateMainCourseDisplay();
        }
    }));
    validateAdultKidCount(); // Initial check
}

function validateAdultKidCount() {
    const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
    const kidCount = parseInt(document.getElementById('kid-count').value) || 0;
    const totalGuests = adultCount + kidCount;
    const errorElement = document.getElementById('adult-count-error');
    
    errorElement.textContent = '';
    errorElement.style.display = 'none';
    document.getElementById('adult-count').classList.remove('error-field');
    document.getElementById('kid-count').classList.remove('error-field');

    if (totalGuests > MAX_CAPACITY) {
        errorElement.textContent = `The combined number of adults and children cannot exceed ${MAX_CAPACITY}.`;
        errorElement.style.display = 'block';
        document.getElementById('adult-count').classList.add('error-field');
        document.getElementById('kid-count').classList.add('error-field');
    }
    updateButtonStates();
}

function handleCourseCountChange(event) {
    const selectedValue = event.target.value;
    const courseCountDisplayEl = document.getElementById('course-count-display');
    const menuPriceDisplayEl = document.getElementById('menu-price-display');

    if (selectedValue && courseCountAvailability[selectedValue]) {
        const totalCourses = parseInt(selectedValue);
        currentMenuPrice = menuPrices[totalCourses];
        
        if (courseCountDisplayEl) courseCountDisplayEl.textContent = totalCourses;
        if (menuPriceDisplayEl) menuPriceDisplayEl.textContent = `$${currentMenuPrice}`;
        
        // Update max selections for starters based on the selected course count
        courseConfig.starters.maxSelections = courseCountAvailability[totalCourses].starterCount || 2; // Fallback
        
        // Reset selections for starters if they exceed the new max
        if (selectedItems.starters.length > courseConfig.starters.maxSelections) {
            selectedItems.starters = selectedItems.starters.slice(0, courseConfig.starters.maxSelections);
            // Need to update UI for deselected items
            document.querySelectorAll('#starters .menu-item.selected').forEach((itemDiv, index) => {
                if (index >= courseConfig.starters.maxSelections) {
                    itemDiv.classList.remove('selected');
                    itemDiv.querySelector('input[type="checkbox"]').checked = false;
                    const quantitySelect = itemDiv.querySelector('.quantity-select');
                    if (quantitySelect) quantitySelect.style.display = 'none';
                }
            });
        }
        updateSelectionCount('starters'); // Update display for starters
        
    } else {
        currentMenuPrice = 0;
        if (courseCountDisplayEl) courseCountDisplayEl.textContent = '0';
        if (menuPriceDisplayEl) menuPriceDisplayEl.textContent = '$0';
    }
    updateSummary();
    updateButtonStates();
}

function setupCourseCount() {
    const courseCountSelect = document.getElementById('course-count');
    courseCountSelect.addEventListener('change', handleCourseCountChange);
    // Initial call to set price and starter limits based on default selection
    if (courseCountSelect.value) {
        handleCourseCountChange({ target: courseCountSelect });
    }
}

function updateButtonStates() {
    // --- Basic Info Check ---
    const name = document.getElementById('customer-name').value.trim();
    const contactNumber = document.getElementById('contact-number').value.trim();
    const bookingDate = document.getElementById('booking-date').value;
    const arrivalTimeEl = document.getElementById('arrival-time');
    const arrivalTime = arrivalTimeEl ? arrivalTimeEl.value.trim() : '';
    const adultCountVal = document.getElementById('adult-count').value;
    const courseCountVal = document.getElementById('course-count').value;
    const adultKidError = document.getElementById('adult-count-error').textContent;
    const dateError = document.getElementById('date-error').textContent;
    const isFormValid = name && contactNumber && bookingDate && arrivalTime && adultCountVal && courseCountVal && !adultKidError && !dateError;
    document.querySelector('#status-basic-info .status-dot')?.classList.toggle('completed', isFormValid);

    // --- Selections & Quantities Check ---
    let areAllSelectionsValid = true;
    const adultCount = parseInt(document.getElementById('adult-count').value) || 0;

    for (const category in courseConfig) {
        if (courseConfig[category].required) {
            const statusElement = document.querySelector(`#status-${category} .status-dot`);
            if (!statusElement) continue;

            const selected = selectedItems[category];
            const minSelections = 1;
            const maxSelections = courseConfig[category].maxSelections;
            
            // 1. Check selection count
            let isSelectionCountValid = false;
            if (courseConfig[category].allowMultiple) {
                if (category === 'starters') {
                    if (selected && selected.length === maxSelections) {
                        isSelectionCountValid = true;
                    }
                } else {
                    if (selected && selected.length >= minSelections && selected.length <= maxSelections) {
                        isSelectionCountValid = true;
                    }
                }
            } else {
                if (selected) {
                    isSelectionCountValid = true;
                }
            }

            // 2. Check quantity for this category
            let isQuantityValid = true;
            const isQuantityValidationApplicable = category !== 'starters' && category !== 'addons' && (category !== 'mains' || currentServingStyle === 'individual');
            if (isSelectionCountValid && isQuantityValidationApplicable && adultCount > 0) {
                let totalQuantity = 0;
                (Array.isArray(selected) ? selected : [selected]).forEach(item => {
                    totalQuantity += getItemQuantity(item.id);
                });
                if (totalQuantity > adultCount) {
                    isQuantityValid = false;
                }
            }
            
            const isCategoryOverallValid = isSelectionCountValid && isQuantityValid;
            statusElement.classList.toggle('completed', isCategoryOverallValid);

            if (!isCategoryOverallValid) {
                areAllSelectionsValid = false;
            }
        }
    }
    
    const overallValid = isFormValid && areAllSelectionsValid;

    document.querySelectorAll('.send-email-btn, .whatsapp-btn').forEach(button => {
        button.disabled = !overallValid;
    });
}

function setupFormValidationAndInteractions() {
    const formFieldsToWatch = [
        'customer-name', 'contact-number', 'booking-date', 'arrival-time',
        'adult-count', 'kid-count', 'course-count',
        'allergies', 'occasion'
    ];
    formFieldsToWatch.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('input', updateSummary); // For text areas, text inputs
            field.addEventListener('change', updateSummary); // For selects, date
        }
    });
    
    document.querySelectorAll('input[name="special-requests"]').forEach(input => {
        input.addEventListener('change', updateSummary);
    });

    // Enable/disable "Others" text input based on checkbox
    const othersCheckbox = document.querySelector('input[name="special-requests"][value="others"]');
    const othersTextInput = document.querySelector('input[name="special-requests-others"]');
    if (othersCheckbox && othersTextInput) {
        // Add the listener here inside the safe block
        othersTextInput.addEventListener('input', updateSummary);
        const toggleOthersText = () => othersTextInput.disabled = !othersCheckbox.checked;
        othersCheckbox.addEventListener('change', toggleOthersText);
        toggleOthersText(); // Initial state
    }
    
    // Initial call to set button states
    updateButtonStates();
}

function applyReadonlyMode() {
    document.body.classList.add('readonly-mode');

    // Hide the main booking form
    const bookingForm = document.querySelector('.booking-form');
    if (bookingForm) bookingForm.style.display = 'none';

    // Hide the final summary and submission buttons
    const summary = document.querySelector('.summary');
    if (summary) summary.style.display = 'none';

    // Hide development tools
    document.querySelectorAll('.dev-tools').forEach(el => el.style.display = 'none');

    // Display Menu Options
    document.getElementById('menu-options-image').style.display = 'inline';

    // For each course section, hide all descriptive elements, leaving only the menu items
    const courseSections = document.querySelectorAll('.course-section');
    courseSections.forEach(section => {
        // The "Additional Information" section has no menu items, so hide it completely
        if (!section.querySelector('.menu-items')) {
            section.style.display = 'none';
            return;
        }

        // Hide all direct children of the section except for the .menu-items container
        Array.from(section.children).forEach(child => {
            if (!child.classList.contains('menu-items') && !child.classList.contains('course-title')) {
                child.style.display = 'none';
            }
        });
    });
}

// --- Email and WhatsApp Logic ---
(function() {
    // Ensure EmailJS public key is set here
    const emailJsPublicKey = "THRDFTRmfAZfOf6rF"; // Replace with your actual EmailJS Public Key
    if (emailJsPublicKey && emailJsPublicKey !== "YOUR_PUBLIC_KEY") {
        emailjs.init(emailJsPublicKey);
    } else {
        console.error("EmailJS Public Key is not set. Email functionality will not work.");
    }
})();

function getSharedMessageData() {
    const name = document.getElementById('customer-name').value.trim();
    const contactNumber = document.getElementById('contact-number').value.trim();
    const bookingDate = document.getElementById('booking-date').value;
    const arrivalTimeEl = document.getElementById('arrival-time');
    const arrivalTime = arrivalTimeEl ? arrivalTimeEl.value.trim() : '';
    const adultCount = document.getElementById('adult-count').value;
    const kidCount = document.getElementById('kid-count').value || '0';
    const toddlerCount = document.getElementById('toddler-count').value || '0';
    const courseCountSelectedValue = document.getElementById('course-count').value; // e.g. "5"
    
    // Get the text label for the course count for more descriptive message
    const courseCountSelect = document.getElementById('course-count');
    const courseCountLabel = courseCountSelect.options[courseCountSelect.selectedIndex]?.text || `${courseCountSelectedValue} Course Menu`;


    const menuPriceDisplay = document.getElementById('menu-price-display').textContent;

    if (!name || !contactNumber || !bookingDate || !arrivalTime || !adultCount || !courseCountSelectedValue) {
        throw new Error('Please fill in all required fields in the booking form.');
    }

    const selectedItemsHtml = document.getElementById('selected-items').innerHTML;
    // Improved formatting for text message (strips HTML, preserves line breaks somewhat)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = selectedItemsHtml.replace(/<\/p><p>/g, '</p>\n<p>'); // Add newline between paragraphs
    let formattedItems = tempDiv.textContent || tempDiv.innerText || "";
    formattedItems = formattedItems.replace(/^\s*[\r\n]/gm, ''); // Remove empty lines

    return {
        name, contactNumber, bookingDate, arrivalTime, adultCount, kidCount, toddlerCount,
        courseCountLabel, // Use the descriptive label
        menuPriceDisplay, formattedItems
    };
}

async function sendEmail() {
    const allEmailButtons = document.querySelectorAll('.send-email-btn');
    allEmailButtons.forEach(btn => {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent; // Store original text
        btn.textContent = 'Sending...';
    });

    try {
        const data = getSharedMessageData();
        const templateParams = {
            from_name: data.name,
            contact_number: data.contactNumber,
            booking_date: data.bookingDate,
            arrival_time: data.arrivalTime,
            adult_count: data.adultCount,
            kid_count: data.kidCount,
            toddler_count: data.toddlerCount,
            course_details: data.courseCountLabel, // Use descriptive label
            menu_price: data.menuPriceDisplay,
            selected_items_text: data.formattedItems, // Plain text version for email body
            // The 'message' in EmailJS template is often a general summary.
            // Construct it based on your EmailJS template's needs.
            // Example:
            // message: `New menu selection from ${data.name} for ${data.courseCountLabel} on ${data.bookingDate}. Contact: ${data.contactNumber}. Adults: ${data.adultCount}, Kids: ${data.kidCount}, Toddlers: ${data.toddlerCount}. Total Price: ${data.menuPriceDisplay}.\n\nSelections:\n${data.formattedItems}`
        };
        
        // Ensure your EmailJS service ID and template ID are correct
        const serviceID = 'service_7dw383m'; // Replace with your EmailJS Service ID
        const templateID = 'template_uckqo2e'; // Replace with your EmailJS Template ID

        if (!emailjs.init) { // Check if EmailJS was initialized (key was present)
             throw new Error("EmailJS is not initialized. Cannot send email.");
        }

        console.log("Sending email with params:", templateParams);
        const response = await emailjs.send(serviceID, templateID, templateParams);
        console.log('Email sent successfully:', response);
        alert('Menu selection has been sent successfully via Email!');
    } catch (error) {
        console.error('Error sending email:', error);
        alert(`Failed to send menu selection via Email. ${error.message}`);
    } finally {
        allEmailButtons.forEach(btn => {
            btn.textContent = btn.dataset.originalText || (btn.id.includes('top') ? 'Send Menu Selection (Top)' : 'Send Menu Selection');
        });
        updateButtonStates(); // Re-evaluate button states
    }
}

function sendWhatsApp() {
    try {
        const data = getSharedMessageData();
        const message = `Hi, this is *${data.name}* regarding my menu selection for *${data.bookingDate}*.\n\n` +
            `*Arrival Time:* ${data.arrivalTime}\n` +
            `*#Adults:* ${data.adultCount}\n` +
            `*#Kids:* ${data.kidCount}\n` +
            `*#Toddlers:* ${data.toddlerCount}\n` +
            `*Selected Menu:* ${data.courseCountLabel} (${data.menuPriceDisplay})\n\n` +
            `My choices:\n${data.formattedItems}`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = '85263982618'; // Replace with your actual WhatsApp number
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        console.log("WhatsApp URL:", whatsappUrl);
        window.open(whatsappUrl, '_blank');

        // Implicitly send an email as a backup or notification
        sendEmail().catch(err => console.error("Error sending implicit email via WhatsApp action:", err));

    } catch (error) {
        console.error('Error preparing WhatsApp message:', error);
        alert(`Failed to prepare WhatsApp message. ${error.message}`);
    }
}

// --- DOMContentLoaded ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded, initializing menu builder...');

    const urlParams = new URLSearchParams(window.location.search);
    isReadonly = urlParams.has('readonly');

    if (isReadonly) {
        applyReadonlyMode();
    }

    updateTitleBasedOnQueryParam(); // Populates course count based on meal type (lunch/dinner)
    setupDatePicker();
    setupNumberSelects();
    setupCourseCount(); // Sets up listener for course count changes and initializes price/starter limits

    // Pre-populate form fields for testing/linking (before menu loads)
    const fieldsToPrepopulate = {
        'customer-name': urlParams.get('CustomerName'),
        'contact-number': urlParams.get('ContactNumber'),
        'booking-date': urlParams.get('BookingDate'),
        'adult-count': urlParams.get('NumAdults')
    };
    let adultCountWasPrepopulated = false;
    for (const id in fieldsToPrepopulate) {
        if (fieldsToPrepopulate[id]) {
            const element = document.getElementById(id);
            if (element) {
                element.value = fieldsToPrepopulate[id];
                if (id === 'adult-count') {
                    adultCountWasPrepopulated = true;
                }
            }
        }
    }

    initializeMenu().then(() => {
        // Setup interactions that might depend on menu items being present
        setupServingStyleControls(); // This also calls updateMainCourseDisplay
        
        // If adult count was prepopulated, trigger its change event now that menu is loaded
        if (adultCountWasPrepopulated) {
            document.getElementById('adult-count').dispatchEvent(new Event('change'));
        }
        
        initializeSelectionCounts(); // Initialize "Please select..." messages
        setupFormValidationAndInteractions(); // Sets up listeners for summary updates and button states
        updateSummary(); // Initial summary based on any prepopulated data or defaults
        updateButtonStates(); // Final check on button states
        
        console.log("Menu builder initialization complete.");

    }).catch(error => {
        console.error("Failed to complete initialization after menu fetch:", error);
    });

    // Setup buttons
    document.getElementById('send-email')?.addEventListener('click', sendEmail); // Bottom button
    document.getElementById('send-whatsapp')?.addEventListener('click', sendWhatsApp); // Bottom button

    // Dev tool buttons
    document.getElementById('send-email-top')?.addEventListener('click', sendEmail);
    document.getElementById('send-whatsapp-top')?.addEventListener('click', sendWhatsApp);
    document.getElementById('test-data-main')?.addEventListener('click', () => {
        // Simple test data population
        document.getElementById('customer-name').value = 'Test User';
        document.getElementById('contact-number').value = '12345678';
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 2);
        document.getElementById('booking-date').value = tomorrow.toISOString().split('T')[0];
        const arrivalTimeEl = document.getElementById('arrival-time');
        if (arrivalTimeEl) arrivalTimeEl.value = '7:30 PM';
        document.getElementById('adult-count').value = '4';
        document.getElementById('adult-count').dispatchEvent(new Event('change')); // Trigger updates
        document.getElementById('course-count').selectedIndex = 1; // Select 2nd option
        document.getElementById('course-count').dispatchEvent(new Event('change'));
        updateSummary();
        updateButtonStates();
        alert('Test data populated. Please select menu items.');
    });

    // Show dev tools if #dev is in URL
    if (window.location.hash === '#dev') {
        document.querySelectorAll('.dev-tools').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.test-btn').forEach(el => el.style.display = 'inline-block');
    }
});
