import React from "react";
import "./style.css";
import Footer from "./components/Footer";

const displayUrl = chrome.runtime.getURL(`tabs/display.html`);
const extensionBaseUrl = chrome.runtime.getURL(``);
const emptyTabUrl = "chrome://";
const firefoxEmptyTabUrl = "about://"; // Firefox equivalent of chrome://

// Interface for tab information
interface TabInfo {
    url: string;
    title: string;
    favicon: string;
}

// Interface for tab group structure
interface TabGroup {
    timestamp: string;
    tabs: TabInfo[];
    title?: string; // Optional title field for the group
}

/**
 * Not 100% how an extension works, but this is my intuition. The javascript code is run within this page/tab. So while we're in this page
 * the flow of execution continues. As soon as we switch tab, the Process Counter is reset and we can't anything else.
 * So how do we collect the last page and switch to the display page? It's a chicken and egg problem
 * so instead, we store in localstorage the window id, switch to display page and then from there we can collect the
 * tabs from the pending window id.
 */
async function storeTabs() {
    // Get the includePinnedTabs setting
    const { includePinnedTabs } = await chrome.storage.local.get({ includePinnedTabs: true });
    const query_args = {currentWindow: true};
    const tabs = await chrome.tabs.query(query_args);

    // Store the current windowId in localStorage
    if (tabs.length > 0 && tabs[0].windowId) {
        await chrome.storage.local.set({
            pendingWindowId: tabs[0].windowId,
            includePinnedTabs: includePinnedTabs // Pass the setting to display.tsx
        });
        console.log("Stored windowId in localStorage:", tabs[0].windowId);
        await openDisplayPage();
    }
}

async function openDisplayPage() {
    try {
        // Check if a display page is already open
        const tabs = await chrome.tabs.query({url: displayUrl});

        if (tabs.length > 0) {
            console.log("Display page already open, changing focus")
            let tab = tabs[0];
            // If a display page is already open, switch focus to it
            await chrome.tabs.update(tab.id, {active: true});
            await chrome.windows.update(tab.windowId, {focused: true});
        } else {
            // If no display page is open, create a new one
            console.log("Display page not open, opening new tab")
            await chrome.tabs.create({url: displayUrl});
        }
    } catch (error) {
        console.error("Error in openDisplayPage:", error);
    }
}

function IndexPopup() {
    return (
        <div className="flex flex-col p-4 w-[200px]">
            <h2 className="text-xl font-bold mb-2">OpenSingleTab</h2>
            <div className="flex justify-between mb-3">
                <a 
                    href="https://github.com/FedericoPonzi/OpenSingleTab" 
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                >
                    View Docs
                </a>
                <a 
                    href="options.html" 
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                >
                    Options
                </a>
            </div>
            <button 
                onClick={storeTabs}
                className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-1 px-2 rounded mb-2"
            >
                Send to OpenSingleTab
            </button>
            <button 
                onClick={openDisplayPage}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-2 rounded"
            >
                Display OpenSingleTab
            </button>
            <Footer className="mt-4" />
        </div>
    )
}

export default IndexPopup