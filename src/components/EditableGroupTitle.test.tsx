import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditableGroupTitle from './EditableGroupTitle'; // Adjust path as necessary

// Mock i18n for this component test file
const mockGetMessage = jest.fn(messageName => `mock-${messageName}`);
(global as any).chrome = {
    ...(global as any).chrome, // Preserve other chrome mocks if any
    i18n: {
        getMessage: mockGetMessage,
    },
};

describe('EditableGroupTitle Component', () => {
  beforeEach(() => {
    mockGetMessage.mockClear();
  });

  test('renders initial title', () => {
    render(<EditableGroupTitle title="Initial Group Title" onTitleChange={jest.fn()} />);
    // The component uses an input field for display and editing.
    // So we check the display value of the input.
    const inputElement = screen.getByDisplayValue('Initial Group Title');
    expect(inputElement).toBeInTheDocument();
  });

  test('switches to edit mode (implicitly, as it is an input), changes value, and calls onTitleChange on blur', () => {
    const handleTitleChange = jest.fn();
    const initialTitle = "Original Title";
    render(<EditableGroupTitle title={initialTitle} onTitleChange={handleTitleChange} />);

    const inputElement = screen.getByDisplayValue(initialTitle) as HTMLInputElement;

    // Simulate user focusing and typing a new title
    fireEvent.focus(inputElement);
    fireEvent.change(inputElement, { target: { value: 'Updated Group Title' } });

    // Check if the input value has changed
    expect(inputElement.value).toBe('Updated Group Title');

    // Simulate blur to confirm the change
    fireEvent.blur(inputElement);

    // Assert onTitleChange was called with the new title
    expect(handleTitleChange).toHaveBeenCalledTimes(1);
    expect(handleTitleChange).toHaveBeenCalledWith('Updated Group Title');
  });

  test('calls onTitleChange on pressing Enter key', () => {
    const handleTitleChange = jest.fn();
    const initialTitle = "Enter Key Test";
    render(<EditableGroupTitle title={initialTitle} onTitleChange={handleTitleChange} />);

    const inputElement = screen.getByDisplayValue(initialTitle) as HTMLInputElement;

    fireEvent.change(inputElement, { target: { value: 'New Title via Enter' } });
    fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(handleTitleChange).toHaveBeenCalledTimes(1);
    expect(handleTitleChange).toHaveBeenCalledWith('New Title via Enter');
  });

  test('does not call onTitleChange if title has not changed', () => {
    const handleTitleChange = jest.fn();
    const initialTitle = "No Change Title";
    render(<EditableGroupTitle title={initialTitle} onTitleChange={handleTitleChange} />);

    const inputElement = screen.getByDisplayValue(initialTitle) as HTMLInputElement;

    fireEvent.focus(inputElement);
    // No change in value
    fireEvent.blur(inputElement);

    expect(handleTitleChange).not.toHaveBeenCalled();
  });

  test('reverts to original title on pressing Escape key', () => {
    const handleTitleChange = jest.fn();
    const initialTitle = "Escape Key Test";
    render(<EditableGroupTitle title={initialTitle} onTitleChange={handleTitleChange} />);

    const inputElement = screen.getByDisplayValue(initialTitle) as HTMLInputElement;

    fireEvent.change(inputElement, { target: { value: 'Temporary Change' } });
    expect(inputElement.value).toBe('Temporary Change');

    fireEvent.keyDown(inputElement, { key: 'Escape', code: 'Escape', charCode: 27 });

    // Value should revert, and onTitleChange should not be called with 'Temporary Change'
    expect(inputElement.value).toBe(initialTitle);
    expect(handleTitleChange).not.toHaveBeenCalled();
  });

});
