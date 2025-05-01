import React from "react";
import "./style.css";

const displayUrl = chrome.runtime.getURL(`tabs/display.html`);
const extensionBaseUrl = chrome.runtime.getURL(``);
const emptyTabUrl = "chrome://";

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

async function storeTabs() {
    try {
        const query_args = {pinned: false, currentWindow: true};
        
        const tabs = await chrome.tabs.query(query_args);
        
        const tabInfos = tabs
            .filter(tab => !tab.url.startsWith(emptyTabUrl))
            .filter(tab => !tab.url.startsWith(extensionBaseUrl))
            .map((tab) => ({
                url: tab.url,
                title: tab.title || tab.url,
                favicon: tab.favIconUrl || ""
            }));

        if (tabInfos.length == 0) {
            await openDisplayPage();
            return;
        }
        
        // Create a new tab group with current timestamp
        const newTabGroup: TabGroup = {
            timestamp: new Date().toLocaleString(),
            tabs: tabInfos,
            title: "Group" // Default title for the group
        };
        
        // Get existing tab groups and add the new one
        const data = await chrome.storage.local.get({tabGroups: [], keepTabsOpen: false}) as {tabGroups: TabGroup[], keepTabsOpen: boolean};
        if (chrome.runtime.lastError) {
            console.error("Error retrieving data:", chrome.runtime.lastError);
        }

        const updatedTabGroups = [newTabGroup, ...data.tabGroups];
        
        // Save the updated tab groups
        await chrome.storage.local.set({tabGroups: updatedTabGroups});
        if (chrome.runtime.lastError) {
            console.error("Error saving tab groups:", chrome.runtime.lastError);
        }

        // Check if we should close tabs based on user preference
        if (!data.keepTabsOpen) {
            // remove active for last
            var activeTab = -1;
            for (const tab of tabs) {
                activeTab = tab.active ? tab.id : activeTab;
                const isExtTab = tab.url.startsWith(extensionBaseUrl);
                if (!tab.active && !isExtTab && !tab.url.startsWith(emptyTabUrl)) {
                    await chrome.tabs.remove(tab.id);
                }
            }
        }
        
        // Open display page after storing tabs
        await openDisplayPage();

        if(!data.keepTabsOpen) {
            await chrome.tabs.remove(activeTab);
        }
    } catch (error) {
        console.error("Error in storeTabs:", error);
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
        </div>
    )
}

export default IndexPopup