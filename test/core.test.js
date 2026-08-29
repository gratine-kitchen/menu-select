const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SCRIPT_PATH = path.join(__dirname, '..', 'script.js');

/**
 * Loads the browser script into an isolated context with minimal stubs and
 * exposes the pure helper functions for testing.
 */
function loadCore({ search = '', storedLanguage } = {}) {
    const store = {};
    if (storedLanguage) store['menu-language'] = storedLanguage;

    const sandbox = {
        console,
        URL,
        URLSearchParams,
        AbortController,
        setTimeout,
        clearTimeout,
        fetch: global.fetch,
        window: {
            location: { search },
            addEventListener() {}
        },
        localStorage: {
            getItem: key => (key in store ? store[key] : null),
            setItem: (key, value) => { store[key] = value; }
        },
        emailjs: { init() {} }
    };

    const source = fs.readFileSync(SCRIPT_PATH, 'utf8');
    const exportSource = source + `
;globalThis.__core = {
    translations,
    getLanguage: () => currentLanguage,
    setLanguage: (lang) => { currentLanguage = lang; },
    getInitialLanguage,
    t,
    getLocalizedItemValue,
    getYouTubeVideoId,
    processCSVData
};`;

    vm.createContext(sandbox);
    vm.runInContext(exportSource, sandbox, { filename: SCRIPT_PATH });

    return { core: sandbox.__core, store };
}

test('script loads without throwing and exposes core helpers', () => {
    const { core } = loadCore();
    assert.equal(typeof core.t, 'function');
    assert.equal(typeof core.getYouTubeVideoId, 'function');
    assert.equal(typeof core.processCSVData, 'function');
    assert.equal(core.getLanguage(), 'en');
});

test('getYouTubeVideoId parses supported URL formats', () => {
    const { core } = loadCore();
    const id = 'dQw4w9WgXcQ';

    assert.equal(core.getYouTubeVideoId(`https://www.youtube.com/watch?v=${id}`), id);
    assert.equal(core.getYouTubeVideoId(`https://youtu.be/${id}`), id);
    assert.equal(core.getYouTubeVideoId(`https://www.youtube.com/shorts/${id}`), id);
    assert.equal(core.getYouTubeVideoId(`https://www.youtube.com/embed/${id}`), id);
    assert.equal(core.getYouTubeVideoId(id), id);
});

test('getYouTubeVideoId returns an empty string for invalid input', () => {
    const { core } = loadCore();
    assert.equal(core.getYouTubeVideoId('not a url'), '');
    assert.equal(core.getYouTubeVideoId(''), '');
});

test('getLocalizedItemValue picks Chinese when available and falls back per field', () => {
    const { core } = loadCore();
    const item = {
        name: 'Tomato Soup',
        nameZh: '番茄湯',
        description: 'Fresh tomatoes',
        descriptionZh: '',
        extra: 'Extra'
    };

    core.setLanguage('en');
    assert.equal(core.getLocalizedItemValue(item, 'name', 'nameZh'), 'Tomato Soup');

    core.setLanguage('zh-HK');
    assert.equal(core.getLocalizedItemValue(item, 'name', 'nameZh'), '番茄湯');
    assert.equal(core.getLocalizedItemValue(item, 'description', 'descriptionZh'), 'Fresh tomatoes');
    assert.equal(core.getLocalizedItemValue(item, 'missing', 'missingZh'), '');
});

test('t returns translations and evaluates function values with arguments', () => {
    const { core } = loadCore();

    core.setLanguage('en');
    assert.equal(core.t('soups'), 'Soups');
    assert.equal(core.t('selectStarters', 3, 1), 'Please select 3 starters for sharing (1 selected)');

    core.setLanguage('zh-HK');
    assert.equal(core.t('soups'), '湯品');
    assert.equal(core.t('selectStarters', 3, 1), '請選擇 3 款前菜供分享（已選 1 款）');
});

test('t returns the key itself for unknown translation keys', () => {
    const { core } = loadCore();
    assert.equal(core.t('doesNotExist'), 'doesNotExist');
});

test('getInitialLanguage resolves URL, storage, and defaults in priority order', () => {
    assert.equal(loadCore({ search: '?lang=zh-HK' }).core.getInitialLanguage(), 'zh-HK');
    assert.equal(loadCore({ storedLanguage: 'zh-HK' }).core.getInitialLanguage(), 'zh-HK');
    assert.equal(loadCore({ search: '?lang=fr' }).core.getInitialLanguage(), 'en');
    assert.equal(loadCore().core.getInitialLanguage(), 'en');
});

test('processCSVData maps categories, skips invalid rows, and keeps localized fields', () => {
    const { core } = loadCore();
    const rows = [
        { Category: 'Soups', ID: 'S1', Name: 'Tomato Soup', Description: 'Fresh tomatoes', IsActive: 'TRUE', ServingStyle: '', 'Image URL': '', NameZh: '番茄湯', DescriptionZh: '新鮮番茄' },
        { Category: 'Mains', ID: 'M1', Name: 'Steak', IsActive: 'TRUE', ServingStyle: 'individual' },
        { Category: 'Mains', ID: 'M2', Name: 'Platter', IsActive: 'TRUE', ServingStyle: 'sharing' },
        { Category: 'Mains', ID: 'M3', Name: 'Hidden', IsActive: 'FALSE', ServingStyle: 'individual' },
        { Category: 'Soups', ID: 'S2', Name: '', IsActive: 'TRUE' }
    ];

    const data = core.processCSVData(rows);

    assert.equal(data.soups.length, 1);
    assert.equal(data.soups[0].id, 'S1');
    assert.equal(data.soups[0].nameZh, '番茄湯');

    assert.equal(data.mains.individual.length, 1);
    assert.equal(data.mains.individual[0].id, 'M1');
    assert.equal(data.mains.sharing.length, 1);
    assert.equal(data.mains.sharing[0].id, 'M2');
});

test('processCSVData converts Google Drive image URLs to thumbnails', () => {
    const { core } = loadCore();
    const fileId = '1AbCdEfGhIjKlMnOpQrStUvWxYz';
    const rows = [
        { Category: 'Soups', ID: 'S3', Name: 'Soup', IsActive: 'TRUE', 'Image URL': `https://drive.google.com/file/d/${fileId}/view` }
    ];

    const data = core.processCSVData(rows);
    assert.equal(data.soups[0].image, `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
});
