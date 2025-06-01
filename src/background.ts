const displayUrl = chrome.runtime.getURL("tabs/display.html");

async function openDisplayPage() {
  try {
    const tabs = await chrome.tabs.query({ url: displayUrl });
    if (tabs.length > 0) {
      const tab = tabs[0];
      if (tab.id) {
        await chrome.tabs.update(tab.id, { active: true });
        if (tab.windowId) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
      }
    } else {
      await chrome.tabs.create({ url: displayUrl });
    }
  } catch (error) {
    console.error("Error opening display page:", error);
  }
}

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get({ displayOnStartup: false }, (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting displayOnStartup option:", chrome.runtime.lastError);
      return;
    }
    if (result.displayOnStartup) {
      openDisplayPage();
    }
  });
});
