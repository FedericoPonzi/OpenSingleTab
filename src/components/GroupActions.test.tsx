import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupActions from './GroupActions'; // Adjust path as necessary

// Mock i18n for this component test file
const mockGetMessage = jest.fn((messageName, substitutions) => {
    const messages = {
        "groupActionsRestore": "Restore All",
        "groupActionsDelete": "Delete Group",
        "groupActionsConfirmDelete": "Are you sure you want to delete this group?",
        // Add other messages if GroupActions uses them
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
    ...(global as any).chrome, // Preserve other chrome mocks if any
    i18n: {
        getMessage: mockGetMessage,
    },
};

// Mock window.confirm
const mockConfirm = jest.fn(() => true); // Default to user clicking "OK"
(global as any).confirm = mockConfirm;


describe('GroupActions Component', () => {
  const mockOnRestore = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockGetMessage.mockClear();
    mockOnRestore.mockClear();
    mockOnDelete.mockClear();
    mockConfirm.mockClear().mockReturnValue(true); // Reset confirm mock
  });

  test('renders action buttons', () => {
    render(<GroupActions onRestore={mockOnRestore} onDelete={mockOnDelete} groupName="Test Group" />);

    expect(screen.getByRole('button', { name: 'mock-groupActionsRestore' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'mock-groupActionsDelete' })).toBeInTheDocument();
  });

  test('calls onRestore callback when Restore button is clicked', () => {
    render(<GroupActions onRestore={mockOnRestore} onDelete={mockOnDelete} groupName="Test Group" />);

    const restoreButton = screen.getByRole('button', { name: 'mock-groupActionsRestore' });
    fireEvent.click(restoreButton);

    expect(mockOnRestore).toHaveBeenCalledTimes(1);
  });

  test('calls onDelete callback after confirmation when Delete button is clicked', () => {
    render(<GroupActions onRestore={mockOnRestore} onDelete={mockOnDelete} groupName="Test Group" />);

    const deleteButton = screen.getByRole('button', { name: 'mock-groupActionsDelete' });
    fireEvent.click(deleteButton);

    // Check that window.confirm was called
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    // The component should use i18n for the confirmation message
    expect(mockConfirm).toHaveBeenCalledWith(mockGetMessage("groupActionsConfirmDelete", "Test Group"));


    // Since mockConfirm defaults to true, onDelete should be called
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  test('does not call onDelete callback if confirmation is cancelled', () => {
    mockConfirm.mockReturnValueOnce(false); // Simulate user clicking "Cancel"
    render(<GroupActions onRestore={mockOnRestore} onDelete={mockOnDelete} groupName="Test Group" />);

    const deleteButton = screen.getByRole('button', { name: 'mock-groupActionsDelete' });
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  test('uses i18n for button texts and confirmation', () => {
    render(<GroupActions onRestore={mockOnRestore} onDelete={mockOnDelete} groupName="Another Group" />);
    expect(mockGetMessage).toHaveBeenCalledWith("groupActionsRestore");
    expect(mockGetMessage).toHaveBeenCalledWith("groupActionsDelete");

    // Trigger confirmation
    const deleteButton = screen.getByRole('button', { name: 'mock-groupActionsDelete' });
    fireEvent.click(deleteButton);
    expect(mockGetMessage).toHaveBeenCalledWith("groupActionsConfirmDelete", "Another Group");
  });

});
