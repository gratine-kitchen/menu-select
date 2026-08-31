const MAX_CAPACITY = 18;
const MAX_CHILDREN = 9; // Max children, not total with adults
let isReadonly = false;
const supportedLanguages = ['en', 'zh-HK'];
let currentLanguage = getInitialLanguage();
let cachedReleaseVersion = null;
let versionLoadAttempted = false;

const translations = {
    en: {
        language: 'Language:',
        languageAlt: 'Language',
        chooseLanguage: 'Choose language',
        english: 'English',
        chineseHongKong: '繁體中文（香港）',
        reservationDetails: 'Reservation Details',
        yourName: 'Your name:',
        contactNumber: 'Your contact number:',
        bookingDate: 'Booking date:',
        arrivalTime: 'Arrival time:',
        arrivalTimePlaceholder: 'e.g. Around 7pm',
        arrivalTimeReminderPrefix: 'We just need to know your ',
        arrivalTimeReminderLink: 'arrival time',
        arrivalTimeReminderSuffix: ' as well regarding your Reservation Details.',
        adults: 'Number of Adults 👩🏻:',
        children: 'Number of Children 🧒🏻: (age 5 to 12)',
        toddlers: 'Number of Toddlers 👶🏻: (age 4 or below)',
        selectAdults: 'Select number of adults',
        menuCourses: 'Please choose the number of menu courses:',
        priceNote: 'Price includes tea/coffee, free corkage & cake-cutting. Subject to 10% service fee.',
        soups: 'Soups',
        soupsDescription: 'Please select up to 2 soup items for your guests to choose from...',
        starters: 'Starters',
        startersDescription: 'Our starters are mainly designed to be shared and everyone will be served the same. We have quite a large variety of starters... you can savor more of them by choosing a menu with more courses. :-)',
        mains: 'Main Courses',
        mainsDescription: 'For the main course, you have the option of individual plating or family-style. While individual plating is more common... family-style sharing can be cozier with dishes such as Signature Meat Platter where everyone can savor more than one choice of meat.',
        individual: 'Individually Served',
        sharing: 'Family-Style Sharing',
        sharingHelper: '(With more than 8 adult guests, 2 dishes can be selected for sharing.)',
        desserts: 'Desserts',
        dessertsDescription: 'You can select up to 2 dessert items for your guests to choose from...',
        addons: 'Add-ons (Optional)',
        addonsDescription: 'Need more food to go with your main course? You can order any of these additional dishes to make your meal even more complete... 😉',
        additionalInformation: 'Additional Information',
        allergies: 'Is there any food allergies or restrictions we should be aware of?',
        occasion: 'If this is for any special occasion (e.g. birthday celebration 🎂), you can let us know:',
        allergiesSummary: 'Allergies/Restrictions:',
        occasionSummary: 'Occasion:',
        specialRequestsSummary: 'Special Requests:',
        othersSummary: 'Others:',
        specialRequests: 'Special requests (click any that applies):',
        biggerPortion: 'Bigger portion please',
        vegetarian: 'Some guest(s) is vegetarian',
        dairyFree: 'Some guest(s) cannot take dairy such as cheese or cream',
        highChair: 'Need high chair',
        wheelchairAccess: 'Need wheelchair access',
        hasPet: 'Has pet',
        others: 'Others:',
        summaryHeading: (courses, price) => `You have selected the <span id="course-count-display">${courses}</span> course menu (<span id="menu-price-display">${price}</span>) with the following dishes:`,
        pageTitle: 'Gratiné Private Kitchen Menu',
        chooseOnePerGuest: '[Choose one per guest]',
        shareAmongTable: '[To share among the table]',
        selectUpTo: (max, category, selected) => `Please select up to ${max} ${category.toLowerCase()} (${selected} selected)`,
        selectStarters: (max, selected) => `Please select ${max} starters for sharing (${selected} selected)`,
        selected: 'selected',
        totalQuantityError: (category, total, adults) => `Total quantity for ${category} (${total}) exceeds the number of adults (${adults}).`,
        noItems: category => `No items found for ${category}.`,
        noMenusAvailable: 'No menus available for this type',
        noServingStyleItems: 'No items available for this serving style.',
        menuDataMissing: 'Main courses data is missing.',
        loadingPhotos: 'Photos being loaded...',
        sendMenu: 'Send Menu Selection',
        sendMenuTop: 'Send Menu Selection (Top)',
        submitWhatsApp: 'Submit (via WhatsApp)',
        submitWhatsAppTop: 'Send via WhatsApp (Top)',
        submissionNote: '(Changes can still be made with the chef as needed after this submission 😉)',
        dishStory: 'Dish story',
        dishStoryTooltip: 'Click to watch the dish origin story',
        suggestedWine: 'Suggested Wine Pairing',
        tapForDetails: 'Tap for more details',
        originStory: item => `${item}: origin story`,
        versionLoading: 'Release: loading...',
        versionUnavailable: 'Release: unavailable',
        errorLoadingMenu: 'There was a problem loading the menu. This might be a temporary network issue. Please try refreshing the page.',
        errorInitializingMenu: error => `Error initializing menu: ${error}`,
        invalidDatePast: 'This date is already in the past',
        invalidDateFuture: 'Please select a date up to 3 months in advance.',
        capacityError: max => `The combined number of adults and children cannot exceed ${max}.`,
        quantityPlaceholder: '[Optional] #Guests?',
        addonQuantityPlaceholder: '#Portions:',
        zeroNone: '0 (None)',
        arrivalTimeLabel: 'Arrival Time:', adultsLabel: '#Adults:', kidsLabel: '#Kids:', toddlersLabel: '#Toddlers:', selectedMenuLabel: 'Selected Menu:', myChoices: 'My choices:', requiredFieldsError: 'Please fill in all required fields in the booking form.', sending: 'Sending...', emailSuccess: 'Menu selection has been sent successfully via Email!', testDataSuccess: 'Test data populated. Please select menu items.',
        emailFailure: error => `Failed to send menu selection via Email. ${error}`, whatsappFailure: error => `Failed to prepare WhatsApp message. ${error}`
    },
    'zh-HK': {
        language: '語言：',
        languageAlt: '語言',
        chooseLanguage: '選擇語言',
        english: 'English',
        chineseHongKong: '繁體中文（香港）',
        reservationDetails: '預約資料',
        yourName: '姓名：',
        contactNumber: '聯絡電話：',
        bookingDate: '預約日期：',
        arrivalTime: '抵達時間：',
        arrivalTimePlaceholder: '例如：晚上約七時',
        arrivalTimeReminderPrefix: '關於您的預約資料，我們還需要知道您的',
        arrivalTimeReminderLink: '抵達時間',
        arrivalTimeReminderSuffix: '。',
        adults: '成人數目 👩🏻：',
        children: '小童數目 🧒🏻：（5 至 12 歲）',
        toddlers: '幼童數目 👶🏻：（4 歲或以下）',
        selectAdults: '請選擇成人數目',
        menuCourses: '請選擇套餐菜式數目：',
        priceNote: '價格包括茶／咖啡、免開瓶費及切餅費，另加 10% 服務費。',
        soups: '湯品',
        soupsDescription: '請選擇最多兩款湯品供客人選擇⋯⋯',
        starters: '前菜',
        startersDescription: '前菜主要供客人分享，所有客人將享用相同菜式。我們提供多款前菜，選擇更多菜式的套餐即可品嚐更多款式。:-)',
        mains: '主菜',
        mainsDescription: '主菜可選擇個人上菜或家庭式分享。個人上菜較為常見，而家庭式分享則更適合一同享用，例如招牌肉拼盤可讓大家品嚐多款肉類。',
        individual: '個人上菜',
        sharing: '家庭式分享',
        sharingHelper: '（成人超過 8 位時，可選擇兩款分享主菜。）',
        desserts: '甜品',
        dessertsDescription: '請選擇最多兩款甜品供客人選擇⋯⋯',
        addons: '追加菜式（可選）',
        addonsDescription: '想為主菜加添更多美食？可選擇以下追加菜式，令用餐體驗更豐富⋯⋯ 😉',
        additionalInformation: '其他資料',
        allergies: '有任何食物敏感或飲食限制需要我們注意嗎？',
        occasion: '如為特別場合（例如生日慶祝 🎂），歡迎告訴我們：',
        allergiesSummary: '食物敏感／飲食限制：',
        occasionSummary: '特別場合：',
        specialRequestsSummary: '特別要求：',
        othersSummary: '其他：',
        specialRequests: '特別要求（可選擇適用項目）：',
        biggerPortion: '請提供較大份量',
        vegetarian: '有客人是素食者',
        dairyFree: '有客人不能進食奶類製品，例如芝士或忌廉',
        highChair: '需要嬰兒餐椅',
        wheelchairAccess: '需要輪椅通道',
        hasPet: '有寵物同行',
        others: '其他：',
        summaryHeading: (courses, price) => `您已選擇 <span id="course-count-display">${courses}</span> 道菜套餐（<span id="menu-price-display">${price}</span>），菜式如下：`,
        pageTitle: 'Gratiné 私房菜套餐',
        chooseOnePerGuest: '[每位客人選擇一款]',
        shareAmongTable: '[供全桌分享]',
        selectUpTo: (max, category, selected) => `請選擇最多 ${max} 款${category}（已選 ${selected} 款）`,
        selectStarters: (max, selected) => `請選擇 ${max} 款前菜供分享（已選 ${selected} 款）`,
        selected: '已選',
        totalQuantityError: (category, total, adults) => `${category} 總數量（${total}）超過成人數目（${adults}）。`,
        noItems: category => '找不到' + category + '菜式。',
        noMenusAvailable: '沒有適用於此類型的套餐。',
        noServingStyleItems: '沒有適用於此上菜方式的菜式。',
        menuDataMissing: '缺少主菜資料。',
        loadingPhotos: '正在載入相片⋯⋯',
        sendMenu: '提交套餐選擇',
        sendMenuTop: '提交套餐選擇（頂部）',
        submitWhatsApp: '透過 WhatsApp 提交',
        submitWhatsAppTop: '透過 WhatsApp 發送（頂部）',
        submissionNote: '（提交後如有需要，仍可與廚師商議更改 😉）',
        dishStory: '菜式故事',
        dishStoryTooltip: '點擊觀看菜式由來',
        suggestedWine: '建議配酒',
        tapForDetails: '點擊查看詳情',
        originStory: item => `${item}：菜式由來`,
        versionLoading: '版本：載入中⋯⋯',
        versionUnavailable: '版本：暫時無法取得',
        errorLoadingMenu: '載入菜單時出現問題，可能是暫時性的網絡問題。請嘗試重新整理頁面。',
        errorInitializingMenu: error => `初始化菜單時出現問題：${error}`,
        invalidDatePast: '此日期已經過去',
        invalidDateFuture: '請選擇未來三個月內的日期。',
        capacityError: max => `成人及小童總數不可超過 ${max} 位。`,
        quantityPlaceholder: '[可選] 客人人數？',
        addonQuantityPlaceholder: '份數：',
        zeroNone: '0（沒有）',
        arrivalTimeLabel: '抵達時間：', adultsLabel: '成人：', kidsLabel: '小童：', toddlersLabel: '幼童：', selectedMenuLabel: '所選套餐：', myChoices: '我的選擇：', requiredFieldsError: '請填寫預約表格中的所有必填資料。', sending: '發送中⋯⋯', emailSuccess: '套餐選擇已成功透過電郵發送！', testDataSuccess: '測試資料已填妥，請選擇菜式。',
        emailFailure: error => `套餐選擇未能透過電郵發送。${error}`, whatsappFailure: error => `未能準備 WhatsApp 訊息。${error}`
    }
};

