import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Import components involved in the flow
import OptionsPage from '../../src/options'; // Adjust path if necessary
import Popup from '../../src/popup'; // Adjust path if necessary

import { Options } from '../../src/types/tabs';

// Mocks for child components not central to this specific integration flow
jest.mock('../../src/components/Footer', () => jest.fn(() => <div data-testid="mock-footer">Mock Footer</div>));
jest.mock('../../src/components/StatusMessage', () => jest.fn(({ message, type, onDismiss }) => {
    if (!message) return null;
    return <div data-testid="status-message" className={`status-${type}`}>{message} <button onClick={onDismiss}>Dismiss</button></div>;
}));


// --- Global Mocks Setup for Chrome API ---
const mockGetMessage = jest.fn((messageName, substitutions?) => {
    const messages = {
        "appName": "OpenSingleTab Integration Test",
        // Options Page
        "optionsTitle": "OpenSingleTab Options",
        "optionOpenInNewWindow": "Open link in a new window",
        "optionShowNotification": "Show notification on save",
        "optionGroupTabs": "Group saved tab (if tab groups are supported)",
        "optionDefaultGroupName": "Default group name for saving single tabs:",
        "optionsSaveButton": "Save Options",
        "optionsSaveConfirmation": "Options saved successfully!",
        // Popup Page
        "popupSaveButtonText": "Save Current Tab", // For single tab save
        "tabGroupNamePlaceholder": "Group Name (optional)", // For group naming in popup
        "saveGroupButtonText": "Save Group", // For saving multiple tabs as a group
    };
    let msg = messages[messageName] || `mock-it-${messageName}`;
    if (substitutions && typeof substitutions === 'string') msg = msg.replace('$1$', substitutions);
    else if (substitutions && Array.isArray(substitutions)) msg = msg.replace('$1$', substitutions[0]);
    return msg;
});

let mockStorage: { [key: string]: any } = {};
const initialMockTabs: chrome.tabs.Tab[] = [ // For Popup
    { id: 101, url: 'https://tab1.example.com', title: 'Tab 1', active: true, windowId: 1, index: 0, pinned: false, highlighted: true, incognito: false, favIconUrl: '' },
];
const defaultOptions: Options = {
    openInNewWindow: false,
    showNotification: true,
    groupTabs: false,
    defaultGroupName: 'My Default Group',
};

const deepCopy = (data: any) => JSON.parse(JSON.stringify(data));

global.chrome = {
    i18n: { getMessage: mockGetMessage },
    storage: {
        local: {
            get: jest.fn((keys, callback) => {
                const result: { [key: string]: any } = {};
                const keyList = typeof keys === 'string' ? [keys] : (Array.isArray(keys) ? keys : Object.keys(keys));
                keyList.forEach(key => {
                    if (key === 'options') {
                        result[key] = mockStorage['options'] ? deepCopy(mockStorage['options']) : deepCopy(defaultOptions);
                    } else {
                        result[key] = mockStorage[key] ? deepCopy(mockStorage[key]) : undefined;
                    }
                });
                 act(() => {setTimeout(() => callback(result), 0)});
            }),
            set: jest.fn((items, callback) => {
                Object.keys(items).forEach(key => {
                    mockStorage[key] = deepCopy(items[key]);
                });
                act(() => {if (callback) setTimeout(callback, 0)});
            }),
        },
    },
    tabs: { // For Popup
        query: jest.fn((options, callback) => {
             act(() => {setTimeout(() => callback(deepCopy(initialMockTabs)), 0)});
        }),
        create: jest.fn((props, cb?) => cb ? cb({id: 1} as chrome.tabs.Tab) : Promise.resolve({id:1}  as chrome.tabs.Tab)),
        update: jest.fn((tabId, props, cb?) => cb ? cb({id:tabId} as chrome.tabs.Tab) : Promise.resolve({id:tabId} as chrome.tabs.Tab)),
    },
    runtime: {
        getURL: jest.fn(path => `chrome-extension://mock-id/${path}`),
        onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
        getManifest: jest.fn(() => ({ manifest_version: 3, name: "Test Extension", version: "1.0" })),
    },
    action: { // For Popup if it updates badge
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
    }
} as any;


