import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Popup from './popup'; // Adjust path as necessary

// Mock chrome API is globally available via jest.setup.js

describe('Popup Component', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Provide default mock implementations for chrome API calls used in Popup
    // or ensure your global mock in chrome.ts has sensible defaults.

    // Mock for chrome.storage.local.get used in useEffect
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const items = {
        lastUrl: 'https://example.com/mocked',
        lastUrlTimestamp: new Date('2024-01-01T12:00:00Z').getTime(),
      };
      let result = {};
      if (typeof keys === 'string') {
        result[keys] = items[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (items.hasOwnProperty(key)) {
            result[key] = items[key];
          }
        });
      } else { // Object with defaults
        Object.keys(keys).forEach(key => {
            result[key] = items.hasOwnProperty(key) ? items[key] : keys[key];
        });
      }
      setTimeout(() => callback(result), 0);
    });

    // Mock for chrome.tabs.query
    chrome.tabs.query.mockImplementation((options, callback) => {
      const mockTabs = [
        { id: 1, url: 'https://tabs.example.com/active', title: 'Active Example Tab', windowId: 1, active: true, highlighted: true, pinned: false, incognito: false, index: 0, favIconUrl: '' },
        { id: 2, url: 'https://tabs.example.com/other', title: 'Other Example Tab', windowId: 1, active: false, highlighted: false, pinned: false, incognito: false, index: 1, favIconUrl: '' },
      ];
      setTimeout(() => callback(mockTabs.filter(tab => tab.active)), 0); // Simulate query for active tabs
    });

    // Mock for chrome.i18n.getMessage
    chrome.i18n.getMessage.mockImplementation(messageName => {
        const messages = {
            "appName": "OpenSingleTab Test",
            "popupSaveButtonText": "Save Current Tab Test",
            "popupLastSavedUrl": "Last saved URL (test):",
            "popupNoUrlSaved": "No URL saved yet (test).",
            "popupSaveSuccess": "Tab saved (test)!",
            "popupSaveError": "Error saving tab (test).",
            "popupSwitchToTab": "Switch to Tab (test)"
        };
        return messages[messageName] || `mock-test-${messageName}`;
    });
  });

  test('renders correctly with initial data', async () => {
    render(<Popup />);

    // Check for the main title/header from i18n
    expect(screen.getByText('OpenSingleTab Test')).toBeInTheDocument();

    // Check if "Last saved URL" text is displayed
    expect(screen.getByText('Last saved URL (test):')).toBeInTheDocument();

    // Check if the mocked lastUrl is displayed
    // Need to wait for the useEffect and storage.local.get to resolve
    expect(await screen.findByText('https://example.com/mocked')).toBeInTheDocument();

    // Check for the "Save Current Tab" button
    expect(screen.getByRole('button', { name: 'Save Current Tab Test' })).toBeInTheDocument();
  });

  // Test 2: Fetches and displays current tabs (if applicable).
  // This is implicitly tested by the "Save Current Tab" functionality,
  // as it relies on chrome.tabs.query. We can add a more direct test if needed,
  // but the current Popup component seems more focused on saving one tab.

  test('handles "Save Current Tab" action', async () => {
    render(<Popup />);

    // Wait for initial data load (lastUrl)
    await screen.findByText('https://example.com/mocked');

    const saveButton = screen.getByRole('button', { name: 'Save Current Tab Test' });
    fireEvent.click(saveButton);

    // Verify chrome.tabs.query was called to get the current active tab
    // It's called to get the *current* tab to save, not to list tabs.
    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true }, expect.any(Function));

    // Verify chrome.storage.local.set was called
    // The popup queries for active tabs, then takes the first one.
    // Our mock for tabs.query returns 'https://tabs.example.com/active' as the active tab.
    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    });

    // Check the arguments of chrome.storage.local.set
    // The actual timestamp will vary, so we use expect.any(Number)
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      {
        lastUrl: 'https://tabs.example.com/active',
        lastUrlTimestamp: expect.any(Number),
      },
      expect.any(Function) // Callback function
    );

    // Check for success message
    expect(await screen.findByText('Tab saved (test)!')).toBeInTheDocument();
  });

  test('displays "No URL saved yet" when no URL is in storage', async () => {
    // Override storage.local.get for this specific test
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const items = {}; // No lastUrl or lastUrlTimestamp
      let result = {};
      if (typeof keys === 'string') {
        result[keys] = items[keys]; // will be undefined
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          result[key] = items[key]; // will be undefined
        });
      } else { // Object with defaults
         Object.keys(keys).forEach(key => {
            result[key] = keys[key]; // return defaults
        });
      }
      setTimeout(() => callback(result), 0);
    });

    render(<Popup />);
    expect(await screen.findByText('No URL saved yet (test).')).toBeInTheDocument();
  });

  test('clicking on the saved URL attempts to switch to it or open it', async () => {
    render(<Popup />);

    const savedUrlText = await screen.findByText('https://example.com/mocked');
    expect(savedUrlText).toBeInTheDocument();

    fireEvent.click(savedUrlText);

    // Check if chrome.tabs.query is called to find if the tab exists
    expect(chrome.tabs.query).toHaveBeenCalledWith({ url: 'https://example.com/mocked', currentWindow: true }, expect.any(Function));

    // In this scenario, our global tabs.query mock will return the 'https://example.com' tab (if we adjust its mock data)
    // or an empty array if it doesn't match. Let's assume it finds one.
    // Re-mock tabs.query for this specific interaction if needed, or adjust the global one.
    // For now, let's assume the default mock in beforeEach is sufficient or it's updated.
    // The mock in beforeEach returns:
    // { id: 1, url: 'https://tabs.example.com/active', title: 'Active Example Tab', ... }
    // { id: 2, url: 'https://tabs.example.com/other', title: 'Other Example Tab', ... }
    // We clicked on 'https://example.com/mocked'. So tabs.query({url: 'https://example.com/mocked', ...})
    // will return [] based on current mock.

    // So, chrome.tabs.create should be called.
    await waitFor(() => {
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://example.com/mocked', active: true });
    });

    // If it *did* find a tab, it would call chrome.tabs.update instead.
    // Let's add a specific sub-test for that.
  });

  test('clicking on the saved URL switches to an existing tab', async () => {
    // Override chrome.tabs.query for this test to simulate the tab existing
    chrome.tabs.query.mockImplementation((options, callback) => {
      if (options.url === 'https://example.com/mocked' && options.currentWindow) {
        setTimeout(() => callback([{ id: 123, url: 'https://example.com/mocked', title: 'Mocked Existing Tab', windowId: 1, active: false, highlighted: false, pinned: false, incognito: false, index: 0, favIconUrl: '' }]), 0);
      } else if (options.active && options.currentWindow) { // For the save button functionality
         setTimeout(() => callback([{ id: 1, url: 'https://tabs.example.com/active', title: 'Active Example Tab', windowId: 1, active: true, highlighted: true, pinned: false, incognito: false, index: 0, favIconUrl: '' }]), 0);
      } else {
        setTimeout(() => callback([]), 0);
      }
    });

    render(<Popup />);
    const savedUrlText = await screen.findByText('https://example.com/mocked');
    fireEvent.click(savedUrlText);

    await waitFor(() => {
      expect(chrome.tabs.update).toHaveBeenCalledWith(123, { active: true });
    });
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

});
