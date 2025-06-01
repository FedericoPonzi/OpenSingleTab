import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StatusMessage from './StatusMessage'; // Adjust path as necessary

// No specific i18n needed for StatusMessage itself, as message is passed as a prop.
// No chrome API needed directly by StatusMessage.

describe('StatusMessage Component', () => {
  beforeEach(() => {
    jest.useRealTimers(); // Ensure real timers are used unless specified
  });

  test('renders message and applies correct class for type "success"', () => {
    render(<StatusMessage message="Action was successful!" type="success" />);

    const messageElement = screen.getByText('Action was successful!');
    expect(messageElement).toBeInTheDocument();
    // Assuming the component uses a class like 'StatusMessage--success' or similar
    // The actual class name depends on the component's implementation.
    // Let's assume it adds a class that includes the type.
    expect(messageElement).toHaveClass(`StatusMessage--success`);
  });

  test('renders message and applies correct class for type "error"', () => {
    render(<StatusMessage message="An error occurred." type="error" />);

    const messageElement = screen.getByText('An error occurred.');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveClass(`StatusMessage--error`);
  });

  test('renders message and applies default class if type is not specified or unknown', () => {
    render(<StatusMessage message="Just a message." />); // No type
    const messageElement = screen.getByText('Just a message.');
    expect(messageElement).toBeInTheDocument();
    // Assuming a default class or no specific type class if type is omitted/invalid
    expect(messageElement).not.toHaveClass(`StatusMessage--success`);
    expect(messageElement).not.toHaveClass(`StatusMessage--error`);
    // It might have a base class, e.g., 'StatusMessage'
    expect(messageElement).toHaveClass('StatusMessage');
  });

  test('is not visible if message is null or empty', () => {
    const { rerender } = render(<StatusMessage message={null} type="success" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument(); // Assuming it has role="status"

    rerender(<StatusMessage message="" type="success" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('auto-hides if duration prop is provided and onDismiss is called', async () => {
    jest.useFakeTimers();
    const mockOnDismiss = jest.fn();
    const duration = 2000;

    render(
      <StatusMessage
        message="This will disappear."
        type="info"
        duration={duration}
        onDismiss={mockOnDismiss}
      />
    );

    const messageElement = screen.getByText('This will disappear.');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toBeVisible();

    // Fast-forward time
    jest.advanceTimersByTime(duration);

    // The component might unmount itself or call onDismiss which would lead to unmounting
    // If it unmounts itself, queryByText should return null.
    // If it calls onDismiss, that function is responsible for hiding/unmounting.
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    // To test if it's hidden, we'd typically check that it's not in the document,
    // but this depends on how onDismiss is implemented by the parent.
    // For this component, we only test that onDismiss is called.
    // If the component had its own internal state for visibility after duration, we'd test that.
    // Let's assume the component itself becomes hidden or calls onDismiss.
    // If the component itself handles the hiding through its own state:
    // await waitFor(() => {
    //   expect(screen.queryByText('This will disappear.')).not.toBeVisible();
    // });

    jest.useRealTimers();
  });

  test('does not auto-hide if duration is not provided or is 0', () => {
    jest.useFakeTimers();
    const mockOnDismiss = jest.fn();

    render(
      <StatusMessage
        message="This stays."
        type="warning"
        onDismiss={mockOnDismiss}
        duration={0} // or undefined
      />
    );

    const messageElement = screen.getByText('This stays.');
    expect(messageElement).toBeInTheDocument();

    jest.advanceTimersByTime(5000); // Advance well past any typical auto-hide duration

    expect(mockOnDismiss).not.toHaveBeenCalled();
    expect(screen.getByText('This stays.')).toBeVisible();

    jest.useRealTimers();
  });

});
