import { useState, useEffect } from "react"
import "./style.css"

function OptionsIndex() {
    const [keepTabsOpen, setKeepTabsOpen] = useState(false);

    // Load saved option when component mounts
    useEffect(() => {
        chrome.storage.local.get({ keepTabsOpen: false }, (data) => {
            setKeepTabsOpen(data.keepTabsOpen);
        });
    }, []);

    // Save option when it changes
    const handleKeepTabsOpenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        setKeepTabsOpen(newValue);
        chrome.storage.local.set({ keepTabsOpen: newValue }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving option:", chrome.runtime.lastError);
            }
        });
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
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
            
            <a 
                href={`tabs/display.html`}
                className="text-blue-600 hover:text-blue-800 underline"
            >
                Display OpenSingleTab
            </a>
        </div>
    )
}

export default OptionsIndex;