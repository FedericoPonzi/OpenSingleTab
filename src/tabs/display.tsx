import React, {useState, useEffect, useRef} from "react";
import "../style.css";
import Footer from "../components/Footer";

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

// EditableGroupTitle component for handling editable titles
interface EditableGroupTitleProps {
    title: string;
    onSave: (newTitle: string) => void;
}

function EditableGroupTitle({ title, onSave }: EditableGroupTitleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);
    const MAX_TITLE_LENGTH = 50; // Maximum title length

    useEffect(() => {
        // Focus the input when entering edit mode
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Update local state if prop changes
    useEffect(() => {
        setEditedTitle(title);
    }, [title]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        const trimmedTitle = editedTitle.trim();
        if (trimmedTitle !== "" && trimmedTitle !== title) {
            onSave(trimmedTitle.substring(0, MAX_TITLE_LENGTH));
        } else {
            // Reset to original title if empty or unchanged
            setEditedTitle(title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setEditedTitle(title);
            setIsEditing(false);
        }
    };

    return (
        <div className="flex items-center">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="text-lg font-semibold mr-2 border-b-2 border-blue-500 focus:outline-none"
                    maxLength={MAX_TITLE_LENGTH}
                    aria-label="Edit group title"
                    autoFocus
                />
            ) : (
                <div 
                    onClick={handleEditClick} 
                    className="flex items-center cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label="Edit group title"
                    title="Click to edit group title"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            handleEditClick();
                        }
                    }}
                >
                    <span className="text-lg font-semibold mr-1 group-hover:border-b-2 group-hover:border-gray-400">
                        {title}
                    </span>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                        />
                    </svg>
                </div>
            )}
        </div>
    );
}

