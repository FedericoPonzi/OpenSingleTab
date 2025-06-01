import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DisplayPage from './display'; // Assuming DisplayPage is the main export
import { SavedTabGroup, SavedTab } from '../types/tabs';

// Mock child components to simplify DisplayPage tests
jest.mock('../components/TabGroup', () => jest.fn(({
    group,
    onGroupNameChange,
    onGroupDelete,
    onGroupRestore,
    onTabClick,
    onTabDelete,
    onTabTogglePin,
    onToggleGroupOpen,
    currentTabId
}) => (
  <div data-testid={`mock-tab-group-${group.id}`} aria-label={`Group ${group.name}`}>
    <h2 onClick={() => onToggleGroupOpen(group.id)}>{group.name}</h2>
    <input
        type="text"
        aria-label={`Rename ${group.name}`}
        defaultValue={group.name}
        onBlur={(e) => onGroupNameChange(group.id, e.target.value)}
    />
    <button onClick={() => onGroupRestore(group.id)}>Restore Group</button>
    <button onClick={() => onGroupDelete(group.id)}>Delete Group</button>
    {group.isOpen && group.tabs.map((tab: SavedTab) => (
      <div key={tab.id} data-testid={`mock-tab-item-${tab.id}`}>
        <span onClick={() => onTabClick(tab)}>{tab.title}</span>
        <button onClick={() => onTabDelete(group.id, tab.id)}>Delete Tab</button>
        <button onClick={() => onTabTogglePin(group.id, tab.id)}>{tab.pinned ? 'Unpin' : 'Pin'}</button>
        {currentTabId === tab.id && <span>(Current)</span>}
      </div>
    ))}
  </div>
)));

jest.mock('../components/StatusMessage', () => jest.fn(({ message, type, onDismiss }) => {
    if (!message) return null;
    return <div data-testid="mock-status-message" className={`status-${type}`}>{message} <button onClick={onDismiss}>Dismiss</button></div>;
}));

jest.mock('../components/Footer', () => jest.fn(() => <div data-testid="mock-footer">Mock Footer</div>));


// Mock i18n and other chrome APIs
const mockGetMessage = jest.fn((messageName, substitutions) => {
    const messages = {
        "tabsDisplayTitle": "My Saved Tabs",
        "tabsDisplayLoading": "Loading tabs...",
        "tabsDisplayNoGroups": "No tab groups found. Save some tabs first!",
        "tabsDisplaySearchPlaceholder": "Search saved tabs...",
        "tabsDisplayGroupDeleted": "Group deleted.",
        "tabsDisplayTabDeleted": "Tab deleted.",
        "tabsDisplayGroupRestored": "Group tabs opened.",
        // Add more as needed
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
  { id: 'g1', name: 'Work Tabs', tabs: [{id: 't1', title: 'Doc 1', url: 'https://docs.example.com/1', pinned: false}], isOpen: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'g2', name: 'Personal Tabs', tabs: [{id: 't2', title: 'Blog Post', url: 'https://blog.example.com/1', pinned: false}, {id: 't3', title: 'Music', url: 'https://music.example.com', pinned: true}], isOpen: false, createdAt: Date.now(), updatedAt: Date.now() },
];

// Deep copy helper for mocks to avoid state leakage between tests
const deepCopy = (data: any) => JSON.parse(JSON.stringify(data));

let mockStorageData: { [key: string]: any } = { tabGroups: deepCopy(mockInitialGroups) };

(global as any).chrome = {
  i18n: { getMessage: mockGetMessage },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        act(() => {
            const result = {};
            const keyList = typeof keys === 'string' ? [keys] : keys;
            keyList.forEach(key => result[key] = mockStorageData[key] ? deepCopy(mockStorageData[key]) : undefined);
            // Simulate async
            setTimeout(() => callback(result), 0);
        });
      }),
      set: jest.fn((items, callback) => {
        act(() => {
            Object.keys(items).forEach(key => mockStorageData[key] = deepCopy(items[key]));
            // Simulate async
             setTimeout(() => { if (callback) callback(); }, 0);
        });
      }),
    },
  },
  tabs: {
    create: jest.fn((props, callback) => {
        if (callback) setTimeout(() => callback({id: Math.floor(Math.random() * 1000), ...props}), 0);
        return Promise.resolve({id: Math.floor(Math.random() * 1000), ...props});
    }),
    update: jest.fn((tabId, props, callback) => {
        if (callback) setTimeout(() => callback({id: tabId, ...props}), 0);
        return Promise.resolve({id: tabId, ...props});
    }),
    query: jest.fn((options, callback) => { // For "open tab" logic that checks if tab exists
        setTimeout(() => callback([]),0); // Default to tab not found
    }),
  },
  runtime: {
    getURL: jest.fn(path => `chrome-extension://mock-id/${path}`),
    onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
    }
  }
};

