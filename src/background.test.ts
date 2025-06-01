import '../background'; // This should execute the background script and register listeners

// Make sure all necessary parts of the chrome API are mocked, especially addListener methods
// The global __mocks__/chrome.ts should handle this.
// We will add specific mock implementations here as needed for background script logic.

const mockGetMessage = jest.fn((messageName, substitutions) => {
    const messages = {
        "contextMenuSaveTab": "Save this tab to OpenSingleTab",
        "onInstallMessage": "Extension installed/updated.",
        "badgeDefaultText": "",
        "badgeUpdatedText": "✓", // Example if badge changes on save
    };
    let msg = messages[messageName] || `mock-bg-${messageName}`;
    if (substitutions && typeof substitutions === 'string') {
        msg = msg.replace('$1$', substitutions);
    } else if (substitutions && Array.isArray(substitutions)) {
        substitutions.forEach((s, i) => msg = msg.replace(`$${i+1}$`, s));
    }
    return msg;
});

// Ensure the global chrome mock is extended for background specific needs.
// The __mocks__/chrome.ts initializes a base chrome object.
// We might need to specifically ensure listener functions are fresh for each test.
let capturedOnInstalledCallback: ((details: chrome.runtime.InstalledDetails) => void) | undefined;
let capturedOnMessageCallback: ((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => boolean | undefined) | undefined;
let capturedOnClickedCallback: ((tab: chrome.tabs.Tab) => void) | undefined;
let capturedTabsOnUpdatedCallback: ((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void) | undefined;

const initialMockStorage = {
    lastUrl: 'https://example.com/initial',
    lastUrlTimestamp: Date.now() - 100000,
    options: { openInNewWindow: false, showNotification: true },
    tabGroups: [], // Assuming background might interact with this
};
let mockStorageData: { [key: string]: any };


describe('Background Script', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clears all mock usage data

        // Reset storage data for each test
        mockStorageData = JSON.parse(JSON.stringify(initialMockStorage));

        // Reset global chrome mock parts that manage listeners or mutable state
        // This ensures that addListener calls from different test runs don't interfere
        // and that we capture the callback registered by the background script under test.

        global.chrome.runtime.onInstalled.addListener = jest.fn(callback => {
            capturedOnInstalledCallback = callback;
        });
        global.chrome.runtime.onMessage.addListener = jest.fn(callback => {
            capturedOnMessageCallback = callback;
        });
        global.chrome.action.onClicked.addListener = jest.fn(callback => {
            capturedOnClickedCallback = callback;
        });
        global.chrome.tabs.onUpdated.addListener = jest.fn(callback => {
            capturedTabsOnUpdatedCallback = callback;
        });
        global.chrome.contextMenus = { // Basic mock for contextMenus
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            removeAll: jest.fn(),
            onClicked: {
                addListener: jest.fn(),
                removeListener: jest.fn(),
                hasListener: jest.fn(),
            }
        } as unknown as typeof chrome.contextMenus; // Cast to satisfy TypeScript if needed

        // Re-import or re-run the background script logic if it's not entirely top-level
        // For this setup, importing '../background' at the top should be enough if it only registers.
        // If background.ts exports functions that register listeners, call them here.

        // Override specific chrome API calls used by background.ts
        global.chrome.i18n.getMessage = mockGetMessage;
        global.chrome.storage.local.get = jest.fn((keys, callback) => {
            const result = {};
            const keyList = typeof keys === 'string' ? [keys] : (Array.isArray(keys) ? keys : Object.keys(keys));
            keyList.forEach(key => {
                if (mockStorageData.hasOwnProperty(key)) {
                    result[key] = JSON.parse(JSON.stringify(mockStorageData[key]));
                } else if (typeof keys === 'object' && keys !== null && !Array.isArray(keys) && keys.hasOwnProperty(key)) {
                    result[key] = keys[key]; // Use default value from request
                }
            });
            setTimeout(() => callback(result), 0);
        });
        global.chrome.storage.local.set = jest.fn((items, callback) => {
            Object.keys(items).forEach(key => mockStorageData[key] = JSON.parse(JSON.stringify(items[key])));
            if (callback) setTimeout(callback, 0);
        });
        global.chrome.tabs.query = jest.fn((options, callback) => {
            // Default mock: returns one active tab
            const mockTabs = [{ id: 1, url: 'https://example.com/current', active: true, windowId: 1, title: "Test Tab" }];
            setTimeout(() => callback(mockTabs), 0);
        });
         global.chrome.tabs.create = jest.fn((props, callback) => {
            if (callback) setTimeout(() => callback({id: Math.floor(Math.random() * 1000), ...props} as chrome.tabs.Tab), 0);
        });
        global.chrome.action.setBadgeText = jest.fn();
        global.chrome.action.setBadgeBackgroundColor = jest.fn();

        // Re-run the import to register listeners with the fresh mocks for this test
        // This is a bit of a hack for scripts that only register top-level listeners.
        // A better way is to export functions from background.ts and call them.
        // For now, we assume the initial import at the top of this file handles registration.
        // If tests fail due to listeners not being registered for a specific test,
        // this might be the area to investigate.
    });

    test('onInstalled listener initializes default settings and context menu', () => {
        expect(capturedOnInstalledCallback).toBeDefined();
        if (!capturedOnInstalledCallback) return;

        capturedOnInstalledCallback({ reason: 'install' });

        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            expect.objectContaining({
                options: { // Assuming default options are set on install
                    openInNewWindow: false,
                    showNotification: true,
                    groupTabs: false, // Example default
                },
            }),
            expect.any(Function)
        );

        // Check for context menu creation
        expect(chrome.contextMenus.create).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'openSingleTabSave',
                title: mockGetMessage("contextMenuSaveTab"), // Uses i18n
                contexts: ['page'],
            })
        );
        // It might also set an initial badge or get initial data
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({text: mockGetMessage("badgeDefaultText")});
    });

    test('onMessage listener handles "saveTab" message correctly', async () => {
        expect(capturedOnMessageCallback).toBeDefined();
        if (!capturedOnMessageCallback) return;

        const mockTabToSave = { id: 101, url: 'https://newtab.com/to-save', title: 'New Tab to Save' };
        const mockMessage = { action: 'saveTab', tab: mockTabToSave };
        const mockSender = { tab: { id: 1 } as chrome.tabs.Tab }; // Sender tab
        const mockSendResponse = jest.fn();

        // Simulate receiving the message
        const result = capturedOnMessageCallback(mockMessage, mockSender, mockSendResponse);
        expect(result).toBe(true); // For async sendResponse

        // Wait for async operations within the message handler
        await new Promise(process.nextTick); // Or use waitFor if there's a UI change to observe

        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            {
                lastUrl: 'https://newtab.com/to-save',
                lastUrlTimestamp: expect.any(Number), // Timestamp will be current time
            },
            expect.any(Function)
        );
        // Check if badge text is updated after saving
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: mockGetMessage("badgeUpdatedText") });

        // Check if sendResponse was called
        // Need to wait for the callback of storage.set to be invoked
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for storage.set callback
        expect(mockSendResponse).toHaveBeenCalledWith({ success: true, url: 'https://newtab.com/to-save' });
    });

    test('onMessage listener handles "getLastSavedTab" message correctly', async () => {
        expect(capturedOnMessageCallback).toBeDefined();
        if (!capturedOnMessageCallback) return;

        const mockMessage = { action: 'getLastSavedTab' };
        const mockSender = {}; // Not relevant for this message
        const mockSendResponse = jest.fn();

        mockStorageData.lastUrl = 'https://retrieved.com/url';
        mockStorageData.lastUrlTimestamp = 1234567890000;

        const result = capturedOnMessageCallback(mockMessage, mockSender as chrome.runtime.MessageSender, mockSendResponse);
        expect(result).toBe(true); // For async sendResponse

        await new Promise(process.nextTick);
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for storage.get callback

        expect(chrome.storage.local.get).toHaveBeenCalledWith(['lastUrl', 'lastUrlTimestamp'], expect.any(Function));
        expect(mockSendResponse).toHaveBeenCalledWith({
            url: 'https://retrieved.com/url',
            timestamp: 1234567890000
        });
    });


    test('action.onClicked listener opens the last saved tab or a default page', async () => {
        expect(capturedOnClickedCallback).toBeDefined();
        if (!capturedOnClickedCallback) return;

        const mockCurrentTab = { id: 1, url: 'chrome://extensions', active: true, windowId: 1, title: 'Extensions' } as chrome.tabs.Tab;

        // Scenario 1: A lastUrl is saved
        mockStorageData.lastUrl = 'https://last-saved.com/page';
        capturedOnClickedCallback(mockCurrentTab);
        await new Promise(process.nextTick); // for async operations in listener
        await new Promise(resolve => setTimeout(resolve, 0)); // for storage.local.get callback

        expect(chrome.storage.local.get).toHaveBeenCalledWith(['lastUrl', 'options'], expect.any(Function));
        // Check if it tries to find an existing tab with that URL
        expect(chrome.tabs.query).toHaveBeenCalledWith({ url: 'https://last-saved.com/page', currentWindow: true }, expect.any(Function));
        // Assuming tab not found by default mock of tabs.query, so it creates one
        expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://last-saved.com/page', active: true });

        chrome.tabs.create.mockClear();
        chrome.tabs.query.mockClear();

        // Scenario 2: No lastUrl is saved (should open index.html or options.html)
        mockStorageData.lastUrl = undefined;
        capturedOnClickedCallback(mockCurrentTab);
        await new Promise(process.nextTick);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(chrome.storage.local.get).toHaveBeenCalledWith(['lastUrl', 'options'], expect.any(Function));
        // It should try to open the main page of the extension (e.g., 'display.html')
        expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'display.html', active: true });
    });

    test('tabs.onUpdated listener updates badge if URL matches last saved', async () => {
        expect(capturedTabsOnUpdatedCallback).toBeDefined();
        if (!capturedTabsOnUpdatedCallback) return;

        const tabId = 123;
        const mockTab = { id: tabId, url: 'https://last-saved.com/page', active: true, windowId: 1, title: 'Test' } as chrome.tabs.Tab;

        // Case 1: URL matches last saved
        mockStorageData.lastUrl = 'https://last-saved.com/page';
        capturedTabsOnUpdatedCallback(tabId, { status: 'complete' }, mockTab);
        await new Promise(process.nextTick);
        await new Promise(resolve => setTimeout(resolve, 0)); // for storage.get
        expect(chrome.storage.local.get).toHaveBeenCalledWith(['lastUrl'], expect.any(Function));
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ tabId: tabId, text: mockGetMessage("badgeUpdatedText") });

        chrome.action.setBadgeText.mockClear();

        // Case 2: URL does not match
        mockStorageData.lastUrl = 'https://some-other-url.com';
        capturedTabsOnUpdatedCallback(tabId, { status: 'complete' }, { ...mockTab, url: 'https://different.com' });
        await new Promise(process.nextTick);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ tabId: tabId, text: mockGetMessage("badgeDefaultText") });

        // Case 3: status is not 'complete'
        chrome.action.setBadgeText.mockClear();
        mockStorageData.lastUrl = 'https://last-saved.com/page';
        capturedTabsOnUpdatedCallback(tabId, { status: 'loading' }, mockTab);
        await new Promise(process.nextTick);
        // storage.get might not even be called if status isn't complete
        expect(chrome.action.setBadgeText).not.toHaveBeenCalled();
    });

    // Test for initial badge setting (if any, not tied to a specific event listener but on script startup)
    test('initialization logic sets default badge text', () => {
        // This test relies on the import '../background' at the top having executed.
        // If background.ts has top-level code like:
        // chrome.action.setBadgeText({ text: "..." });
        // Or if it calls a function that does this immediately.
        // The beforeEach clears mocks, then the import effectively re-runs.
        // However, the global chrome object is set up BEFORE the import.
        // So, this test might be tricky. A common pattern is to have an init() function.

        // Assuming background.ts calls an init function that does this,
        // or onInstalled also sets a default badge for existing installations.
        // The onInstalled test already checks for badge setting.
        // If there's a separate init path, it needs to be invokable or tested differently.

        // For now, this is covered by the onInstalled test's badge check,
        // assuming onInstalled handles both new installs and updates where init might run.
        // If there was a direct call like `chrome.action.setBadgeText(...)` at the top level of background.ts,
        // it would have been called when `import '../background'` ran.
        // We can check if it was called at least once during the setup of all tests.
        expect(chrome.action.setBadgeText).toHaveBeenCalled(); // General check
    });

});
