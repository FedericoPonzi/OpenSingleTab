export const chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        // Simulate async retrieval
        setTimeout(() => {
          const result = { lastUrl: 'https://example.com/last', lastUrlTimestamp: Date.now() }; // Example data
          if (typeof keys === 'string') {
            callback({ [keys]: result[keys] });
          } else if (Array.isArray(keys)) {
            const subsetResult = {};
            keys.forEach(key => {
              if (result.hasOwnProperty(key)) {
                subsetResult[key] = result[key];
              }
            });
            callback(subsetResult);
          } else { // Object case
            const subsetResultWithDefaults = {};
            Object.keys(keys).forEach(key => {
                subsetResultWithDefaults[key] = result.hasOwnProperty(key) ? result[key] : keys[key];
            });
            callback(subsetResultWithDefaults);
          }
        }, 0);
      }),
      set: jest.fn((items, callback) => {
        // Simulate async storage
        setTimeout(() => {
          if (callback) {
            callback();
          }
        }, 0);
      }),
    },
  },
  tabs: {
    query: jest.fn((options, callback) => {
      setTimeout(() => {
        // Default mock tabs
        let tabs = [
          { id: 1, url: 'https://example.com', title: 'Example Tab', windowId: 1, active: true, highlighted: true, pinned: false, incognito: false, index: 0, favIconUrl: '' },
          { id: 2, url: 'https://google.com', title: 'Google', windowId: 1, active: false, highlighted: false, pinned: false, incognito: false, index: 1, favIconUrl: '' },
        ];
        if (options.url) {
          tabs = tabs.filter(tab => tab.url && tab.url.includes(options.url));
        }
        if (options.active !== undefined) {
          tabs = tabs.filter(tab => tab.active === options.active);
        }
        if (options.currentWindow !== undefined) {
          // Assuming all mock tabs are in the "current window" for simplicity
           tabs = tabs.filter(tab => tab.windowId === 1);
        }
        callback(tabs);
      }, 0);
    }),
    create: jest.fn((props, callback) => {
      setTimeout(() => {
        const newTab = {
          id: Math.floor(Math.random() * 100) + 3, // Ensure unique ID
          url: props.url,
          active: props.active !== undefined ? props.active : true,
          windowId: 1, // Assuming current window
          title: props.url, // Simple title from URL
          pinned: false,
          incognito: false,
          index: 99, // Assuming it's opened at the end
          favIconUrl: ''
        };
        if (callback) {
          callback(newTab);
        }
      }, 0);
    }),
    update: jest.fn((tabId, updateProperties, callback) => {
      setTimeout(() => {
        if (callback) {
          callback({ id: tabId, ...updateProperties, title: 'Updated Tab', windowId: 1, active: true, highlighted: true, pinned: false, incognito: false, index: 0, favIconUrl: ''});
        }
      }, 0);
    }),
  },
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      setTimeout(() => {
        if (callback) {
          callback({ response: "mock response from background" });
        }
      }, 0);
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
    getURL: jest.fn(path => `chrome-extension://mock-id/${path}`),
    lastError: undefined, // or null, or an object { message: "mock error" }
  },
  i18n: {
    getMessage: jest.fn(messageName => {
      const messages = {
        "appName": "OpenSingleTab",
        "popupSaveButtonText": "Save Current Tab",
        "popupLastSavedUrl": "Last saved URL:",
        "popupNoUrlSaved": "No URL saved yet.",
        "popupSaveSuccess": "Tab saved!",
        "popupSaveError": "Error saving tab.",
        "popupSwitchToTab": "Switch to Tab"
      };
      return messages[messageName] || `mock-${messageName}`;
    }),
  },
  action: {
    setBadgeText: jest.fn(details => {
      return Promise.resolve();
    }),
    setBadgeBackgroundColor: jest.fn(details => {
      return Promise.resolve();
    }),
  }
};

// For environments that might not pick up the jest.mock via jest.setup.js early enough
// or for direct import scenarios if __mocks__ isn't automatically picked.
if (typeof global !== 'undefined') {
  (global as any).chrome = chrome;
}