describe('DisplayPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset storage to initial state for each test
    mockStorageData = { tabGroups: deepCopy(mockInitialGroups) };
    // Reset chrome.tabs.query to default (no tab found)
    (global as any).chrome.tabs.query.mockImplementation((options, callback) => {
        setTimeout(() => callback([]),0);
    });
  });

  test('renders loading state initially and then displays tab groups', async () => {
    // Special mock for this test to delay storage response
    (global as any).chrome.storage.local.get.mockImplementationOnce((keys, callback) => {
        // Don't call callback immediately to show loading
        // The actual loading state depends on component's implementation
    });
    render(<DisplayPage />);
    // Check for loading indicator (actual text/element depends on component)
    // For now, let's assume it doesn't show "My Saved Tabs" or groups yet
    expect(screen.queryByText('My Saved Tabs')).not.toBeInTheDocument();

    // Now simulate data loading completion by calling the original mock
    (global as any).chrome.storage.local.get.mockImplementation((keys, callback) => {
        const result = {};
        const keyList = typeof keys === 'string' ? [keys] : keys;
        keyList.forEach(key => result[key] = mockStorageData[key] ? deepCopy(mockStorageData[key]) : undefined);
        setTimeout(() => callback(result), 0);
    });

    // Re-trigger useEffect or data loading if necessary, or wait for existing one
    // This part is tricky without knowing exactly how DisplayPage handles loading.
    // If it retries or has a watcher, this might work. Often, a re-render or state change is needed.
    // For this test, we'll assume the initial render will eventually pick up the data.
    // A better way would be to control a promise for loading.

    // Using findBy queries that wait for elements to appear
    expect(await screen.findByText('My Saved Tabs')).toBeInTheDocument(); // Page title
    expect(await screen.findByLabelText('Group Work Tabs')).toBeInTheDocument();
    expect(screen.getByLabelText('Group Personal Tabs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  test('handles empty state (no tab groups saved)', async () => {
    mockStorageData = { tabGroups: [] }; // Set storage to empty
    render(<DisplayPage />);
    expect(await screen.findByText('mock-tabsDisplayNoGroups')).toBeInTheDocument();
  });

  test('deletes a group and updates display', async () => {
    render(<DisplayPage />);
    expect(await screen.findByLabelText('Group Work Tabs')).toBeInTheDocument();

    const deleteWorkTabsButton = screen.getByRole('button', { name: 'Delete Group' }); // Assuming this is unique enough or refine selector
    // This will be the first "Delete Group" button found, which should be for "Work Tabs" if rendered in order.
    // A better way is to get it via the group's mocked element:
    const workGroupElement = screen.getByTestId('mock-tab-group-g1');
    const deleteButtonInGroup = Array.from(workGroupElement.querySelectorAll('button')).find(b => b.textContent === 'Delete Group');

    expect(deleteButtonInGroup).toBeDefined();
    if (!deleteButtonInGroup) return;

    fireEvent.click(deleteButtonInGroup);

    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      // Check that the remaining group is 'Personal Tabs'
      expect(chrome.storage.local.set.mock.calls[0][0].tabGroups[0].name).toBe('Personal Tabs');
    });

    expect(screen.queryByLabelText('Group Work Tabs')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Group Personal Tabs')).toBeInTheDocument(); // Ensure other group is still there
    expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-tabsDisplayGroupDeleted');
  });

  test('renames a group and updates display', async () => {
    render(<DisplayPage />);
    const workGroup = await screen.findByTestId('mock-tab-group-g1');
    const renameInput = workGroup.querySelector('input[aria-label="Rename Work Tabs"]') as HTMLInputElement;

    expect(renameInput).toBeDefined();
    if (!renameInput) return;

    fireEvent.change(renameInput, { target: { value: 'Updated Work Tasks' } });
    fireEvent.blur(renameInput); // Assuming blur triggers save in the mocked TabGroup

    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      expect(chrome.storage.local.set.mock.calls[0][0].tabGroups.find(g => g.id === 'g1').name).toBe('Updated Work Tasks');
    });

    // The mocked TabGroup itself receives the new name via prop, so its h2 should update
    expect(await screen.findByText('Updated Work Tasks')).toBeInTheDocument();
  });

  test('restores all tabs in a group (opens multiple tabs)', async () => {
    render(<DisplayPage />);
    const workGroupElement = await screen.findByTestId('mock-tab-group-g1');
    const restoreButtonInGroup = Array.from(workGroupElement.querySelectorAll('button')).find(b => b.textContent === 'Restore Group');

    expect(restoreButtonInGroup).toBeDefined();
    if (!restoreButtonInGroup) return;

    fireEvent.click(restoreButtonInGroup);

    await waitFor(() => {
      expect(chrome.tabs.create).toHaveBeenCalledTimes(mockInitialGroups[0].tabs.length);
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://docs.example.com/1', active: false }, expect.any(Function));
    });
    expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-tabsDisplayGroupRestored');
  });

  test('opens a single tab from a group (checks existing, then creates)', async () => {
    render(<DisplayPage />);
    const workGroupElement = await screen.findByTestId('mock-tab-group-g1'); // Work Tabs
    const tab1TitleElement = Array.from(workGroupElement.querySelectorAll('span')).find(s => s.textContent === 'Doc 1');

    expect(tab1TitleElement).toBeDefined();
    if (!tab1TitleElement) return;

    // 1. Tab does not exist, chrome.tabs.create should be called
    fireEvent.click(tab1TitleElement);
    await waitFor(() => {
        expect(chrome.tabs.query).toHaveBeenCalledWith({ url: 'https://docs.example.com/1', currentWindow: true }, expect.any(Function));
        expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://docs.example.com/1', active: true }, expect.any(Function));
    });
    chrome.tabs.create.mockClear(); // Clear for next assertion

    // 2. Tab exists, chrome.tabs.update should be called
    (global as any).chrome.tabs.query.mockImplementationOnce((options, callback) => {
        setTimeout(() => callback([{ id: 123, url: 'https://docs.example.com/1' }]),0); // Simulate tab found
    });
    fireEvent.click(tab1TitleElement);
    await waitFor(() => {
        expect(chrome.tabs.update).toHaveBeenCalledWith(123, { active: true }, expect.any(Function));
        expect(chrome.tabs.create).not.toHaveBeenCalled();
    });
  });

  test('deletes a single tab from a group', async () => {
    render(<DisplayPage />);
    const workGroupElement = await screen.findByTestId('mock-tab-group-g1');
    const deleteTab1Button = Array.from(workGroupElement.querySelectorAll('button')).find(b => b.textContent === 'Delete Tab' && workGroupElement.textContent?.includes('Doc 1'));

    expect(deleteTab1Button).toBeDefined();
    if (!deleteTab1Button) return;

    fireEvent.click(deleteTab1Button);

    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      const updatedGroups = chrome.storage.local.set.mock.calls[0][0].tabGroups;
      const workGroup = updatedGroups.find(g => g.id === 'g1');
      expect(workGroup.tabs.length).toBe(0); // Doc 1 was the only tab
    });
    expect(await screen.findByTestId('mock-status-message')).toHaveTextContent('mock-tabsDisplayTabDeleted');
    // Verify UI update (Doc 1 should be gone)
    expect(screen.queryByText('Doc 1')).not.toBeInTheDocument();
  });

  test('toggles a tab pin state', async () => {
    render(<DisplayPage />);
    const personalGroupElement = await screen.findByTestId('mock-tab-group-g2'); // Personal Tabs
    // Music tab (t3) is initially pinned: true
    const pinMusicTabButton = Array.from(personalGroupElement.querySelectorAll('button')).find(b => b.textContent === 'Unpin' && personalGroupElement.textContent?.includes('Music'));

    expect(pinMusicTabButton).toBeDefined();
    if (!pinMusicTabButton) return;

    fireEvent.click(pinMusicTabButton); // Click to unpin

    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
      const updatedGroups = chrome.storage.local.set.mock.calls[0][0].tabGroups;
      const personalGroup = updatedGroups.find(g => g.id === 'g2');
      const musicTab = personalGroup.tabs.find(t => t.id === 't3');
      expect(musicTab.pinned).toBe(false);
    });
    // Check if button text changed in mock (from Unpin to Pin)
    expect(pinMusicTabButton.textContent).toBe('Pin');
  });

  test('filters displayed groups and tabs based on search input', async () => {
    render(<DisplayPage />);
    const searchInput = screen.getByPlaceholderText('mock-tabsDisplaySearchPlaceholder');

    fireEvent.change(searchInput, { target: { value: 'Doc 1' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Group Work Tabs')).toBeInTheDocument(); // Contains "Doc 1"
      expect(screen.queryByLabelText('Group Personal Tabs')).not.toBeInTheDocument(); // Does not contain "Doc 1"
      expect(screen.getByText('Doc 1')).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'Music' } });
    await waitFor(() => {
      expect(screen.queryByLabelText('Group Work Tabs')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Group Personal Tabs')).toBeInTheDocument(); // Contains "Music"
      expect(screen.getByText('Music')).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'Tabs' } }); // Matches group names
     await waitFor(() => {
      expect(screen.getByLabelText('Group Work Tabs')).toBeInTheDocument();
      expect(screen.getByLabelText('Group Personal Tabs')).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    await waitFor(() => {
      expect(screen.queryByLabelText('Group Work Tabs')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Group Personal Tabs')).not.toBeInTheDocument();
      expect(screen.getByText('mock-tabsDisplayNoGroups')).toBeInTheDocument(); // Or some other "no results" message
    });
  });

  test('toggles group open/closed state', async () => {
    render(<DisplayPage />);
    const personalGroup = await screen.findByTestId('mock-tab-group-g2'); // Personal Tabs, initially isOpen: false
    const personalGroupTitle = personalGroup.querySelector('h2');

    expect(personalGroupTitle).toBeDefined();
    if(!personalGroupTitle) return;

    // Check that tabs are not visible initially (as per isOpen: false in mock data and mock TabGroup logic)
    expect(screen.queryByText('Blog Post')).not.toBeInTheDocument();

    fireEvent.click(personalGroupTitle); // Click to open

    await waitFor(() => {
      // The mock TabGroup re-renders with the new isOpen state if DisplayPage handles it correctly
      // We need to ensure DisplayPage updates the group's isOpen prop and re-renders.
      // The mock TabGroup itself will show/hide tabs based on the group.isOpen prop it receives.
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1); // For saving the open state
      const updatedGroups = chrome.storage.local.set.mock.calls[0][0].tabGroups;
      const pGroup = updatedGroups.find(g => g.id === 'g2');
      expect(pGroup.isOpen).toBe(true);
    });

    // After state update and re-render, tabs should be visible.
    // Need to re-query for the group to get its updated state if the test component re-renders.
    // Or rely on findByText for the tab title to appear.
    expect(await screen.findByText('Blog Post')).toBeVisible();
    expect(screen.getByText('Music')).toBeVisible();

    fireEvent.click(personalGroupTitle); // Click to close again
     await waitFor(() => {
      const updatedGroups = chrome.storage.local.set.mock.calls[1][0].tabGroups; // Second call
      const pGroup = updatedGroups.find(g => g.id === 'g2');
      expect(pGroup.isOpen).toBe(false);
    });
    expect(screen.queryByText('Blog Post')).not.toBeInTheDocument();
  });

});
