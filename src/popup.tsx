import React from "react";

const linkUrl = `tabs/display.html`;
const emptyTabUrl = "chrome://newtab";

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
}

async function storeTabs() {
    const query_args = {pinned: false, currentWindow: true};
    chrome.tabs.query(query_args, function (tabs) {
        const tabInfos = tabs
            .filter(tab => !tab.url.startsWith(emptyTabUrl))
            .filter(tab => tab.url !== chrome.runtime.getURL(linkUrl))
            .map((tab) => ({
                url: tab.url,
                title: tab.title || tab.url,
                favicon: tab.favIconUrl || ""
            }));
        
        // Create a new tab group with current timestamp
        const newTabGroup: TabGroup = {
            timestamp: new Date().toLocaleString(),
            tabs: tabInfos
        };
        
        // Get existing tab groups and add the new one
        chrome.storage.local.get({tabGroups: []}, function (data) {
            const updatedTabGroups = [newTabGroup, ...data.tabGroups];
            chrome.storage.local.set({tabGroups: updatedTabGroups}, function () {
                console.log("New tab group stored in local storage.");
            });
        });
    });
    
    chrome.tabs.query(query_args, function (tabs) {
        tabs.forEach((tab) => {
            if (tab.url !== chrome.runtime.getURL(linkUrl) && !tab.url.startsWith(emptyTabUrl)) {
                chrome.tabs.remove(tab.id);
            }
        });
    });
    await openDisplayPage();
}

async function openDisplayPage() {
    // Check if a display page is already open
    chrome.tabs.query({url: chrome.runtime.getURL(linkUrl)}, async function (tabs) {
        if (tabs.length > 0) {
            let tab = tabs[0];
            // If a display page is already open, switch focus to it
            await chrome.tabs.reload(tab.id);
            await chrome.tabs.update(tab.id, {active: true});
            await chrome.windows.update(tab.windowId, {focused: true});
        } else {
            // If no display page is open, create a new one
            await chrome.tabs.create({url: linkUrl});
        }
    });
}

function IndexPopup() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: 16,
                width: "200px",
            }}>
            <h2>OpenSingleTab</h2>
            <a href="https://github.com/FedericoPonzi/OpenSingleTab" target="_blank">View Docs</a>
            <button onClick={storeTabs}>Send to OpenSingleTab</button>
            <button onClick={openDisplayPage}>Display OpenSingleTab</button>
        </div>
    )
}

export default IndexPopup