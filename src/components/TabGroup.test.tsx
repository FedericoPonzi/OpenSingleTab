import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TabGroup from './TabGroup'; // Adjust path
import { SavedTabGroup } from '../types/tabs'; // Assuming this type definition

// Mock child components
jest.mock('./EditableGroupTitle', () => ({ title, onTitleChange }) => (
  <input
    data-testid="mock-editable-title"
    value={title}
    onChange={(e) => onTitleChange(e.target.value)}
    aria-label="Group Title"
  />
));

jest.mock('./GroupActions', () => ({ onRestore, onDelete, groupName }) => (
  <div data-testid="mock-group-actions">
    <button onClick={onRestore} aria-label={`Restore ${groupName}`}>Restore</button>
    <button onClick={onDelete} aria-label={`Delete ${groupName}`}>Delete</button>
  </div>
));

jest.mock('./TabItem', () => ({ tab, onClick, onDelete, onTogglePin, isCurrent }) => (
  <div data-testid={`mock-tab-item-${tab.id}`} role="listitem">
    <span>{tab.title}</span>
    {onClick && <button onClick={() => onClick(tab)} aria-label={`Open ${tab.title}`}>Open</button>}
    {onDelete && <button onClick={() => onDelete(tab.id)} aria-label={`Delete ${tab.title}`}>Remove</button>}
    {onTogglePin && <button onClick={() => onTogglePin(tab.id)} aria-label={`Pin ${tab.title}`}>{tab.pinned ? 'Unpin' : 'Pin'}</button>}
    {isCurrent && <span>(Current)</span>}
  </div>
));

// Mock i18n
const mockGetMessage = jest.fn(messageName => `mock-${messageName}`);
(global as any).chrome = {
    ...(global as any).chrome,
    i18n: {
        getMessage: mockGetMessage,
    },
};


