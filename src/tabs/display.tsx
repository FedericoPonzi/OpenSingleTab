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
                        <h3 style={{marginBottom: "8px"}}>
                            Group: {group.timestamp} ({group.tabs.length} tabs)
                        </h3>
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