describe('Options and Popup Integration Flow', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Set default options in mock storage for each test
        mockStorage = {
            options: deepCopy(defaultOptions),
            tabGroups: [], // Not directly used but good to have a complete mockStorage state
            lastUrl: undefined,
            lastUrlTimestamp: undefined,
        };
        (global.chrome.tabs.query as jest.Mock).mockImplementation((options, callback) => {
            act(() => {setTimeout(() => callback(deepCopy(initialMockTabs)), 0)});
        });
    });

    test('Changing defaultGroupName in Options reflects in Popup when saving a single tab', async () => {
        // --- 1. Initial State & Render OptionsPage ---
        let { unmount } = render(<OptionsPage />);

        // --- 2. Change Setting in OptionsPage ---
        // Wait for options to load
        const defaultGroupNameInput = await screen.findByLabelText(mockGetMessage('optionDefaultGroupName')) as HTMLInputElement;
        expect(defaultGroupNameInput.value).toBe('My Default Group'); // Initial value

        fireEvent.change(defaultGroupNameInput, { target: { value: "Work Tasks" } });

        const saveOptionsButton = screen.getByRole('button', { name: mockGetMessage('optionsSaveButton') });
        fireEvent.click(saveOptionsButton);

        await waitFor(() => {
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
            const storedData = (chrome.storage.local.set as jest.Mock).mock.calls[0][0];
            expect(storedData.options.defaultGroupName).toBe("Work Tasks");
        });
        // Check for save confirmation message
        expect(await screen.findByTestId('status-message')).toHaveTextContent(mockGetMessage('optionsSaveConfirmation'));

        unmount(); // Unmount OptionsPage

        // --- 3. Render Popup & Verify Effect ---
        // mockStorage.options is now { ...defaultOptions, defaultGroupName: "Work Tasks" }

        ({ unmount } = render(<Popup />));

        // The Popup needs to save the *current tab* (initialMockTabs[0])
        // If the Popup uses the defaultGroupName to pre-fill a group name input when saving a single tab
        // into a *new group*, this is where we'd check it.
        // Let's assume the Popup has a way to save the current single tab, and if no group name is specified,
        // it uses the defaultGroupName from options to create a new group for that single tab.

        // This depends on Popup's UI. If there's a specific input field for group name that gets
        // pre-filled with defaultGroupName when empty, check that.
        // Or, if clicking "Save Current Tab" directly uses defaultGroupName if no explicit group is chosen.

        // Let's assume a scenario:
        // 1. User clicks "Save Current Tab"
        // 2. Popup checks if a group name input is empty.
        // 3. If empty, it uses options.defaultGroupName to create a group for this tab.

        const saveCurrentTabButton = await screen.findByRole('button', { name: mockGetMessage('popupSaveButtonText') });

        // If there's a group name input that might be pre-filled or used
        const groupNameInputIfExists = screen.queryByPlaceholderText(mockGetMessage('tabGroupNamePlaceholder'));

        // For this test, let's assume the group name input is empty, so defaultGroupName should be used.
        if (groupNameInputIfExists) {
            expect(groupNameInputIfExists.value).toBe(""); // User hasn't typed a group name
        }

        fireEvent.click(saveCurrentTabButton);

        await waitFor(() => {
            // Expect storage.local.set to be called to save a new group
            // This part of the assertion depends on how Popup structures its saved groups.
            // It might save under `tabGroups` or a different structure for single "default" group saves.
            // For this test, let's assume it creates a new group in `tabGroups`.
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1); // After options save, this is the next set
            const setArgs = (chrome.storage.local.set as jest.Mock).mock.calls[0][0];

            // Check if it tried to save to tabGroups (most likely scenario)
            if (setArgs.tabGroups) {
                const newGroups = setArgs.tabGroups;
                expect(newGroups).toHaveLength(1);
                expect(newGroups[0].name).toBe("Work Tasks"); // The changed defaultGroupName
                expect(newGroups[0].tabs).toHaveLength(1);
                expect(newGroups[0].tabs[0].url).toBe(initialMockTabs[0].url);
            } else {
                // Alternative: Popup might save the single tab directly to lastUrl and use defaultGroupName
                // if it's creating a group implicitly. This test needs to align with Popup's behavior.
                // For now, we'll assume the above tabGroups structure.
                // This would fail if Popup saves single tabs differently (e.g., only to lastUrl and doesn't auto-group)
                // For this example, the test implies Popup *does* auto-group single saved tabs using defaultGroupName.
                throw new Error("Test assertion failed: Expected save to tabGroups with defaultGroupName.");
            }
        });

        unmount(); // Unmount Popup
    });
});
