import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from './Footer'; // Adjust path as necessary
import { GIT_HASH_SHORT } from '../gitHash'; // Import the actual constant

// Mock parts of the chrome API that Footer might use
const mockGetMessage = jest.fn(messageName => {
    const messages = {
        "footerVersion": "Version:",
        "footerSourceCode": "Source Code",
        "footerOptions": "Options",
        // Add other messages if Footer uses them
    };
    return messages[messageName] || `mock-${messageName}`;
});

const mockGetURL = jest.fn(path => `chrome-extension://mock-id/${path}`);
const mockGetManifest = jest.fn(() => ({
  name: "Test Extension",
  version: "1.2.3",
}));

(global as any).chrome = {
  ...(global as any).chrome,
  i18n: {
    getMessage: mockGetMessage,
  },
  runtime: {
    ...(global as any).chrome?.runtime,
    getURL: mockGetURL,
    getManifest: mockGetManifest,
  },
};

// Mock the gitHash module if it's imported and used directly by Footer.
// If Footer receives gitHash via props or context, this might not be needed here.
// Assuming Footer imports and uses GIT_HASH_SHORT from '../gitHash'
jest.mock('../gitHash', () => ({
  GIT_HASH_SHORT: 'test789', // Provide a mock hash for testing
  GIT_HASH: 'testlonghashvalue',
}));


describe('Footer Component', () => {
  beforeEach(() => {
    mockGetMessage.mockClear();
    mockGetURL.mockClear();
    mockGetManifest.mockClear();
  });

  test('renders correctly with version, git hash, and links', () => {
    render(<Footer />);

    // Check for version (mocked manifest version)
    expect(screen.getByText(/Version: 1\.2\.3/)).toBeInTheDocument();

    // Check for git hash (mocked from gitHash.ts)
    // The text could be "Version: 1.2.3 (test789)" or similar
    expect(screen.getByText(`(test789)`)).toBeInTheDocument(); // Assuming it's displayed like this

    // Check for "Source Code" link
    const sourceCodeLink = screen.getByText('Source Code');
    expect(sourceCodeLink).toBeInTheDocument();
    expect(sourceCodeLink.closest('a')).toHaveAttribute('href', 'https://github.com/fponzi/open-single-tab');

    // Check for "Options" link
    const optionsLink = screen.getByText('Options');
    expect(optionsLink).toBeInTheDocument();
    expect(optionsLink.closest('a')).toHaveAttribute('href', 'chrome-extension://mock-id/options.html');
    expect(mockGetURL).toHaveBeenCalledWith('options.html');
  });

  test('uses i18n for link texts', () => {
    render(<Footer />);
    expect(mockGetMessage).toHaveBeenCalledWith("footerVersion");
    expect(mockGetMessage).toHaveBeenCalledWith("footerSourceCode");
    expect(mockGetMessage).toHaveBeenCalledWith("footerOptions");
  });
});