function getInitialLanguage() {
    const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
    const savedLanguage = localStorage.getItem('menu-language');
    return supportedLanguages.includes(requestedLanguage)
        ? requestedLanguage
        : supportedLanguages.includes(savedLanguage) ? savedLanguage : 'en';
}

function t(key, ...args) {
    const value = translations[currentLanguage][key] ?? translations.en[key] ?? key;
    return typeof value === 'function' ? value(...args) : value;
}

function getLocalizedItemValue(item, englishKey, chineseKey) {
    if (currentLanguage === 'zh-HK' && item[chineseKey]?.trim()) {
        return item[chineseKey].trim();
    }
    return item[englishKey] || '';
}

function updateLocalizedSummaryHeading() {
    const summaryHeading = document.getElementById('summary-heading');
    const courseCountDisplay = document.getElementById('course-count-display');
    const menuPriceDisplay = document.getElementById('menu-price-display');
    if (!summaryHeading || !courseCountDisplay || !menuPriceDisplay) return;

    summaryHeading.innerHTML = t('summaryHeading', courseCountDisplay.textContent, menuPriceDisplay.textContent);
}

function applyLanguage(language) {
    currentLanguage = supportedLanguages.includes(language) ? language : 'en';
    document.documentElement.lang = currentLanguage;
    document.title = t('pageTitle');

    const usefulInfoImage = document.getElementById('useful-info-image-content');
    if (usefulInfoImage) {
        usefulInfoImage.src = currentLanguage === 'zh-HK'
            ? 'images/Gratine menu - Useful Info Jun2025 (Zh).png'
            : 'images/Gratine menu - Useful Info Jun2025.png';
        usefulInfoImage.alt = currentLanguage === 'zh-HK' ? '實用資料' : 'Useful Information';
    }

    const menuOptionsImage = document.getElementById('menu-options-image-content');
    if (menuOptionsImage) {
        menuOptionsImage.src = currentLanguage === 'zh-HK'
            ? 'images/Gratine menu - Options Jun2025 (Zh).png'
            : 'images/Gratine menu - Options Jun2025.png';
        menuOptionsImage.alt = currentLanguage === 'zh-HK' ? '菜單選項' : 'Menu Options';
    }

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        element.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
        element.alt = t(element.dataset.i18nAlt);
    });

    const languageSelect = document.getElementById('language-select');
    if (languageSelect) languageSelect.value = currentLanguage;
    const languageLabel = document.getElementById('current-language-label');
    if (languageLabel) languageLabel.textContent = t(currentLanguage === 'zh-HK' ? 'chineseHongKong' : 'english');
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.toggle('active', option.dataset.language === currentLanguage);
    });
    updateLocalizedSummaryHeading();
    loadAppVersion();
}

