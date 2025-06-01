import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MenuDropdown, { MenuDropdownItem } from './MenuDropdown'; // Adjust path

// Mock i18n
const mockGetMessage = jest.fn(messageName => `mock-${messageName}`);
(global as any).chrome = {
    ...(global as any).chrome,
    i18n: {
        getMessage: mockGetMessage,
    },
};

describe('MenuDropdown Component', () => {
  const mockItems: MenuDropdownItem[] = [
    { id: 'item1', label: 'Item 1', action: jest.fn() },
    { id: 'item2', label: 'Item 2', action: jest.fn() },
    { id: 'item3', label: 'Item 3', action: jest.fn(), disabled: true },
  ];

  beforeEach(() => {
    mockItems.forEach(item => (item.action as jest.Mock).mockClear());
    mockGetMessage.mockClear();
  });

  test('renders trigger and handles click to show/hide menu', async () => {
    render(<MenuDropdown triggerLabel="Open Menu" items={mockItems} />);

    const triggerButton = screen.getByRole('button', { name: 'Open Menu' });
    expect(triggerButton).toBeInTheDocument();

    // Menu items should not be visible initially
    expect(screen.queryByText('Item 1')).not.toBeVisible();
    expect(screen.queryByText('Item 2')).not.toBeVisible();

    // Click to open the menu
    fireEvent.click(triggerButton);

    // Menu items should now be visible
    // Using findByText for elements that appear asynchronously or after an interaction
    expect(await screen.findByText('Item 1')).toBeVisible();
    expect(screen.getByText('Item 2')).toBeVisible();
    expect(screen.getByText('Item 3')).toBeVisible(); // Disabled item should also be visible

    // Click again to close the menu
    fireEvent.click(triggerButton);

    // Menu items should be hidden again
    // Need to use waitFor because of transition/animation for hiding
    await waitFor(() => {
      expect(screen.queryByText('Item 1')).not.toBeVisible();
    });
    expect(screen.queryByText('Item 2')).not.toBeVisible();
  });

  test('calls callback on menu item click', async () => {
    render(<MenuDropdown triggerLabel="Actions" items={mockItems} />);

    const triggerButton = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(triggerButton);

    const menuItem1 = await screen.findByText('Item 1');
    fireEvent.click(menuItem1);

    expect(mockItems[0].action).toHaveBeenCalledTimes(1);
    expect(mockItems[1].action).not.toHaveBeenCalled();

    // Menu should close after item click
    await waitFor(() => {
      expect(screen.queryByText('Item 1')).not.toBeVisible();
    });
  });

  test('does not call action for a disabled menu item', async () => {
    render(<MenuDropdown triggerLabel="Actions" items={mockItems} />);

    const triggerButton = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(triggerButton);

    const disabledItem = await screen.findByText('Item 3');
    expect(disabledItem).toHaveAttribute('aria-disabled', 'true'); // Or check for a specific class if that's how it's implemented

    fireEvent.click(disabledItem);
    expect(mockItems[2].action).not.toHaveBeenCalled();

    // Menu should still be open if a disabled item is clicked
    expect(screen.getByText('Item 1')).toBeVisible();
  });

  test('closes menu on Escape key press', async () => {
    render(<MenuDropdown triggerLabel="Open Menu" items={mockItems} />);
    const triggerButton = screen.getByRole('button', { name: 'Open Menu' });
    fireEvent.click(triggerButton);

    expect(await screen.findByText('Item 1')).toBeVisible(); // Menu is open

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Item 1')).not.toBeVisible();
    });
  });

  test('closes menu on outside click', async () => {
    render(
      <div>
        <MenuDropdown triggerLabel="Open Menu" items={mockItems} />
        <button>Outside Button</button>
      </div>
    );
    const triggerButton = screen.getByRole('button', { name: 'Open Menu' });
    fireEvent.click(triggerButton);

    expect(await screen.findByText('Item 1')).toBeVisible(); // Menu is open

    const outsideButton = screen.getByRole('button', { name: 'Outside Button' });
    fireEvent.mouseDown(outsideButton); // mouseDown on an outside element often closes dropdowns

    await waitFor(() => {
      expect(screen.queryByText('Item 1')).not.toBeVisible();
    });
  });

  test('uses i18n for item labels if they are message keys', async () => {
    const i18nMockItems: MenuDropdownItem[] = [
      { id: 'i18nItem1', label: 'menuExport', action: jest.fn() }, // Assuming 'menuExport' is an i18n key
    ];
    mockGetMessage.mockImplementation(key => key === 'menuExport' ? 'Export Data' : `mock-${key}`);

    render(<MenuDropdown triggerLabel="i18n Menu" items={i18nMockItems} useLabelsAsKeys={true} />);
    const triggerButton = screen.getByRole('button', { name: 'i18n Menu' });
    fireEvent.click(triggerButton);

    expect(await screen.findByText('Export Data')).toBeVisible();
    expect(mockGetMessage).toHaveBeenCalledWith('menuExport');
  });

});
