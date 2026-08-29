const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const SCRIPT = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

const WHATSAPP_NUMBER = '85263982618';

async function setupApp({ url = 'https://gratine-kitchen.github.io/menu-select/?lang=en' } = {}) {
    const dom = new JSDOM(HTML, {
        runScripts: 'outside-only',
        url,
        pretendToBeVisual: true
    });
    const { window } = dom;

    // Browser globals the app relies on at runtime.
    window.AbortController = global.AbortController;
    window.fetch = async () => ({
        ok: true,
        status: 200,
        text: async () => 'Category,ID,Name,IsActive\n',
        json: async () => ({ release: '2026.08.30-test', commit: 'abc1234' })
    });
    window.Papa = { parse: (_text, options) => options.complete({ data: [] }) };
    window.emailjs = {
        init: () => {},
        send: async (service, template, params) => {
            window.__lastEmail = { service, template, params };
            return { status: 200 };
        }
    };
    window.open = targetUrl => { window.__lastOpenUrl = targetUrl; };

    window.eval(SCRIPT);

    // The app bootstraps on DOMContentLoaded.
    window.dispatchEvent(new window.Event('DOMContentLoaded'));
    await new Promise(resolve => setTimeout(resolve, 30));

    return window;
}

function fillForm(window, overrides = {}) {
    const future = new Date();
    future.setDate(future.getDate() + 2);

    window.document.getElementById('customer-name').value = overrides.name || 'Test User';
    window.document.getElementById('contact-number').value = overrides.contact || '12345678';
    window.document.getElementById('booking-date').value = overrides.date || future.toISOString().split('T')[0];
    window.document.getElementById('arrival-time').value = overrides.time || '7:30 PM';
    window.document.getElementById('adult-count').value = overrides.adults || '4';
    window.document.getElementById('adult-count').dispatchEvent(new window.Event('change'));
}

function makeItem(id, name, extra = {}) {
    return {
        id,
        name,
        nameZh: '',
        description: '',
        descriptionZh: '',
        image: '',
        upgradePrice: 0,
        upgradeCaption: '',
        additionalRemarks: '',
        additionalRemarksZh: '',
        servingStyle: 'individual',
        isSignature: false,
        mealAvailability: 'both',
        remarksColor: null,
        winePairing: '',
        winePairingRationale: '',
        winePairingRationaleZh: '',
        historyVideoUrl: '',
        ...extra
    };
}

function findItem(menuData, category, id) {
    if (category === 'mains') {
        return [...menuData.mains.individual, ...menuData.mains.sharing].find(item => item.id === id);
    }
    return menuData[category].find(item => item.id === id);
}

function renderAndSelectRequiredItems(window) {
    window.menuData = {
        soups: [makeItem('S1', 'Soup')],
        starters: [makeItem('A1', 'Starter 1'), makeItem('A2', 'Starter 2'), makeItem('A3', 'Starter 3')],
        mains: { individual: [makeItem('M1', 'Main')], sharing: [] },
        desserts: [makeItem('D1', 'Dessert')],
        addons: []
    };
    window.renderLocalizedMenus();

    const selections = {
        soups: ['S1'],
        starters: ['A1', 'A2', 'A3'],
        mains: ['M1'],
        desserts: ['D1']
    };

    for (const [category, ids] of Object.entries(selections)) {
        const container = window.document.getElementById(category);
        for (const id of ids) {
            const element = container.querySelector(`.menu-item[data-id="${id}"]`);
            assert.ok(element, `expected rendered menu item ${id} in ${category}`);
            window.selectItem(findItem(window.menuData, category, id), category, element);
        }
    }
}

test('switching language does not break submission data collection', async () => {
    const window = await setupApp();
    fillForm(window);

    // This previously replaced the summary heading and removed the nested spans.
    window.applyLanguage('zh-HK');

    assert.ok(window.document.getElementById('menu-price-display'), 'menu-price-display should survive a language switch');
    assert.ok(window.document.getElementById('course-count-display'), 'course-count-display should survive a language switch');

    const data = window.getSharedMessageData();
    assert.equal(data.name, 'Test User');
    assert.equal(data.contactNumber, '12345678');
    assert.ok(data.menuPriceDisplay.startsWith('$'), 'menu price should be present');
});

test('sendEmail submits the expected template parameters', async () => {
    const window = await setupApp();
    fillForm(window);

    await window.sendEmail();

    assert.ok(window.__lastEmail, 'emailjs.send should have been called');
    assert.equal(window.__lastEmail.params.from_name, 'Test User');
    assert.equal(window.__lastEmail.params.contact_number, '12345678');
    assert.equal(window.__lastEmail.params.adult_count, '4');
    assert.ok(window.__lastEmail.params.selected_items_text !== undefined, 'selected items text should be included');
});

test('sendWhatsApp opens the wa.me link and sends a backup email', async () => {
    const window = await setupApp();
    fillForm(window);

    window.sendWhatsApp();

    assert.ok(window.__lastOpenUrl, 'window.open should have been called');
    assert.ok(window.__lastOpenUrl.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`), 'message should target the configured WhatsApp number');
    assert.ok(decodeURIComponent(window.__lastOpenUrl).includes('Test User'), 'message should include the customer name');

    await new Promise(resolve => setTimeout(resolve, 30));
    assert.ok(window.__lastEmail, 'backup email should be triggered');
    assert.equal(window.__lastEmail.params.from_name, 'Test User');
});

test('submit buttons enable once the form and required dishes are complete', async () => {
    const window = await setupApp();
    const emailButton = window.document.getElementById('send-email');
    const whatsappButton = window.document.getElementById('send-whatsapp');

    assert.equal(emailButton.disabled, true, 'email button should start disabled');
    assert.equal(whatsappButton.disabled, true, 'whatsapp button should start disabled');

    fillForm(window);
    window.updateButtonStates();
    assert.equal(emailButton.disabled, true, 'email button should stay disabled without dish selections');

    renderAndSelectRequiredItems(window);

    assert.equal(emailButton.disabled, false, 'email button should enable after required dishes are selected');
    assert.equal(whatsappButton.disabled, false, 'whatsapp button should enable after required dishes are selected');
});
