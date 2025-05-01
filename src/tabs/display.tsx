import React, {useState, useEffect} from "react";
import "../style.css";

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

function OpenSingleTabDisplay() {
    const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);

    useEffect(() => {
        // Retrieve stored tab groups from local storage
        chrome.storage.local.get(["tabGroups", "savedTabs"], (data) => {
            setTabGroups(data.tabGroups);
        });
    }, []);

    const handleTabClick = async (groupIndex: number, tabInfo: TabInfo) => {
        // Open the clicked tab URL in a new tab
        await chrome.tabs.create({url: tabInfo.url, active: false});

        // Remove the clicked tab URL from the specific group
        const updatedGroups = [...tabGroups];
        updatedGroups[groupIndex].tabs = updatedGroups[groupIndex].tabs.filter(
            (tab) => tab.url !== tabInfo.url
        );

        // Remove empty groups
        const filteredGroups = updatedGroups.filter(group => group.tabs.length > 0);

        setTabGroups(filteredGroups);
        await chrome.storage.local.set({tabGroups: filteredGroups});
    };

    const openAllInNewWindow = async (groupIndex: number) => {
        const tabs = tabGroups[groupIndex].tabs;
        await deleteGroup(groupIndex);
        if (tabs.length > 0) {
            return;
        }

        // Create a new window with the first URL
        const newWindow = await chrome.windows.create({url: tabs[0].url});

        // Open the rest of the URLs in the new window
        for (let i = 1; i < tabs.length; i++) {
            await chrome.tabs.create({
                url: tabs[i].url,
                windowId: newWindow.id,
                active: false
            });
        }
    };

    const openAllInThisWindow = async (groupIndex: number) => {
        const tabs = tabGroups[groupIndex].tabs;
        for (const tab of tabs) {
            await chrome.tabs.create({url: tab.url, active: false});
        }
        await deleteGroup(groupIndex);
    };

    const deleteGroup = async (groupIndex: number) => {
        const updatedGroups = [...tabGroups];
        updatedGroups.splice(groupIndex, 1);
        setTabGroups(updatedGroups);
        await chrome.storage.local.set({tabGroups: updatedGroups});
    };

    const totalTabs = tabGroups.reduce((sum, group) => sum + group.tabs.length, 0);

    return (
        <div className="flex flex-col p-4">
            <div className="flex items-baseline mb-4">
                <h2 className="text-2xl font-bold mr-4">OpenSingleTab</h2>
                <h4 className="text-gray-600">Total: {totalTabs} tabs in {tabGroups.length} groups</h4>
            </div>

            {tabGroups.length === 0 ? (
                <p className="text-gray-700">No saved tabs. Click "Send to OpenSingleTab" to save your open tabs.</p>
            ) : (
                tabGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="mb-6 border-b pb-4 last:border-b-0">
                        <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold mr-4 mb-0">
                                Group: {group.timestamp} ({group.tabs.length} tabs)
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openAllInThisWindow(groupIndex)}
                                    className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                                >
                                    Open all
                                </button>
                                <button
                                    onClick={() => openAllInNewWindow(groupIndex)}
                                    className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
                                >
                                    Open all in new window
                                </button>
                                <button
                                    onClick={() => deleteGroup(groupIndex)}
                                    className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                                >
                                    Delete group
                                </button>
                            </div>
                        </div>
                        <ul className="m-0 list-none">
                            {group.tabs.map((tabInfo, tabIndex) => (
                                <li key={`${groupIndex}-${tabIndex}`} className="flex items-center mb-2">
                                    {tabInfo.favicon && (
                                        <img 
                                            src={tabInfo.favicon} 
                                            alt="" 
                                            className="w-4 h-4 mr-2 object-contain" 
                                        />
                                    )}
                                    <a
                                        href={tabInfo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            await handleTabClick(groupIndex, tabInfo);
                                        }}
                                        title={tabInfo.url}
                                        className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-full"
                                    >
                                        {tabInfo.title || tabInfo.url}
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