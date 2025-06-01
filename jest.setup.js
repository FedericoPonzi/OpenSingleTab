import '@testing-library/jest-dom';
const { chrome } = require('./__mocks__/chrome');

// Make the mock chrome object global
(global as any).chrome = chrome;