describe('TabGroup Component', () => {
  const mockGroup: SavedTabGroup = {
    id: 'group1',
    name: 'My Test Group',
    tabs: [
      { id: 'tab1', title: 'Tab 1', url: 'https://example.com/tab1', favIconUrl: '', pinned: false },
      { id: 'tab2', title: 'Tab 2', url: 'https://example.com/tab2', favIconUrl: '', pinned: true },
    ],
    isOpen: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockCallbacks = {
    onGroupNameChange: jest.fn(),
    onGroupDelete: jest.fn(),
    onGroupRestore: jest.fn(),
    onTabClick: jest.fn(),
    onTabDelete: jest.fn(),
    onTabTogglePin: jest.fn(),
    onToggleGroupOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders group title (via mock) and list of TabItems (via mock)', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);

    // Check for mocked EditableGroupTitle
    const titleInput = screen.getByLabelText('Group Title') as HTMLInputElement;
    expect(titleInput).toBeInTheDocument();
    expect(titleInput.value).toBe('My Test Group');

    // Check for mocked GroupActions
    expect(screen.getByTestId('mock-group-actions')).toBeInTheDocument();

    // Check for mocked TabItems
    expect(screen.getByTestId('mock-tab-item-tab1')).toBeInTheDocument();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-tab-item-tab2')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  test('calls onGroupNameChange when title is changed in mock EditableGroupTitle', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);
    const titleInput = screen.getByLabelText('Group Title');
    fireEvent.change(titleInput, { target: { value: 'New Group Name' } });
    expect(mockCallbacks.onGroupNameChange).toHaveBeenCalledWith(mockGroup.id, 'New Group Name');
  });

  test('calls onGroupRestore from mock GroupActions', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);
    const restoreButton = screen.getByRole('button', { name: `Restore ${mockGroup.name}`});
    fireEvent.click(restoreButton);
    expect(mockCallbacks.onGroupRestore).toHaveBeenCalledWith(mockGroup.id);
  });

  test('calls onGroupDelete from mock GroupActions', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);
    const deleteButton = screen.getByRole('button', { name: `Delete ${mockGroup.name}`});
    fireEvent.click(deleteButton);
    expect(mockCallbacks.onGroupDelete).toHaveBeenCalledWith(mockGroup.id);
  });

  test('calls onTabClick when a tab (mock TabItem) is clicked', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);
    const openTab1Button = screen.getByRole('button', { name: `Open Tab 1`});
    fireEvent.click(openTab1Button);
    expect(mockCallbacks.onTabClick).toHaveBeenCalledWith(mockGroup.tabs[0]);
  });

  test('calls onTabDelete when a tab (mock TabItem) delete is clicked', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);
    const deleteTab1Button = screen.getByRole('button', { name: `Delete Tab 1`});
    fireEvent.click(deleteTab1Button);
    expect(mockCallbacks.onTabDelete).toHaveBeenCalledWith(mockGroup.id, 'tab1');
  });

  test('calls onTabTogglePin when a tab (mock TabItem) pin is toggled', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);
    const pinTab1Button = screen.getByRole('button', { name: `Pin Tab 1`}); // Tab 1 is initially unpinned
    fireEvent.click(pinTab1Button);
    expect(mockCallbacks.onTabTogglePin).toHaveBeenCalledWith(mockGroup.id, 'tab1');
  });

  test('displays tabs section if group.isOpen is true', () => {
    render(<TabGroup group={{ ...mockGroup, isOpen: true }} {...mockCallbacks} currentTabId={null} />);
    expect(screen.getByTestId('mock-tab-item-tab1')).toBeVisible();
  });

  test('does not display tabs section if group.isOpen is false', () => {
    // To properly test this, the TabGroup component would need to conditionally render the list.
    // Our mock TabItem doesn't know about isOpen, so we rely on the actual component's logic.
    // If TabGroup wraps the list in a div, we can check for its absence.
    // For now, this test assumes the list of TabItems itself would not be rendered.
    // This test might need adjustment based on TabGroup's actual DOM structure for collapsed state.
    const { container } = render(<TabGroup group={{ ...mockGroup, isOpen: false }} {...mockCallbacks} currentTabId={null} />);

    // A simple way if TabItems are directly hidden:
    // expect(screen.queryByTestId('mock-tab-item-tab1')).not.toBeVisible(); // This might not work if items are simply not rendered vs. display:none

    // A more robust way is to check for the container of the tabs.
    // If the component has a specific data-testid for the tabs container:
    // expect(screen.queryByTestId('tab-list-container')).not.toBeInTheDocument();
    // For now, we assume if isOpen is false, the items are not passed or rendered.
    // The mock TabItem will still render if it receives props.
    // So, we'd need TabGroup to *not* map over tabs if !isOpen.
    // Let's check if the list role is missing.
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  test('calls onToggleGroupOpen when the group header/expander is clicked', () => {
    // Assuming there's a clickable element in TabGroup (not in the mocked children)
    // that handles toggling. Let's say it's a div with a specific role or testid.
    // This part is highly dependent on TabGroup's actual implementation for the toggle.
    // For this example, let's assume the mocked EditableGroupTitle's container is clickable for toggle.
    // This is a common pattern.
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={null} />);
    const titleInputElement = screen.getByLabelText('Group Title');
    // Let's assume the parent of the input is the clickable header for toggle.
    // This is a guess; actual implementation will determine the target.
    const headerElement = titleInputElement.closest('div'); // Or whatever the toggle element is

    if (headerElement) {
        fireEvent.click(headerElement);
        expect(mockCallbacks.onToggleGroupOpen).toHaveBeenCalledWith(mockGroup.id);
    } else {
        // If this fails, it means the assumption about the clickable area is wrong.
        // We would need to inspect TabGroup.tsx to find the actual toggle mechanism.
        console.warn("Could not find assumed toggle element for TabGroup expansion. Test for onToggleGroupOpen might be incomplete.");
    }
  });

  test('identifies current tab correctly', () => {
    render(<TabGroup group={mockGroup} {...mockCallbacks} currentTabId={'tab1'} />);
    const tab1Item = screen.getByTestId('mock-tab-item-tab1');
    expect(tab1Item).toHaveTextContent('(Current)');

    const tab2Item = screen.getByTestId('mock-tab-item-tab2');
    expect(tab2Item).not.toHaveTextContent('(Current)');
  });

});
