import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Options from './options'; // Adjust path as necessary

// Global chrome mock is available via jest.setup.js

describe('Options Component', () => {
  const mockInitialOptions = {
    openInNewWindow: false,
    showNotification: true,
    groupTabs: false,
    // Add any other default options your component uses
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock for chrome.storage.local.get
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      // If keys is an object, it means it's requesting values with defaults
      // If it's an array or string, it's just requesting values
      let requestedOptions = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (mockInitialOptions.hasOwnProperty(key)) {
            requestedOptions[key] = mockInitialOptions[key];
          }
        });
      } else if (typeof keys === 'object' && keys !== null) { // Handles { optionKey: defaultValue }
        Object.keys(keys).forEach(key => {
          requestedOptions[key] = mockInitialOptions.hasOwnProperty(key)
            ? mockInitialOptions[key]
            : keys[key]; // Use default from call if not in mockInitialOptions
        });
      } else if (typeof keys === 'string') {
         if (mockInitialOptions.hasOwnProperty(keys)) {
            requestedOptions[keys] = mockInitialOptions[keys];
          }
      }
      setTimeout(() => callback(requestedOptions), 0);
    });

    // Mock for chrome.storage.local.set
    chrome.storage.local.set.mockImplementation((items, callback) => {
      // Simulate successful save
      setTimeout(() => {
        if (callback) {
          callback();
        }
      }, 0);
    });

    // Mock for chrome.i18n.getMessage
    chrome.i18n.getMessage.mockImplementation(messageName => {
        const messages = {
            "optionsTitle": "OpenSingleTab Options",
            "optionOpenInNewWindow": "Open link in a new window",
            "optionShowNotification": "Show notification on save",
            "optionGroupTabs": "Group saved tab (if tab groups are supported)",
            "optionsSaveButton": "Save Options",
            "optionsSaveConfirmation": "Options saved successfully!"
        };
        return messages[messageName] || `mock-options-${messageName}`;
    });
  });

  test('renders correctly and loads initial options', async () => {
    render(<Options />);

    // Check for the main title
    expect(screen.getByText('OpenSingleTab Options')).toBeInTheDocument();

    // Wait for options to be loaded and inputs to be populated
    // Check if checkboxes reflect the mockInitialOptions
    expect(await screen.findByLabelText('Open link in a new window')).not.toBeChecked();
    expect(await screen.findByLabelText('Show notification on save')).toBeChecked();
    expect(await screen.findByLabelText('Group saved tab (if tab groups are supported)')).not.toBeChecked();

    // Check for the save button
    expect(screen.getByRole('button', { name: 'Save Options' })).toBeInTheDocument();
  });

  test('handles changes to an option and saves it, then shows confirmation', async () => {
    render(<Options />);

    // Wait for initial load
    const openInNewWindowCheckbox = await screen.findByLabelText('Open link in a new window');
    const showNotificationCheckbox = await screen.findByLabelText('Show notification on save');

    // Initial state from mock
    expect(openInNewWindowCheckbox).not.toBeChecked();
    expect(showNotificationCheckbox).toBeChecked();

    // Simulate user changing an option
    fireEvent.click(openInNewWindowCheckbox); // Toggle it to true
    expect(openInNewWindowCheckbox).toBeChecked();

    fireEvent.click(showNotificationCheckbox); // Toggle it to false
    expect(showNotificationCheckbox).not.toBeChecked();

    // Find and click the "Save Options" button
    const saveButton = screen.getByRole('button', { name: 'Save Options' });
    fireEvent.click(saveButton);

    // Assert that chrome.storage.local.set was called with the new values
    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    });
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      {
        openInNewWindow: true, // Changed value
        showNotification: false, // Changed value
        groupTabs: mockInitialOptions.groupTabs, // Unchanged, should still be there
      },
      expect.any(Function) // Callback function
    );

    // Assert that the confirmation message appears
    expect(await screen.findByText('Options saved successfully!')).toBeInTheDocument();
  });

  test('confirmation message disappears after a short time', async () => {
    jest.useFakeTimers(); // Use Jest's fake timers for this test

    render(<Options />);

    const openInNewWindowCheckbox = await screen.findByLabelText('Open link in a new window');
    fireEvent.click(openInNewWindowCheckbox); // Change a value to enable save

    const saveButton = screen.getByRole('button', { name: 'Save Options' });
    fireEvent.click(saveButton);

    // Confirmation message should be visible
    expect(await screen.findByText('Options saved successfully!')).toBeInTheDocument();

    // Fast-forward time by more than the timeout used to hide the message (e.g., 3 seconds)
    // Assuming the component hides the message after ~2-3 seconds.
    act(() => {
        jest.advanceTimersByTime(3000);
    });


    // The message should no longer be in the document
    await waitFor(() => {
      expect(screen.queryByText('Options saved successfully!')).not.toBeInTheDocument();
    });

    jest.useRealTimers(); // Restore real timers
  });

});
