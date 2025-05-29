import { useState, useEffect } from "react"
import "./style.css"
import Footer from "./components/Footer"

function OptionsIndex() {
    const [keepTabsOpen, setKeepTabsOpen] = useState(false);
    const [allowDuplicates, setAllowDuplicates] = useState(true);
    const [includePinnedTabs, setIncludePinnedTabs] = useState(true);
    const [windowRestoreMode, setWindowRestoreMode] = useState<'smart' | 'new' | 'current'>('current');

    // Load saved options when component mounts
    useEffect(() => {
        chrome.storage.local.get({ 
            keepTabsOpen: false,
            allowDuplicates: true,
            includePinnedTabs: true,
            windowRestoreMode: 'current'
        }, (data) => {
            setKeepTabsOpen(data.keepTabsOpen);
            setAllowDuplicates(data.allowDuplicates);
            setIncludePinnedTabs(data.includePinnedTabs);
            setWindowRestoreMode(data.windowRestoreMode);
        });
    }, []);

    // Save options when they change
    const handleKeepTabsOpenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        setKeepTabsOpen(newValue);
        chrome.storage.local.set({ keepTabsOpen: newValue }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving option:", chrome.runtime.lastError);
            }
        });
    };

    const handleAllowDuplicatesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        setAllowDuplicates(newValue);
        chrome.storage.local.set({ allowDuplicates: newValue }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving option:", chrome.runtime.lastError);
            }
        });
    };

    const handleIncludePinnedTabsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        setIncludePinnedTabs(newValue);
        chrome.storage.local.set({ includePinnedTabs: newValue }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving option:", chrome.runtime.lastError);
            }
        });
    };

    const handleWindowRestoreModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value as 'smart' | 'new' | 'current';
        setWindowRestoreMode(newValue);
        chrome.storage.local.set({ windowRestoreMode: newValue }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving option:", chrome.runtime.lastError);
            }
        });
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <a
                href={`tabs/display.html`}
                className="text-blue-600 hover:text-blue-800 underline block mb-4"
            >
                Display OpenSingleTab
            </a>
            <h1 className="text-2xl font-bold mb-4">
                OpenSingleTab Options
            </h1>
            <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={keepTabsOpen} 
                        onChange={handleKeepTabsOpenChange}
                        className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700">Keep tabs open when sending to OpenSingleTab</span>
                </label>
                <p className="text-sm text-gray-500 mt-1 ml-7">
                    When enabled, tabs will remain open after sending them to OpenSingleTab.
                </p>
            </div>

            <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={allowDuplicates} 
                        onChange={handleAllowDuplicatesChange}
                        className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700">Allow duplicate URLs</span>
                </label>
                <p className="text-sm text-gray-500 mt-1 ml-7">
                    When enabled, duplicate URLs will be allowed in tab groups. When disabled, duplicate URLs will be silently rejected.
                </p>
            </div>

            <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={includePinnedTabs} 
                        onChange={handleIncludePinnedTabsChange}
                        className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700">Pinned tabs:</span>
                </label>
                <p className="text-sm text-gray-500 mt-1 ml-7">
                    When enabled, pinned tabs will be sent to OpenSingleTab. When disabled, pinned tabs will be kept in their original window.
                </p>
            </div>

            <div className="mb-4">
                <h3 className="text-gray-700 font-medium mb-2">When a tab group is restored, send the tabs to:</h3>
                <div className="space-y-2 ml-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="windowRestoreMode"
                            value="smart"
                            checked={windowRestoreMode === 'smart'}
                            onChange={handleWindowRestoreModeChange}
                            className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="text-gray-700">A new window, unless OpenSingleTab is the only tab in the current window</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="windowRestoreMode"
                            value="new"
                            checked={windowRestoreMode === 'new'}
                            onChange={handleWindowRestoreModeChange}
                            className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="text-gray-700">Always a new window</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="windowRestoreMode"
                            value="current"
                            checked={windowRestoreMode === 'current'}
                            onChange={handleWindowRestoreModeChange}
                            className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="text-gray-700">Always the current window</span>
                    </label>
                </div>
            </div>
            
            <Footer className="mt-8" />
        </div>
    )
}

export default OptionsIndex;