function renderLocalizedMenus() {
    if (!window.menuData) return;

    Object.keys(courseConfig).forEach(category => {
        if (category === 'mains') return;
        const container = document.getElementById(category);
        if (!container) return;
        container.innerHTML = '';
        const items = window.menuData[category] || [];
        if (items.length > 0) {
            items.forEach(item => container.appendChild(createMenuItem(item, category)));
        } else {
            container.innerHTML = `<div class="error">${t('noItems', t(category))}</div>`;
        }
        updateSelectionCount(category);
    });
    updateMainCourseDisplay(false);
}

function setupLanguageControls() {
    const languageSelect = document.getElementById('language-select');
    const languageToggle = document.getElementById('language-toggle');
    const languagePanel = document.getElementById('language-panel');
    if (!languageSelect || !languageToggle || !languagePanel) return;
    languageSelect.value = currentLanguage;
    languageToggle.addEventListener('click', () => {
        const isOpen = !languagePanel.hidden;
        languagePanel.hidden = isOpen;
        languageToggle.setAttribute('aria-expanded', String(!isOpen));
    });
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', () => {
            languageSelect.value = option.dataset.language;
            languageSelect.dispatchEvent(new Event('change'));
            languagePanel.hidden = true;
            languageToggle.setAttribute('aria-expanded', 'false');
        });
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.language-selector')) {
            languagePanel.hidden = true;
            languageToggle.setAttribute('aria-expanded', 'false');
        }
    });
    languageSelect.addEventListener('change', event => {
        currentLanguage = event.target.value;
        localStorage.setItem('menu-language', currentLanguage);
        applyLanguage(currentLanguage);
        const mealType = (new URLSearchParams(window.location.search).get('Meal') || 'dinner').toLowerCase();
        populateCourseCountDropdown(mealType === 'lunch' ? 'lunch' : 'dinner');
        renderLocalizedMenus();
        updateSummary();
        updateButtonStates();
    });
}

