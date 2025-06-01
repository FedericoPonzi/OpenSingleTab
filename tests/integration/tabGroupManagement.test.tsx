import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Import components involved in the flow
import Popup from '../../src/popup'; // Adjust path if necessary
import DisplayPage from '../../src/tabs/display'; // Adjust path if necessary

import { SavedTabGroup, SavedTab, Options } from '../../src/types/tabs';

// Mocks for child components not central to this specific integration flow
jest.mock('../../src/components/Footer', () => jest.fn(() => <div data-testid="mock-footer">Mock Footer</div>));
// DisplayPage already mocks its children (TabGroup, StatusMessage) in its own unit tests.
// For integration, we might want to let DisplayPage render its actual children,
// but its children (like TabGroup) might need to be simplified if they make external calls not mocked here.
// For now, let's assume DisplayPage's internal structure and its children are part of the integration test.
// We will need to ensure TabGroup's dependencies (like EditableGroupTitle, GroupActions, TabItem) are either
// also part of the test, or TabGroup itself is mocked at a high level if too complex.
// Given DisplayPage's unit tests already mock TabGroup, let's stick to that for consistency if direct children of DisplayPage are mocked.
// However, the goal of integration is to test components together. Let's try to use the actual TabGroup,
// which means we need its children to function or be very simply mocked if they make external calls.

// Simplified mocks for TabGroup's children if TabGroup is NOT mocked:
jest.mock('../../src/components/EditableGroupTitle', () => ({ title, onTitleChange }) => (
  <input data-testid="editable-title-input" defaultValue={title} onBlur={(e) => onTitleChange(e.target.value)} aria-label="Group Title"/>
));
jest.mock('../../src/components/GroupActions', () => ({ onRestore, onDelete, groupName }) => (
  <div>
    <button onClick={onRestore} data-testid={`restore-group-${groupName.replace(/\s+/g, '-')}`}>{`Restore ${groupName}`}</button>
    <button onClick={onDelete} data-testid={`delete-group-${groupName.replace(/\s+/g, '-')}`}>{`Delete ${groupName}`}</button>
  </div>
));
jest.mock('../../src/components/TabItem', () => ({ tab, onClick, onDelete, onTogglePin, isCurrent }) => (
  <div data-testid={`tab-item-${tab.id}`}>
    <span onClick={() => onClick(tab)}>{tab.title}</span>
    <button onClick={() => onDelete(tab.id)} data-testid={`delete-tab-${tab.id}`}>Delete Tab</button>
    <button onClick={() => onTogglePin(tab.id)}>{tab.pinned ? 'Unpin' : 'Pin'}</button>
    {isCurrent && <span>(Current)</span>}
  </div>
));
jest.mock('../../src/components/StatusMessage', () => jest.fn(({ message, type, onDismiss }) => {
    if (!message) return null;
    return <div data-testid="status-message" className={`status-${type}`}>{message} <button onClick={onDismiss}>Dismiss</button></div>;
}));


// --- Global Mocks Setup for Chrome API ---
const mockGetMessage = jest.fn((messageName, substitutions) => {
    // A more comprehensive list might be needed based on actual i18n keys used in Popup and DisplayPage
    const messages = {
        "appName": "OpenSingleTab Integration Test",
        "popupSaveButtonText": "Save Current Tab",
        "popupLastSavedUrl": "Last saved URL:",
        "popupNoUrlSaved": "No URL saved yet.",
        "tabsDisplayTitle": "My Saved Tabs",
        "tabsDisplayNoGroups": "No tab groups found.",
        "tabGroupNamePlaceholder": "Group Name (optional)",
        "saveGroupButtonText": "Save Group", // Assuming Popup has such a button for saving multiple tabs
        // from DisplayPage via TabGroup -> GroupActions
        "groupActionsRestore": "Restore All",
        "groupActionsDelete": "Delete Group",
        // from DisplayPage via TabGroup -> TabItem
        "tabItemDeleteButton": "Delete this tab",
    };
    let msg = messages[messageName] || `mock-it-${messageName}`;
    if (substitutions && typeof substitutions === 'string') msg = msg.replace('$1$', substitutions);
    // Simplified substitution for array
    else if (substitutions && Array.isArray(substitutions)) msg = msg.replace('$1$', substitutions[0]);
    return msg;
});

