import React from "react";
function storeTabs() {
    const query_args = {pinned: false, currentWindow: true};
    chrome.tabs.query(query_args, function (tabs) {
        const tabUrls = tabs.map((tab) => tab.url);
        chrome.storage.local.set({savedTabs: tabUrls}, function () {
            console.log("Tabs stored in local storage.");
        });
    });
    chrome.tabs.query(query_args, function (tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.remove(tab.id);
        });
    });
    openDisplayPage();
}

function openDisplayPage() {
    const linkUrl = `tabs/display.html`;
    chrome.tabs.create({url: linkUrl});
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