function OpenSingleTabDisplay() {
    const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.menu-container')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        // Retrieve stored tab groups from local storage
        chrome.storage.local.get(["tabGroups", "savedTabs"], (data) => {
            setTabGroups(data.tabGroups);
        });

        // Add storage change listener
        const handleStorageChange = (changes: any, namespace: string) => {
            if (namespace === 'local' && changes.tabGroups) {
                // Update React state with the new value
                setTabGroups(changes.tabGroups.newValue || []);
            }
        };

        // Add the listener
        chrome.storage.onChanged.addListener(handleStorageChange);

        // Cleanup: remove listener when component unmounts
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);

    // Effect to check for pendingWindowId and collect tabs from that window
    useEffect(() => {
        console.log("Setting up listener for pending windowId")
        const collectTabsFromPendingWindow = async () => {             // Check if there's a pendingWindowId in localStorage
                const data = await chrome.storage.local.get({pendingWindowId: null});
                const pendingWindowId = data.pendingWindowId;

                if (!pendingWindowId) {
                    console.log("No pending windowId found");
                    return;
                }

                console.log("Found pending windowId:", pendingWindowId);

                const currentWindowId = (await chrome.tabs.query({pinned: false, currentWindow: true}))[0].windowId;

                // Clear the pendingWindowId immediately to prevent duplicate processing
                await chrome.storage.local.remove("pendingWindowId");

                const allTabs = await chrome.tabs.query({windowId: pendingWindowId});
                const tabs = allTabs.filter(tab => tab.windowId === pendingWindowId);

                const extensionBaseUrl = chrome.runtime.getURL(``);
                const emptyTabUrl = "chrome://";
                const firefoxEmptyTabUrl = "about:"; // Firefox equivalent of chrome://

                let tabInfos = tabs
                    .filter(tab => !tab.url.startsWith(emptyTabUrl) && !tab.url.startsWith(firefoxEmptyTabUrl))
                    .filter(tab => !tab.url.startsWith(extensionBaseUrl))
                    .map((tab) => ({
                        url: tab.url,
                        title: tab.title || tab.url,
                        favicon: tab.favIconUrl || ""
                    }));

                if (tabInfos.length === 0) {
                    console.log("No valid tabs found in the specified window");
                    return;
                }

                // Create a new tab group with current timestamp
                const newTabGroup: TabGroup = {
                    timestamp: new Date().toLocaleString(),
                    tabs: tabInfos,
                    title: "Group" // Default title for the group
                };

                // Get existing tab groups and add the new one
                const storageData = await chrome.storage.local.get({tabGroups: []});
                const updatedTabGroups = [newTabGroup, ...(storageData.tabGroups || [])];

                // Save the updated tab groups
                await chrome.storage.local.set({tabGroups: updatedTabGroups});

                // Finally do a cleanup. If the window is different, we simply close it
                if(pendingWindowId != currentWindowId){
                    await chrome.windows.remove(pendingWindowId);
                    return;
                }
                // Otherwise we need to iterate through all the tabs
                for (const tab of tabs) {
                    const isExtTab = tab.url.startsWith(extensionBaseUrl);
                    if (!isExtTab && !tab.url.startsWith(emptyTabUrl) && !tab.url.startsWith(firefoxEmptyTabUrl)) {
                        await chrome.tabs.remove(tab.id);
                    }
                }
        };
        // if the user called send to opensingletab
        // but the display page was not open
        // we missed the onchange call. But the window id is there, so we can act on it
        collectTabsFromPendingWindow();

        // Add the listener
        chrome.storage.onChanged.addListener(collectTabsFromPendingWindow);

        // Cleanup: remove listener when component unmounts
        return () => {
            chrome.storage.onChanged.removeListener(collectTabsFromPendingWindow);
        };
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
    const openGroupInWindow = async (groupIndex: number, windowId: number, startIndex: number = 0) => {
        const tabs = tabGroups[groupIndex].tabs;
        await deleteGroup(groupIndex);
        if (tabs.length == 0) {
            return;
        }
     for (let i = startIndex; i < tabs.length; i++) {
            let tab = tabs[i];
            console.log("Opening tab: ", tab.url);
            var t = windowId == undefined ? {url: tab.url, active: false} : {
                url: tab.url,
                active: false,
                windowId: windowId
            };
            console.log(JSON.stringify(t));
            await chrome.tabs.create(t);
        }
        console.log("Done opening group: ", groupIndex);
    }
    const openAllInNewWindow = async (groupIndex: number) => {
        const tabs = tabGroups[groupIndex].tabs;
        // Create a new window with the first URL
        const newWindow = await chrome.windows.create({url: tabs[0].url});
        // Open the rest of the URLs in the new window
        await openGroupInWindow(groupIndex, newWindow.id, 1);
    };

    const openAllInThisWindow = async (groupIndex: number) => {
        console.log("Opening All in this window, group: ", groupIndex);
        await openGroupInWindow(groupIndex, undefined);
    };

    const deleteGroup = async (groupIndex: number) => {
        const updatedGroups = [...tabGroups];
        updatedGroups.splice(groupIndex, 1);
        setTabGroups(updatedGroups);
        await chrome.storage.local.set({tabGroups: updatedGroups});
    };

    const updateGroupTitle = async (groupIndex: number, newTitle: string) => {
        try {
            const updatedGroups = [...tabGroups];
            updatedGroups[groupIndex] = {
                ...updatedGroups[groupIndex],
                title: newTitle
            };
            setTabGroups(updatedGroups);
            await chrome.storage.local.set({tabGroups: updatedGroups});
            console.log(`Group title updated successfully to: ${newTitle}`);
        } catch (error) {
            console.error("Error updating group title:", error);
            // Revert to original state if there's an error
            const data = await chrome.storage.local.get({tabGroups: []});
            setTabGroups(data.tabGroups || []);
        }
    };

    const totalTabs = tabGroups.reduce((sum, group) => sum + group.tabs.length, 0);
    console.log("Loaded");
    return (
        <div className="flex flex-col p-4">
            <div className="flex items-baseline justify-between mb-4">
                <div className="flex items-baseline">
                    <h2 className="text-2xl font-bold mr-4">OpenSingleTab</h2>
                    <h4 className="text-gray-600">Total: {totalTabs} tabs in {tabGroups.length} groups</h4>
                </div>
                <div className="relative menu-container">
                    <button 
                        className="text-gray-700 hover:text-blue-600 focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                                <a 
                                    href="import-export.html" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Import / Export tabs
                                </a>
                                <a 
                                    href="../options.html" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Options
                                </a>
                                <a 
                                    href="https://github.com/FedericoPonzi/OpenSingleTab" 
                                    target="_blank"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Info/Feedback
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {tabGroups.length === 0 ? (
                <p className="text-gray-700">No saved tabs. Click "Send to OpenSingleTab" to save your open tabs.</p>
            ) : (
                tabGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="mb-6 border-b pb-4 last:border-b-0">
                        <div className="flex items-center mb-2">
                            <div className="flex items-center mr-4">
                                <EditableGroupTitle 
                                    title={group.title || "Group"} 
                                    onSave={(newTitle) => updateGroupTitle(groupIndex, newTitle)} 
                                />
                                <span className="text-gray-600 ml-2">
                                    {group.timestamp} ({group.tabs.length} tabs)
                                </span>
                            </div>
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
            
            <Footer className="mt-8 border-t pt-4" />
        </div>
    );
}

export default OpenSingleTabDisplay;