// Configuration object for course selections
const courseConfig = {
    soups: {
        maxSelections: 2,
        allowMultiple: true,
        displayName: 'Soups', // e.g. "Please select up to 2 soup items for your guests to choose from..."
        required: true,
        summaryCaption: '[Choose one per guest]'
    },
    starters: {
        maxSelections: 2, // This will be updated by courseCountChange
        allowMultiple: true,
        displayName: 'Starters', // e.g. "Our starters are mainly designed to be shared and everyone will be served the same."
        required: true,
        summaryCaption: '[To share among your table]'
    },
    mains: {
        maxSelections: 2, // Can be 1 or 2 for sharing
        allowMultiple: true,
        displayName: 'Main Courses', // e.g. "For the main course, you have the option of individual plating or family-style."
        required: true,
        summaryCaption: '' // Dynamic based on serving style
    },
    desserts: {
        maxSelections: 2,
        allowMultiple: true,
        displayName: 'Desserts', // e.g. "You can select up to 2 dessert items for your guests to choose from..."
        required: true,
        summaryCaption: '[Choose one per guest]'
    },
    addons: {
        maxSelections: 99, // Effectively unlimited for practical purposes
        allowMultiple: true,
        displayName: 'Add-ons',
        required: false, // Users can select zero add-ons
        summaryCaption: ''
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
    const PUBLISHED_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQp_lmQ3G1BBHVC5Lotsbtid6IO9kA83VGmKeI2e_Q31_LXtsFM8v2ZyvloRxo7FMixbu46ofyPq9JF/pub?gid=0&single=true&output=csv';
    const timestamp = new Date().getTime();
    const urlWithCacheBust = `${PUBLISHED_CSV_URL}&_=${timestamp}`;
    console.log('Fetching menu data...');

    // Helper to fetch with a timeout to prevent hanging requests.
    const fetchWithTimeout = async (url, timeout = 8000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            if (!text || text.trim() === '') {
                throw new Error('Empty response');
            }
            console.log(`Successfully fetched from: ${url.substring(0, 40)}...`);
            return text;
        } catch (error) {
            clearTimeout(id);
            console.log(`Fetch attempt failed for ${url.substring(0, 40)}...: ${error.message}`);
            throw new Error(`Failed to fetch from ${url}`);
        }
    };

    const liveEndpoints = [
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(urlWithCacheBust),
        'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(urlWithCacheBust),
        'https://corsproxy.io/?url=' + encodeURIComponent(urlWithCacheBust),
        'https://api.cors.lol/?url=' + encodeURIComponent(urlWithCacheBust),
        urlWithCacheBust // Direct attempt
    ];

    let csvText = null;

    // 1. Prefer the live Google Sheet so the latest data shows when available.
    const liveAttempt = Promise.any(liveEndpoints.map(url => fetchWithTimeout(url)));
    const liveDeadline = new Promise((_, reject) => setTimeout(() => reject(new Error('Live menu fetch deadline reached')), 5000));
    try {
        csvText = await Promise.race([liveAttempt, liveDeadline]);
    } catch (error) {
        console.warn('Live menu data fetch failed; falling back to cached menu.csv.', error);
    }

    // 2. Fall back to the same-origin snapshot published at deploy time.
    if (!csvText) {
        try {
            csvText = await fetchWithTimeout(`menu.csv?cache=${timestamp}`);
        } catch (error) {
            console.warn('Cached menu.csv fallback also failed.', error);
        }
    }

    if (!csvText) {
        console.error('All menu data fetch attempts failed. This is expected if all proxies and the direct link are down.');
        const container = document.querySelector('.container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = t('errorLoadingMenu');
            document.querySelectorAll('.loading').forEach(el => el.remove());
            container.appendChild(errorDiv);
        }
        return null; // Return null to signal failure to the caller
    }

    // PapaParse the successful response.
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            // Add transformHeader to trim whitespace from header keys.
            // This prevents issues where a header like " WinePairing " doesn't match the expected "WinePairing" key.
            transformHeader: header => {
                return header.trim();
            },
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    console.log('Raw CSV data (first 3 rows):', results.data.slice(0, 3));
                    resolve(processCSVData(results.data));
                } else {
                    reject(new Error('No data found in CSV after parsing.'));
                }
            },
            error: (error) => {
                console.error('PapaParse error:', error);
                reject(new Error('Error parsing CSV data: ' + error.message));
            }
        });
    });
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
            nameZh: row.NameZh || '',
            description: row.Description || '',
            descriptionZh: row.DescriptionZh || '',
            image: getDirectImageUrl(row['Image URL']),
            upgradePrice: parseFloat(row['Upgrade Price']) || 0,
            upgradeCaption: row['Upgrade Caption'] || '',
            additionalRemarks: row.AdditionalRemarks || '',
            additionalRemarksZh: row.AdditionalRemarksZh || '',
            servingStyle: (row['ServingStyle'] || 'individual').toLowerCase().trim(),
            isSignature: ['TRUE', 'YES', '1'].includes(String(row.IsSignature).toUpperCase()),
            mealAvailability: (row['MealAvailability'] || 'Both').toLowerCase().trim(),
            remarksColor: row.RemarksColor || null,
            winePairing: row.WinePairing || '', // Read the new WinePairing column
            winePairingRationale: row.WinePairingRationale || '', // Read new rationale, defaulting to an empty string
            winePairingRationaleZh: row.WinePairingRationaleZh || '',
            historyVideoUrl: row.HistoryVideoURL ? row.HistoryVideoURL.trim() : ''
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
    const itemName = getLocalizedItemValue(item, 'name', 'nameZh');
    const itemDescription = getLocalizedItemValue(item, 'description', 'descriptionZh');
    const additionalRemarks = getLocalizedItemValue(item, 'additionalRemarks', 'additionalRemarksZh');
    const winePairingRationale = getLocalizedItemValue(item, 'winePairingRationale', 'winePairingRationaleZh');

    let quantityDropdownHTML = '';
    if (!isReadonly && category === 'addons') {
        let optionsHTML = `<option value="" disabled selected>${t('addonQuantityPlaceholder')}</option>`;
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
                <option value="" disabled selected>${t('quantityPlaceholder')}</option>
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

    // Prepare wine pairing info for the card
    let winePairingCardHTML = '';
    if (item.winePairing && !isReadonly) {
        const hasRationale = winePairingRationale && winePairingRationale.trim() !== '';
        const containerClass = hasRationale ? 'wine-pairing-container' : 'wine-pairing-container disabled';
        const tooltipAttr = hasRationale ? `data-tooltip="${winePairingRationale}"` : '';
        const displayText = hasRationale
            ? `🍷 ${t('suggestedWine')}: ${item.winePairing} (${t('tapForDetails')})`
            : `🍷 ${t('suggestedWine')}: ${item.winePairing}`;

        // The data-tooltip attribute will hold the text for the CSS tooltip
        winePairingCardHTML = `
            <div class="${containerClass}" ${tooltipAttr}>
                <span class="wine-pairing-card-info">${displayText}</span>
            </div>`;
    }

    div.innerHTML = `
        <input type="checkbox" id="item-${item.id}" ${isChecked ? 'checked' : ''} style="z-index: 3;" ${isReadonly ? 'disabled' : ''}>
        <img src="${item.image}" alt="${itemName}" onerror="this.src='https://placehold.co/250x250/eeeeee/cccccc?text=No+Image'" class="menu-image">
        <h3>${itemName}${item.isSignature ? ' ⭐' : ''}</h3>
        <p>${itemDescription}${upgradePriceText ? `<br><b class="price-upgrade">${upgradePriceText}</b>` : ''}</p>
        ${winePairingCardHTML}
        ${additionalRemarks ? `<div class="ribbon" ${ribbonStyle}><span>${additionalRemarks}</span></div>` : ''}
        ${quantityDropdownHTML}
    `;

    if (item.historyVideoUrl) {
        const historyVideoButton = document.createElement('button');
        historyVideoButton.type = 'button';
        historyVideoButton.className = 'history-video-button';
        historyVideoButton.setAttribute('aria-label', `${t('dishStory')}: ${itemName}`);
        historyVideoButton.setAttribute('data-tooltip', t('dishStoryTooltip'));
        historyVideoButton.innerHTML = `<span>${t('dishStory')}</span><img src="images/HistoryVideoIcon1.png" alt="">`;
        historyVideoButton.addEventListener('click', event => {
            event.stopPropagation();
            openHistoryVideoModal(item.historyVideoUrl, itemName, historyVideoButton);
        });
        div.appendChild(historyVideoButton);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const mealType = (urlParams.get('Meal') || 'dinner').toLowerCase();

    if (item.mealAvailability !== 'both' && item.mealAvailability !== mealType) {
        div.style.display = 'none';
    }

    // Add click listener for the wine pairing tooltip
    const winePairingContainer = div.querySelector('.wine-pairing-container:not(.disabled)');
    if (winePairingContainer) {
        winePairingContainer.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the menu item from being selected

            // Close any other open tooltips first
            document.querySelectorAll('.wine-pairing-container.show-tooltip').forEach(el => {
                if (el !== winePairingContainer) {
                    el.classList.remove('show-tooltip');
                }
            });
            // Then toggle the current one
            winePairingContainer.classList.toggle('show-tooltip');
        });
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
        if (event.target.matches('input[type="checkbox"]') || event.target.matches('select.quantity-select') || event.target.matches('select.quantity-select option') || event.target.closest('.history-video-button')) {
            return; // Let the specific handlers work
        }
        if (!checkbox.disabled) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
    
    return div;
}