let mockStorage: { [key: string]: any } = {};
const initialMockTabs: chrome.tabs.Tab[] = [
    { id: 101, url: 'https://tab1.example.com', title: 'Tab 1', active: true, windowId: 1, index: 0, pinned: false, highlighted: true, incognito: false, favIconUrl: '' },
    { id: 102, url: 'https://tab2.example.com', title: 'Tab 2', active: true, windowId: 1, index: 1, pinned: false, highlighted: true, incognito: false, favIconUrl: '' },
];

const deepCopy = (data: any) => JSON.parse(JSON.stringify(data));

global.chrome = {
    i18n: { getMessage: mockGetMessage },
    storage: {
        local: {
            get: jest.fn((keys, callback) => {
                const result: { [key: string]: any } = {};
                const keyList = typeof keys === 'string' ? [keys] : (Array.isArray(keys) ? keys : Object.keys(keys));
                keyList.forEach(key => {
                    result[key] = mockStorage[key] ? deepCopy(mockStorage[key]) : undefined;
                     // Handle options default structure if requested
                    if (key === 'options' && result[key] === undefined) {
                        result[key] = { openInNewWindow: false, showNotification: true, groupTabs: false, defaultGroupName: '' };
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
    tabs: {
        query: jest.fn((options, callback) => {
            // Default behavior for query, can be overridden in tests
            act(() => {setTimeout(() => callback(deepCopy(initialMockTabs)), 0)});
        }),
        create: jest.fn((props, callback?) => {
            const newTab = { id: Math.floor(Math.random() * 1000) + 200, ...props } as chrome.tabs.Tab;
            act(() => {if (callback) setTimeout(() => callback(newTab), 0)});
            return Promise.resolve(newTab);
        }),
        update: jest.fn((tabId, props, callback?) => {
            const updatedTab = { id: tabId, ...props } as chrome.tabs.Tab;
            act(() => {if (callback) setTimeout(() => callback(updatedTab), 0)});
            return Promise.resolve(updatedTab);
        }),
        remove: jest.fn((tabIds, callback?) => {
            act(() => {if (callback) setTimeout(callback, 0)});
            return Promise.resolve();
        }),
    },
    runtime: {
        getURL: jest.fn(path => `chrome-extension://mock-id/${path}`),
        onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
        getManifest: jest.fn(() => ({ manifest_version: 3, name: "Test Extension", version: "1.0" })),
    },
    action: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
    }
} as any; // Use 'as any' to simplify mocking complex chrome types if needed


describe('Tab Group Management Integration Flow', () => {

    beforeEach(() => {
        // Reset mocks and storage for each test
        jest.clearAllMocks();
        mockStorage = {
            options: { openInNewWindow: false, showNotification: true, groupTabs: false, defaultGroupName: '' }, // Default options
            tabGroups: [], // Start with no groups
        };

        // Restore default tabs.query behavior for each test, can be overridden locally
        (global.chrome.tabs.query as jest.Mock).mockImplementation((options, callback) => {
            act(() => {setTimeout(() => callback(deepCopy(initialMockTabs)), 0)});
        });
    });

    test('Save current tabs as new group via Popup, then manage via DisplayPage', async () => {
        // --- 1. Initial State & Render Popup ---
        // (chrome.tabs.query already mocked to return initialMockTabs)
        // (chrome.storage.local.get already mocked to return no groups)

        let { unmount } = render(<Popup />);

        // --- 2. Save Tabs via Popup ---
        // Assuming Popup has an input for group name and a save button for current tabs as a group.
        // This part depends heavily on Popup's actual UI for saving groups.
        // For this test, let's assume a simplified "Save Active Tabs as Group" flow.
        // Let's say Popup directly uses a button with "Save Group" text from i18n.

        // Wait for Popup to load initial data (e.g., last saved URL, if any)
        // For now, we focus on group saving.
        // If Popup has a specific input for group name:
        const groupNameInput = screen.getByPlaceholderText(mockGetMessage('tabGroupNamePlaceholder'));
        fireEvent.change(groupNameInput, { target: { value: "Test Group 1" } });

        const saveGroupButton = screen.getByRole('button', { name: mockGetMessage('saveGroupButtonText') });
        fireEvent.click(saveGroupButton);

        await waitFor(() => {
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
            const storedData = (chrome.storage.local.set as jest.Mock).mock.calls[0][0];
            expect(storedData.tabGroups).toHaveLength(1);
            expect(storedData.tabGroups[0].name).toBe("Test Group 1");
            expect(storedData.tabGroups[0].tabs).toHaveLength(initialMockTabs.length);
            expect(storedData.tabGroups[0].tabs[0].url).toBe(initialMockTabs[0].url);
        });

        const savedGroupId = mockStorage.tabGroups[0].id; // Get ID for later use

        unmount(); // Unmount Popup

        // --- 3. Render DisplayPage & Verify Group ---
        // mockStorage now contains "Test Group 1"
        ({ unmount } = render(<DisplayPage />));

        expect(await screen.findByText("Test Group 1")).toBeInTheDocument();
        // Verify tabs within the group are listed (simplified check)
        expect(screen.getByText(initialMockTabs[0].title)).toBeInTheDocument();
        expect(screen.getByText(initialMockTabs[1].title)).toBeInTheDocument();

        // --- 4. Restore Tabs from Group (on DisplayPage) ---
        const restoreButton = screen.getByTestId(`restore-group-Test-Group-1`);
        fireEvent.click(restoreButton);

        await waitFor(() => {
            expect(chrome.tabs.create).toHaveBeenCalledTimes(initialMockTabs.length);
            initialMockTabs.forEach(tab => {
                expect(chrome.tabs.create).toHaveBeenCalledWith(expect.objectContaining({ url: tab.url, active: false }), expect.any(Function));
            });
        });
        (chrome.tabs.create as jest.Mock).mockClear(); // Clear for next action

        // --- 5. Delete a Tab from Group (on DisplayPage) ---
        const deleteTab1Button = screen.getByTestId(`delete-tab-${initialMockTabs[0].id}`);
        fireEvent.click(deleteTab1Button);

        await waitFor(() => {
            expect(chrome.storage.local.set).toHaveBeenCalledTimes(1); // Called once for this action
            const storedDataAfterTabDelete = (chrome.storage.local.set as jest.Mock).mock.calls[0][0];
            const groupAfterTabDelete = storedDataAfterTabDelete.tabGroups.find(g => g.id === savedGroupId);
            expect(groupAfterTabDelete.tabs).toHaveLength(initialMockTabs.length - 1);
            expect(groupAfterTabDelete.tabs.find(t => t.id === initialMockTabs[0].id)).toBeUndefined();
        });
        // Check UI update
        expect(screen.queryByText(initialMockTabs[0].title)).not.toBeInTheDocument();
        (chrome.storage.local.set as jest.Mock).mockClear();


        // --- 6. Delete the Entire Group (on DisplayPage) ---
        const deleteGroupButton = screen.getByTestId(`delete-group-Test-Group-1`);
        fireEvent.click(deleteGroupButton);

        await waitFor(() => {
             expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
             const storedDataAfterGroupDelete = (chrome.storage.local.set as jest.Mock).mock.calls[0][0];
             expect(storedDataAfterGroupDelete.tabGroups.find(g => g.id === savedGroupId)).toBeUndefined();
        });
        // Check UI Update
        expect(screen.queryByText("Test Group 1")).not.toBeInTheDocument();
        expect(await screen.findByText(mockGetMessage("tabsDisplayNoGroups"))).toBeInTheDocument(); // Assuming it's empty now

        unmount(); // Unmount DisplayPage
    });
});
