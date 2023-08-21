import React, { useState, useEffect } from "react";

function OpenSingleTabDisplay() {
    const [storedTabs, setStoredTabs] = useState([]);

    useEffect(() => {
        // Retrieve stored tabs from local storage
        chrome.storage.local.get("savedTabs", (data) => {
            if (data.savedTabs) {
                setStoredTabs(data.savedTabs);
            }
        });
    }, []);

    const handleTabClick = (urlToRemove: string) => {
        // Open the clicked tab URL in a new tab
        chrome.tabs.create({ url: urlToRemove, active: false });

        // Remove the clicked tab URL from storedTabs and update local storage
        const updatedTabs = storedTabs.filter((url) => url !== urlToRemove);
        setStoredTabs(updatedTabs);
        chrome.storage.local.set({ savedTabs: updatedTabs });
    };

    const openedTabs = storedTabs.length;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: 16,
            }}
        >
            <div style={{display: "inline"}}><h2>OpenSingleTab</h2><h4>Total: {openedTabs} tabs</h4></div>
            <h3>Stored Tabs:</h3>
            <ul>
                {storedTabs.map((url, index) => (
                    <li key={index}>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                e.preventDefault();
                                handleTabClick(url);
                            }}
                        >
                            {url}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default OpenSingleTabDisplay;