function getYouTubeVideoId(value) {
    const input = value.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;

    try {
        const url = new URL(input);
        if (url.hostname === 'youtu.be') return url.pathname.slice(1, 12);
        if (url.hostname.endsWith('youtube.com')) {
            if (url.pathname === '/watch') return url.searchParams.get('v');
            if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2];
            if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
        }
    } catch (error) {
        console.warn('Invalid history video URL:', value);
    }

    return '';
}

function openHistoryVideoModal(videoUrl, itemName, triggerButton) {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) {
        console.warn(`Unable to parse history video URL for ${itemName}:`, videoUrl);
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'history-video-overlay';
    overlay.innerHTML = `
        <div class="history-video-modal" role="dialog" aria-modal="true" aria-labelledby="history-video-title">
            <div class="history-video-header">
                <h2 id="history-video-title"></h2>
                <button type="button" class="history-video-close" aria-label="Close video">&times;</button>
            </div>
            <div class="history-video-frame">
                <iframe
                    src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&playsinline=1"
                    title="Origin story for ${itemName}"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen></iframe>
            </div>
        </div>`;
    overlay.querySelector('#history-video-title').textContent = t('originStory', itemName);
    document.body.appendChild(overlay);

    const closeModal = () => {
        overlay.remove();
        document.removeEventListener('keydown', handleKeydown);
        triggerButton?.focus();
    };
    const handleKeydown = event => {
        if (event.key === 'Escape') closeModal();
    };

    overlay.querySelector('.history-video-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeModal();
    });
    document.addEventListener('keydown', handleKeydown);
    overlay.querySelector('.history-video-close').focus();
}

