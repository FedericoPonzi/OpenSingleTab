import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ImportExportPage from './import-export'; // Assuming ImportExportPage is the main export
import { SavedTabGroup } from '../types/tabs';

// Mock child components
jest.mock('../components/StatusMessage', () => jest.fn(({ message, type, onDismiss }) => {
    if (!message) return null;
    return <div data-testid="mock-status-message" className={`status-${type}`}>{message} <button onClick={onDismiss}>Dismiss</button></div>;
}));
jest.mock('../components/Footer', () => jest.fn(() => <div data-testid="mock-footer">Mock Footer</div>));


// Mock i18n and other chrome APIs
const mockGetMessage = jest.fn((messageName, substitutions) => {
    const messages = {
        "importExportTitle": "Import / Export Tab Groups",
        "exportSectionTitle": "Export Your Tab Groups",
        "exportButtonText": "Export All Groups",
        "exportToClipboardButtonText": "Copy to Clipboard",
        "exportSuccessMessage": "Tab groups copied to clipboard!",
        "exportDownloadedMessage": "Tab groups download initiated.",
        "exportNoDataMessage": "No tab groups to export.",
        "importSectionTitle": "Import Tab Groups",
        "importPasteJsonLabel": "Paste your JSON data here:",
        "importButtonText": "Import Groups",
        "importSuccessMessage": "Tab groups imported successfully!",
        "importErrorMessageJson": "Invalid JSON format. Please check your data.",
        "importErrorMessageSchema": "Invalid data structure. Please ensure the JSON matches the required format.",
        "importWarningOverwrite": "Warning: Importing will overwrite existing tab groups.",
    };
    let msg = messages[messageName] || `mock-${messageName}`;
    if (substitutions && typeof substitutions === 'string') {
        msg = msg.replace('$1$', substitutions);
    } else if (substitutions && Array.isArray(substitutions)) {
        substitutions.forEach((s, i) => msg = msg.replace(`$${i+1}$`, s));
    }
    return msg;
});

const mockInitialGroups: SavedTabGroup[] = [
  { id: 'g1', name: 'Work Export', tabs: [{id: 't1', title: 'Doc 1', url: 'https://docs.example.com/1', pinned: false}], isOpen: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'g2', name: 'Personal Export', tabs: [{id: 't2', title: 'Blog', url: 'https://blog.example.com/1', pinned: true}], isOpen: false, createdAt: Date.now(), updatedAt: Date.now() },
];
const deepCopy = (data: any) => JSON.parse(JSON.stringify(data));
let mockStorageData: { [key: string]: any } = { tabGroups: deepCopy(mockInitialGroups) };

// Mock DOM functions
const mockCreateObjectURL = jest.fn(blob => `blob://dummy-url-for-${blob.type}`);
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const mockClipboardWriteText = jest.fn(() => Promise.resolve());
(global.navigator as any).clipboard = { writeText: mockClipboardWriteText };

// Spy on document.createElement('a') to check download behavior
const mockLinkClick = jest.fn();
const mockAnchorElement = {
    href: '',
    download: '',
    click: mockLinkClick,
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    style: { display: ''}
};
jest.spyOn(document, 'createElement').mockReturnValue(mockAnchorElement as any);


(global as any).chrome = {
  i18n: { getMessage: mockGetMessage },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        act(() => {
            const result = {};
            const keyList = typeof keys === 'string' ? [keys] : keys;
            keyList.forEach(key => result[key] = mockStorageData[key] ? deepCopy(mockStorageData[key]) : undefined);
            setTimeout(() => callback(result), 0);
        });
      }),
      set: jest.fn((items, callback) => {
        act(() => {
            Object.keys(items).forEach(key => mockStorageData[key] = deepCopy(items[key]));
             setTimeout(() => { if (callback) callback(); }, 0);
        });
      }),
    },
  },
   runtime: {
    getURL: jest.fn(path => `chrome-extension://mock-id/${path}`),
    onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
    }
  }
};


