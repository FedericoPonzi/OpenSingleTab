import React, {useState, useEffect} from "react";
import "../style.css";
import Footer from "../components/Footer";
import type {
    TabGroupStructure,
    TabInfo,
    DragState,
    DropTargetState,
} from "../types/tabs";
import TabGroup from "../components/TabGroup";
import StatusMessage from "../components/StatusMessage";
import MenuDropdown from "../components/MenuDropdown";

function OpenSingleTabDisplay() {
    const [tabGroups, setTabGroups] = useState<TabGroupStructure[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [draggedItem, setDraggedItem] = useState<DragState | null>(null);
    const [dropTarget, setDropTarget] = useState<DropTargetState | null>(null);

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
                const newTabGroup: TabGroupStructure = {
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

    const handleTabClick = async (groupIndex: number, tabInfo: TabInfo, tabIndex: number) => {
        // Open the clicked tab URL in a new tab
        await chrome.tabs.create({url: tabInfo.url, active: false});

        // Remove only the specific tab that was clicked
        const updatedGroups = [...tabGroups];
        updatedGroups[groupIndex].tabs.splice(tabIndex, 1);

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

    const handleDragStart = (groupIndex: number, tabIndex: number, tab: TabInfo) => {
        setDraggedItem({ groupIndex, tabIndex, tab });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDropTarget(null);
    };

    const handleDragOver = (e: React.DragEvent, groupIndex: number, position: 'top' | 'bottom' | 'between' | 'into') => {
        e.preventDefault();
        if (!draggedItem) return;
        
        // Don't allow dropping into the same group
        if (position === 'into' && draggedItem.groupIndex === groupIndex) {
            setDropTarget(null);
            return;
        }
        
        setDropTarget({ groupIndex, position });
    };

    const moveTab = async (sourceGroupIndex: number, sourceTabIndex: number, targetGroupIndex: number, position: 'top' | 'bottom' | 'between' | 'into') => {
        const updatedGroups = [...tabGroups];
        const [movedTab] = updatedGroups[sourceGroupIndex].tabs.splice(sourceTabIndex, 1);

        // If the source group is empty after removing the tab, remove it
        if (updatedGroups[sourceGroupIndex].tabs.length === 0) {
            updatedGroups.splice(sourceGroupIndex, 1);
            // Adjust target index if it's after the removed group
            if (targetGroupIndex > sourceGroupIndex) {
                targetGroupIndex--;
            }
        }

        // Handle different drop positions
        switch (position) {
            case 'top':
                updatedGroups.unshift({ timestamp: new Date().toLocaleString(), tabs: [movedTab], title: "New Group" });
                break;
            case 'bottom':
                updatedGroups.push({ timestamp: new Date().toLocaleString(), tabs: [movedTab], title: "New Group" });
                break;
            case 'between':
                // Insert new group between existing groups
                updatedGroups.splice(targetGroupIndex + 1, 0, { 
                    timestamp: new Date().toLocaleString(), 
                    tabs: [movedTab], 
                    title: "New Group" 
                });
                break;
            case 'into':
                // Add to existing group
                updatedGroups[targetGroupIndex].tabs.push(movedTab);
                break;
        }

        setTabGroups(updatedGroups);
        await chrome.storage.local.set({ tabGroups: updatedGroups });
    };

    const handleDrop = async (e: React.DragEvent, targetGroupIndex: number, position: 'top' | 'bottom' | 'between' | 'into') => {
        e.preventDefault();
        if (!draggedItem) return;

        await moveTab(draggedItem.groupIndex, draggedItem.tabIndex, targetGroupIndex, position);
        setDraggedItem(null);
        setDropTarget(null);
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
                <MenuDropdown isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
            </div>
            
            <StatusMessage message={statusMessage} />

            {/* Drop zone for top of all groups */}
            <div
                className={`transition-all h-4 -mt-2 mb-2 ${
                    draggedItem ? 'border-t-2 border-dashed' : ''
                } ${
                    dropTarget?.position === 'top' ? 'border-blue-500' : 'border-transparent'
                }`}
                onDragOver={(e) => handleDragOver(e, 0, 'top')}
                onDrop={(e) => handleDrop(e, 0, 'top')}
            />

            {/* Drop zone for top of all groups */}
            <div
                className={`transition-all h-4 -mt-2 mb-2 ${
                    draggedItem ? 'border-t-2 border-dashed' : ''
                } ${
                    dropTarget?.position === 'top' ? 'border-blue-500' : 'border-transparent'
                }`}
                onDragOver={(e) => handleDragOver(e, 0, 'top')}
                onDrop={(e) => handleDrop(e, 0, 'top')}
            />

            {tabGroups.length === 0 ? (
                <p className="text-gray-700">No saved tabs. Click "Send to OpenSingleTab" to save your open tabs.</p>
            ) : (
                <>
                    {tabGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <TabGroup
                                group={group}
                                groupIndex={groupIndex}
                                onUpdateTitle={updateGroupTitle}
                                onOpenAllInThisWindow={openAllInThisWindow}
                                onOpenAllInNewWindow={openAllInNewWindow}
                                onDeleteGroup={deleteGroup}
                                onTabClick={handleTabClick}
                                draggedItem={draggedItem}
                                dropTarget={dropTarget}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            />
                            
                            {/* Drop zone between groups */}
                            {groupIndex < tabGroups.length - 1 && (
                                <div
                                    className={`transition-all h-4 -mt-2 mb-2 ${
                                        draggedItem ? 'border-t-2 border-dashed' : ''
                                    } ${
                                        dropTarget?.groupIndex === groupIndex && 
                                        dropTarget?.position === 'between' ? 
                                        'border-blue-500' : 'border-transparent'
                                    }`}
                                    onDragOver={(e) => handleDragOver(e, groupIndex, 'between')}
                                    onDrop={(e) => handleDrop(e, groupIndex, 'between')}
                                />
                            )}
                        </div>
                    ))}

                    {/* Drop zone for bottom of all groups */}
                    <div
                        className={`transition-all h-4 -mt-2 ${
                            draggedItem ? 'border-t-2 border-dashed' : ''
                        } ${
                            dropTarget?.position === 'bottom' ? 'border-blue-500' : 'border-transparent'
                        }`}
                        onDragOver={(e) => handleDragOver(e, tabGroups.length - 1, 'bottom')}
                        onDrop={(e) => handleDrop(e, tabGroups.length - 1, 'bottom')}
                    />
                </>
            )}
            
            <Footer className="mt-8 border-t pt-4" />
        </div>
    );
}

export default OpenSingleTabDisplay;