function updateQuantityDropdown(selectElement) {
    if (!selectElement) return;
    const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
    const currentVal = selectElement.value;

    selectElement.innerHTML = `<option value="" disabled>${t('quantityPlaceholder')}</option>`;
    for (let i = 0; i <= adultCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === 0 ? t('zeroNone') : i;
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
    const categoryName = t(category);
    
    if (category === 'starters') {
        countElement.textContent = t('selectStarters', maxCount, selectedCount);
    } else {
        countElement.textContent = category === 'addons' ? '' : t('selectUpTo', maxCount, categoryName, selectedCount);
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
        const categoryDisplayName = t(category);
        const items = selectedItems[category];
        const errorElement = document.getElementById(`${category}-quantity-error`);

        if (!items || (Array.isArray(items) && items.length === 0)) {
            if (errorElement) errorElement.style.display = 'none'; // Hide error if no items selected
            return;
        }

        let caption = config.summaryCaption || '';
        if (category === 'mains') {
            if (currentServingStyle === 'individual') {
                caption = t('chooseOnePerGuest');
            } else if (currentServingStyle === 'sharing') {
                caption = t('shareAmongTable');
            }
        } else if (category === 'soups' || category === 'desserts') {
            caption = t('chooseOnePerGuest');
        } else if (category === 'starters') {
            caption = t('shareAmongTable');
        }

        html += `<p><strong>${categoryDisplayName}</strong> ${caption ? `<span style="font-weight: normal; font-style: italic; font-size: 0.9em; color: blue;">${caption}</span>` : ''}:</p>`;

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

                const itemName = getLocalizedItemValue(item, 'name', 'nameZh');
                html += `<p>• ${itemName} ${quantity > 0 ? `(x${quantity})` : ''} ${priceInfo}</p>`;
            }
        });
        
        const isQuantityValidationApplicable = category !== 'starters' && category !== 'addons' && (category !== 'mains' || currentServingStyle === 'individual');

        if (isQuantityValidationApplicable && totalQuantityInCategory > adultCount && adultCount > 0) {
            if (errorElement) {
                errorElement.textContent = t('totalQuantityError', categoryDisplayName, totalQuantityInCategory, adultCount);
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

    if (allergies) html += `<p><strong>${t('allergiesSummary')}</strong> ${allergies}</p>`;
    if (occasion) html += `<p><strong>${t('occasionSummary')}</strong> ${occasion}</p>`;
    
    let specialRequestsSummary = specialRequestsChecked.join(', ');
    if (othersRequestValue) {
        specialRequestsSummary += (specialRequestsSummary ? ', ' : '') + `${t('othersSummary')} ${othersRequestValue}`;
    }
    if (specialRequestsSummary) {
        html += `<p><strong>${t('specialRequestsSummary')}</strong> ${specialRequestsSummary}</p>`;
    }
    
    updateLocalizedSummaryHeading();
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

function updateMainCourseDisplay(resetSelections = true) {
    const mainsContainer = document.getElementById('mains');
    if (!window.menuData || !window.menuData.mains) {
        console.error("Menu data for mains not available for display update.");
        if (mainsContainer) mainsContainer.innerHTML = `<div class="error">${t('menuDataMissing')}</div>`;
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
    if (resetSelections) {
        selectedItems.mains = [];
        clearItemQuantitiesForCategory('mains');
    }


    const itemsToDisplay = window.menuData.mains[servingStyle];
    if (itemsToDisplay && itemsToDisplay.length > 0) {
        itemsToDisplay.forEach(item => {
            mainsContainer.appendChild(createMenuItem(item, 'mains'));
        });
    } else {
        mainsContainer.innerHTML = `<div class="error">${t('noServingStyleItems')}</div>`;
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
    const mealType = urlParams.get('Meal');
    populateCourseCountDropdown(mealType && mealType.toLowerCase() === 'lunch' ? 'lunch' : 'dinner');
}

function populateCourseCountDropdown(mealType) {
    const courseCountSelect = document.getElementById('course-count');
    const previousValue = courseCountSelect.value;
    courseCountSelect.innerHTML = ''; // Clear existing options

    let defaultSelected = false;
    const availableOptions = [];

    for (const count in courseCountAvailability) {
        const optionData = courseCountAvailability[count];
        if (optionData.meals.includes('both') || optionData.meals.includes(mealType)) {
            const price = menuPrices[count];
            const starterLabel = currentLanguage === 'zh-HK'
                ? `${optionData.starterCount} 款前菜`
                : `${optionData.starterCount} ${optionData.starterCount === 1 ? 'starter' : 'starters'}`;
            const optionLabel = currentLanguage === 'zh-HK'
                ? `${count} 道菜套餐 - ${starterLabel}（$${price}）`
                : optionData.label;
            availableOptions.push({ value: count, text: optionLabel, isDefault: optionData.isDefault });
        }
    }
    
    if (availableOptions.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = t('noMenusAvailable');
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

        if (availableOptions.some(option => option.value === previousValue)) {
            courseCountSelect.value = previousValue;
        }

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
            el.innerHTML = `<div class="loading">${t('loadingPhotos')}</div>`;
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
                    container.innerHTML = `<div class="error">${t('noItems', t(category))}</div>`;
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
                container.innerHTML += `<div class="error">${t('errorInitializingMenu', error.message)}</div>`;
            }
        }
    }
}


function updateBookingDateLabel() { // This function seems to be for a hidden meal input, which is not present.
                                   // The label text is static in HTML. If dynamic update is needed, HTML needs adjustment.
    const urlParams = new URLSearchParams(window.location.search);
    const mealType = (urlParams.get('Meal') || 'dinner').toLowerCase();
    // Example: If you had <span id="meal-type-display"> in your label:
    // const mealTypeDisplayElement = document.getElementById('meal-type-display');
    // if (mealTypeDisplayElement) mealTypeDisplayElement.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function setupDatePicker() {
    const dateInput = document.getElementById('booking-date');
    const dateError = document.getElementById('date-error');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day for comparison

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Max 3 months in advance
    maxDate.setHours(23,59,59,999);

    const formatDateForInput = (date) => date.toISOString().split('T')[0];

    dateInput.min = formatDateForInput(new Date()); // min attribute should be today's actual date
    dateInput.max = formatDateForInput(maxDate);

    dateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value + "T00:00:00"); // Ensure time part for comparison
        dateError.textContent = '';
        dateError.style.display = 'none';

        if (selectedDate < today || selectedDate > maxDate) {

            dateError.textContent = (selectedDate < today) ? t('invalidDatePast') : t('invalidDateFuture');
            dateError.style.display = 'block';
            // e.target.value = ''; // Clear invalid date
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

            // // Special logic for dessert selection based on adult count
            // const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
            // const originalMaxDesserts = courseConfig.desserts.maxSelections; // Read from config
            // const newMaxDesserts = (adultCount === 2) ? 2 : originalMaxDesserts;

            // if (courseConfig.desserts.maxSelections !== newMaxDesserts) {
            //     courseConfig.desserts.maxSelections = newMaxDesserts;

            //     // Reset selections for desserts if they exceed the new max
            //     if (selectedItems.desserts.length > newMaxDesserts) {
            //         const itemsToKeep = selectedItems.desserts.slice(0, newMaxDesserts);
            //         const itemsToDeselect = selectedItems.desserts.slice(newMaxDesserts);
                    
            //         selectedItems.desserts = itemsToKeep;

            //         itemsToDeselect.forEach(item => {
            //             const itemDiv = document.querySelector(`#desserts .menu-item[data-id="${item.id}"]`);
            //             if (itemDiv) {
            //                 itemDiv.classList.remove('selected');
            //                 const checkbox = itemDiv.querySelector('input[type="checkbox"]');
            //                 if (checkbox) checkbox.checked = false;
            //             }
            //         });
            //     }
            //     updateSelectionCount('desserts');
            // }
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
        errorElement.textContent = t('capacityError', MAX_CAPACITY);
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

    // Nudge the user when everything else is filled but the arrival time is missing.
    const arrivalTimeReminder = document.getElementById('arrival-time-reminder');
    if (arrivalTimeReminder) {
        const missingOnlyArrivalTime = name && contactNumber && bookingDate && !arrivalTime && adultCountVal && courseCountVal;
        arrivalTimeReminder.hidden = !missingOnlyArrivalTime;
    }

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
    
    // Clicking the reminder focuses the arrival-time input.
    const arrivalTimeReminderLink = document.getElementById('arrival-time-reminder-link');
    if (arrivalTimeReminderLink) {
        arrivalTimeReminderLink.addEventListener('click', (event) => {
            event.preventDefault();
            const arrivalTimeInput = document.getElementById('arrival-time');
            if (arrivalTimeInput) {
                arrivalTimeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                arrivalTimeInput.focus();
            }
        });
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

function renderVersionLabel() {
    const versionElement = document.getElementById('app-version');
    if (!versionElement) return;
    versionElement.textContent = cachedReleaseVersion
        ? `${currentLanguage === 'zh-HK' ? '版本' : 'Release'}: ${cachedReleaseVersion}`
        : t('versionUnavailable');
}

async function loadAppVersion() {
    if (versionLoadAttempted) {
        renderVersionLabel();
        return;
    }
    versionLoadAttempted = true;

    const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
    if (isLocalHost) {
        renderVersionLabel();
        return;
    }

    try {
        const response = await fetch(`version.json?cache=${Date.now()}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Version file returned ${response.status}`);

        const version = await response.json();
        cachedReleaseVersion = version.release || null;
    } catch (error) {
        console.warn('Unable to load the app release version:', error);
        cachedReleaseVersion = null;
    }
    renderVersionLabel();
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


    const menuPriceDisplayEl = document.getElementById('menu-price-display');
    const menuPriceDisplay = menuPriceDisplayEl ? menuPriceDisplayEl.textContent : '$0';

    if (!name || !contactNumber || !bookingDate || !arrivalTime || !adultCount || !courseCountSelectedValue) {
        throw new Error(t('requiredFieldsError'));
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
        btn.textContent = t('sending');
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
        alert(t('emailSuccess'));
    } catch (error) {
        console.error('Error sending email:', error);
        alert(t('emailFailure', error.message));
    } finally {
        allEmailButtons.forEach(btn => {
            btn.textContent = btn.dataset.originalText || (btn.id.includes('top') ? t('sendMenuTop') : t('sendMenu'));
        });
        updateButtonStates(); // Re-evaluate button states
    }
}

function sendWhatsApp() {
    try {
        const data = getSharedMessageData();
        const message = `Hi, this is *${data.name}* regarding my menu selection for *${data.bookingDate}*.\n\n` +
            `*${t('arrivalTimeLabel')}* ${data.arrivalTime}\n` +
            `*${t('adultsLabel')}* ${data.adultCount}\n` +
            `*${t('kidsLabel')}* ${data.kidCount}\n` +
            `*${t('toddlersLabel')}* ${data.toddlerCount}\n` +
            `*${t('selectedMenuLabel')}* ${data.courseCountLabel} (${data.menuPriceDisplay})\n\n` +
            `${t('myChoices')}\n${data.formattedItems}`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = '85263982618'; // Replace with your actual WhatsApp number
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        console.log("WhatsApp URL:", whatsappUrl);
        window.open(whatsappUrl, '_blank');

        // Implicitly send an email as a backup or notification
        sendEmail().catch(err => console.error("Error sending implicit email via WhatsApp action:", err));

    } catch (error) {
        console.error('Error preparing WhatsApp message:', error);
        alert(t('whatsappFailure', error.message));
    }
}

// --- DOMContentLoaded ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded, initializing menu builder...');
    applyLanguage(currentLanguage);
    setupLanguageControls();

    const urlParams = new URLSearchParams(window.location.search);
    // Case-insensitive check for 'readonly' parameter
    isReadonly = [...urlParams.keys()].some(key => key.toLowerCase() === 'readonly');

    if (isReadonly) {
        applyReadonlyMode();
    }

    setupDatePicker();
    updateTitleBasedOnQueryParam(); // Populates course count based on meal type (lunch/dinner)
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
                // Trigger change for booking date immediately to run validation
                if (id === 'booking-date') {
                    element.dispatchEvent(new Event('change'));
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
        alert(t('testDataSuccess'));
    });

    // Show dev tools if #dev is in URL
    if (window.location.hash === '#dev') {
        document.querySelectorAll('.dev-tools').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.test-btn').forEach(el => el.style.display = 'inline-block');
    }

    // Add a global click listener to close any open tooltips
    document.body.addEventListener('click', (e) => {
        if (!e.target.closest('.wine-pairing-container')) {
            document.querySelectorAll('.wine-pairing-container.show-tooltip').forEach(el => {
                el.classList.remove('show-tooltip');
            });
        }
    });
});