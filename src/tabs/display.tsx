import React, { useState, useEffect } from "react";

// Interface for tab group structure
interface TabGroup {
    timestamp: string;
    tabs: string[];
}

function OpenSingleTabDisplay() {
    const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);

    useEffect(() => {
        // Retrieve stored tab groups from local storage
        chrome.storage.local.get(["tabGroups", "savedTabs"], (data) => {
            setTabGroups(data.tabGroups);
        });
    }, []);

    const handleTabClick = async (groupIndex: number, urlToRemove: string) => {
        // Open the clicked tab URL in a new tab
        await chrome.tabs.create({ url: urlToRemove, active: false });

        // Remove the clicked tab URL from the specific group
        const updatedGroups = [...tabGroups];
        updatedGroups[groupIndex].tabs = updatedGroups[groupIndex].tabs.filter(
            (url) => url !== urlToRemove
        );
        
        // Remove empty groups
        const filteredGroups = updatedGroups.filter(group => group.tabs.length > 0);
        
        setTabGroups(filteredGroups);
        await chrome.storage.local.set({ tabGroups: filteredGroups });
    };
    
    const openAllInNewWindow = async (groupIndex: number) => {
        const urls = tabGroups[groupIndex].tabs;
        if (urls.length > 0) {
            // Create a new window with the first URL
            const newWindow = await chrome.windows.create({ url: urls[0] });
            
            // Open the rest of the URLs in the new window
            for (let i = 1; i < urls.length; i++) {
                await chrome.tabs.create({ 
                    url: urls[i], 
                    windowId: newWindow.id,
                    active: false 
                });
            }
        }
        await deleteGroup(groupIndex);
    };
    
    const openAllInThisWindow = async (groupIndex: number) => {
        const urls = tabGroups[groupIndex].tabs;
        for (const url of urls) {
            await chrome.tabs.create({ url, active: false });
        }
        await deleteGroup(groupIndex);
    };
    
    const deleteGroup = async (groupIndex: number) => {
        const updatedGroups = [...tabGroups];
        updatedGroups.splice(groupIndex, 1);
        setTabGroups(updatedGroups);
        await chrome.storage.local.set({ tabGroups: updatedGroups });
    };

    const totalTabs = tabGroups.reduce((sum, group) => sum + group.tabs.length, 0);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: 16,
            }}
        >
            <div style={{display: "flex", alignItems: "baseline"}}>
                <h2 style={{marginRight: "16px"}}>OpenSingleTab</h2>
                <h4>Total: {totalTabs} tabs in {tabGroups.length} groups</h4>
            </div>
            
            {tabGroups.length === 0 ? (
                <p>No saved tabs. Click "Send to OpenSingleTab" to save your open tabs.</p>
            ) : (
                tabGroups.map((group, groupIndex) => (
                    <div key={groupIndex} style={{marginBottom: "24px"}}>
                        <div style={{display: "flex", alignItems: "center", marginBottom: "8px"}}>
                            <h3 style={{marginRight: "16px", marginBottom: 0}}>
                                Group: {group.timestamp} ({group.tabs.length} tabs)
                            </h3>
                            <div style={{display: "flex", gap: "8px"}}>
                                <button 
                                    onClick={() => openAllInNewWindow(groupIndex)}
                                    style={{fontSize: "12px", padding: "4px 8px"}}
                                >
                                    Open all in new window
                                </button>
                                <button 
                                    onClick={() => openAllInThisWindow(groupIndex)}
                                    style={{fontSize: "12px", padding: "4px 8px"}}
                                >
                                    Open all in this window
                                </button>
                                <button 
                                    onClick={() => deleteGroup(groupIndex)}
                                    style={{fontSize: "12px", padding: "4px 8px"}}
                                >
                                    Delete group
                                </button>
                            </div>
                        </div>
                        <ul style={{margin: 0}}>
                            {group.tabs.map((url, tabIndex) => (
                                <li key={`${groupIndex}-${tabIndex}`}>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            await handleTabClick(groupIndex, url);
                                        }}
                                    >
                                        {url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
}

export default OpenSingleTabDisplay;