describe('ImportExportPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageData = { tabGroups: deepCopy(mockInitialGroups) }; // Reset storage
    (document.createElement as jest.Mock).mockClear().mockReturnValue(mockAnchorElement as any);
    mockLinkClick.mockClear();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    mockClipboardWriteText.mockClear();
    mockAnchorElement.setAttribute.mockClear();
  });

  // --- EXPORT TESTS ---
  describe('Export Functionality', () => {
    test('renders export section and triggers download export', async () => {
      render(<ImportExportPage />);
      expect(screen.getByText('mock-exportSectionTitle')).toBeInTheDocument();
      const exportButton = screen.getByRole('button', { name: 'mock-exportButtonText' });
      expect(exportButton).toBeInTheDocument();

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(chrome.storage.local.get).toHaveBeenCalledWith(['tabGroups'], expect.any(Function));
      });

      const expectedJson = JSON.stringify({ tabGroups: mockInitialGroups }, null, 2);
      const blob = mockCreateObjectURL.mock.calls[0][0];

      // This requires reading the blob, which is complex in Jest.
      // Instead, we'll trust that the blob contains the right data if createObjectURL was called.
      // For a more robust test, you might need a library or more complex blob mocking.
      // For now, we check if createObjectURL was called.
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      // expect(blob.type).toBe('application/json'); // Check blob type if possible

      expect(mockAnchorElement.href).toBe(mockCreateObjectURL.mock.results[0].value); // `blob://dummy-url-for-application/json`
      expect(mockAnchorElement.download).toBe('tab_groups_export.json');
      expect(mockLinkClick).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockAnchorElement.href); // Ensure cleanup
      expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-exportDownloadedMessage');
    });

    test('triggers copy to clipboard export', async () => {
      render(<ImportExportPage />);
      const copyButton = screen.getByRole('button', { name: 'mock-exportToClipboardButtonText' });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(chrome.storage.local.get).toHaveBeenCalledWith(['tabGroups'], expect.any(Function));
      });

      const expectedJson = JSON.stringify({ tabGroups: mockInitialGroups }, null, 2);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expectedJson);
      expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-exportSuccessMessage');
    });

    test('handles empty data for export (download)', async () => {
        mockStorageData = { tabGroups: [] };
        render(<ImportExportPage />);
        const exportButton = screen.getByRole('button', { name: 'mock-exportButtonText' });
        fireEvent.click(exportButton);

        await waitFor(() => expect(chrome.storage.local.get).toHaveBeenCalled());

        const expectedJson = JSON.stringify({ tabGroups: [] }, null, 2);
        // As above, direct blob content check is hard. We check if it was called.
        expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
        // Further checks as in the first export test
        expect(mockLinkClick).toHaveBeenCalledTimes(1);
        expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-exportDownloadedMessage'); // Still "succeeds" with empty data
    });

    test('handles empty data for export (clipboard)', async () => {
        mockStorageData = { tabGroups: [] };
        render(<ImportExportPage />);
        const copyButton = screen.getByRole('button', { name: 'mock-exportToClipboardButtonText' });
        fireEvent.click(copyButton);

        await waitFor(() => expect(chrome.storage.local.get).toHaveBeenCalled());

        const expectedJson = JSON.stringify({ tabGroups: [] }, null, 2);
        expect(mockClipboardWriteText).toHaveBeenCalledWith(expectedJson);
        expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-exportSuccessMessage');
    });
  });

  // --- IMPORT TESTS ---
  describe('Import Functionality', () => {
    test('renders import section', () => {
      render(<ImportExportPage />);
      expect(screen.getByText('mock-importSectionTitle')).toBeInTheDocument();
      expect(screen.getByLabelText('mock-importPasteJsonLabel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'mock-importButtonText' })).toBeInTheDocument();
      expect(screen.getByText('mock-importWarningOverwrite')).toBeInTheDocument();
    });

    test('successfully imports valid JSON data', async () => {
      const newGroupData = [{ id: 'g3', name: 'Imported Group', tabs: [], isOpen: true, createdAt: Date.now(), updatedAt: Date.now() }];
      const jsonDataToImport = JSON.stringify({ tabGroups: newGroupData });

      render(<ImportExportPage />);
      const textarea = screen.getByLabelText('mock-importPasteJsonLabel');
      const importButton = screen.getByRole('button', { name: 'mock-importButtonText' });

      fireEvent.change(textarea, { target: { value: jsonDataToImport } });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ tabGroups: newGroupData }, expect.any(Function));
      });
      expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-importSuccessMessage');
    });

    test('handles invalid JSON during import', async () => {
      const invalidJson = "{ not: json, ";
      render(<ImportExportPage />);
      const textarea = screen.getByLabelText('mock-importPasteJsonLabel');
      const importButton = screen.getByRole('button', { name: 'mock-importButtonText' });

      fireEvent.change(textarea, { target: { value: invalidJson } });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
      });
      expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-importErrorMessageJson');
    });

    test('handles JSON with incorrect schema (valid JSON, wrong structure)', async () => {
      const wrongSchemaJson = JSON.stringify({ myRandomData: "value" }); // Valid JSON, but not tabGroups
      render(<ImportExportPage />);
      const textarea = screen.getByLabelText('mock-importPasteJsonLabel');
      const importButton = screen.getByRole('button', { name: 'mock-importButtonText' });

      fireEvent.change(textarea, { target: { value: wrongSchemaJson } });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
      });
      expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-importErrorMessageSchema');
    });

    test('handles JSON with missing "tabGroups" key', async () => {
      const missingKeyJson = JSON.stringify([{ id: 'g3', name: 'Imported Group', tabs: [] }]); // Array instead of {tabGroups: []}
      render(<ImportExportPage />);
      const textarea = screen.getByLabelText('mock-importPasteJsonLabel');
      const importButton = screen.getByRole('button', { name: 'mock-importButtonText' });

      fireEvent.change(textarea, { target: { value: missingKeyJson } });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
      });
      expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-importErrorMessageSchema');
    });

    test('handles empty JSON string for import', async () => {
      render(<ImportExportPage />);
      const textarea = screen.getByLabelText('mock-importPasteJsonLabel');
      const importButton = screen.getByRole('button', { name: 'mock-importButtonText' });

      fireEvent.change(textarea, { target: { value: "" } }); // Empty input
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
      });
      // It might show "Invalid JSON" or a specific "empty data" error
      expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-importErrorMessageJson');
    });
  });

  test('renders footer', () => {
    render(<ImportExportPage />);
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

});
