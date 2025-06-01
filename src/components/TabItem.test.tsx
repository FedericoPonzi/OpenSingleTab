import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TabItem from './TabItem'; // Adjust path
import { SavedTab } from '../types/tabs'; // Assuming this type definition

// Mock i18n
const mockGetMessage = jest.fn((messageName, substitutions) => {
    const messages = {
        "tabItemDeleteButton": "Delete this tab",
        "tabItemPinButton": "Pin this tab",
        "tabItemUnpinButton": "Unpin this tab",
        "tabItemCurrentMarker": "(Current Tab)",
    };
    let message = messages[messageName] || `mock-${messageName}`;
     if (substitutions) {
        if (typeof substitutions === 'string') {
            message = message.replace('$1$', substitutions);
        } else if (Array.isArray(substitutions)) {
            substitutions.forEach((sub, i) => {
                message = message.replace(`$${i+1}$`, sub);
            });
        }
    }
    return message;
});

(global as any).chrome = {
    ...(global as any).chrome,
    i18n: {
        getMessage: mockGetMessage,
    },
};

describe('TabItem Component', () => {
  const mockTab: SavedTab = {
    id: 't1',
    url: 'https://example.com',
    title: 'Example Tab Title',
    favIconUrl: 'https://example.com/favicon.ico',
    pinned: false,
  };

  const mockOnClick = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnTogglePin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tab title and favicon', () => {
    render(
      <TabItem
        tab={mockTab}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );

    expect(screen.getByText('Example Tab Title')).toBeInTheDocument();
    const favicon = screen.getByRole('img', { name: /favicon/i }); // name might vary based on alt text
    expect(favicon).toBeInTheDocument();
    expect(favicon).toHaveAttribute('src', 'https://example.com/favicon.ico');
  });

  test('renders default favicon if favIconUrl is missing or empty', () => {
    render(
      <TabItem
        tab={{ ...mockTab, favIconUrl: undefined }}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );
    const favicon = screen.getByRole('img', { name: /favicon/i });
    expect(favicon).toBeInTheDocument();
    // Check for a default path or a specific class if your component handles this
    // For example, if it falls back to chrome.runtime.getURL('images/default-favicon.png')
    // The global chrome mock for getURL is `chrome-extension://mock-id/${path}`
    expect(favicon).toHaveAttribute('src', 'chrome-extension://mock-id/images/default-favicon.png');
  });

  test('calls onClick when the tab item (main body/link) is clicked', () => {
    render(
      <TabItem
        tab={mockTab}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );
    // The clickable area is usually the link wrapping the title
    const tabLink = screen.getByRole('link', { name: 'Example Tab Title' });
    fireEvent.click(tabLink);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(mockTab);
  });

  test('calls onDelete when the delete button is clicked', () => {
    render(
      <TabItem
        tab={mockTab}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );
    const deleteButton = screen.getByRole('button', { name: 'mock-tabItemDeleteButton' });
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockTab.id);
  });

  test('calls onTogglePin when the pin button is clicked (for unpinned tab)', () => {
    render(
      <TabItem
        tab={{...mockTab, pinned: false}}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );
    const pinButton = screen.getByRole('button', { name: 'mock-tabItemPinButton' });
    fireEvent.click(pinButton);
    expect(mockOnTogglePin).toHaveBeenCalledTimes(1);
    expect(mockOnTogglePin).toHaveBeenCalledWith(mockTab.id);
  });

  test('calls onTogglePin when the unpin button is clicked (for pinned tab)', () => {
    render(
      <TabItem
        tab={{...mockTab, pinned: true}}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );
    const unpinButton = screen.getByRole('button', { name: 'mock-tabItemUnpinButton' });
    fireEvent.click(unpinButton);
    expect(mockOnTogglePin).toHaveBeenCalledTimes(1);
    expect(mockOnTogglePin).toHaveBeenCalledWith(mockTab.id);
  });

  test('displays current tab marker if isCurrent is true', () => {
    render(
      <TabItem
        tab={mockTab}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={true}
      />
    );
    // The marker text comes from i18n
    expect(screen.getByText('mock-tabItemCurrentMarker')).toBeInTheDocument();
  });

  test('does not display current tab marker if isCurrent is false', () => {
    render(
      <TabItem
        tab={mockTab}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );
    expect(screen.queryByText('mock-tabItemCurrentMarker')).not.toBeInTheDocument();
  });

  test('uses i18n for button aria-labels/titles', () => {
     render(
      <TabItem
        tab={{...mockTab, pinned: true}}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={true}
      />
    );
    expect(mockGetMessage).toHaveBeenCalledWith("tabItemDeleteButton");
    expect(mockGetMessage).toHaveBeenCalledWith("tabItemUnpinButton"); // Since pinned is true
    expect(mockGetMessage).toHaveBeenCalledWith("tabItemCurrentMarker");

    render(
      <TabItem
        tab={{...mockTab, pinned: false}}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onTogglePin={mockOnTogglePin}
        isCurrent={false}
      />
    );
    expect(mockGetMessage).toHaveBeenCalledWith("tabItemPinButton"); // Since pinned is false
  });

});
