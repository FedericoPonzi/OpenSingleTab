function storeTabs() {
    chrome.tabs.query({pinned: false}, function (tabs) {
        const tabUrls = tabs.map((tab) => tab.url);
        chrome.storage.local.set({savedTabs: tabUrls}, function () {
            console.log("Tabs stored in local storage.");
        });
    });
    chrome.tabs.query({pinned: false}, function (tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.remove(tab.id);
        });
    });

    // After closing tabs, open the display page link
    const linkUrl = `chrome-extension://${(chrome.runtime.id)}/tabs/display.html`;
    chrome.tabs.create({url: linkUrl});
}
function openDisplayPage() {
    const linkUrl = `chrome-extension://${(chrome.runtime.id)}/tabs/display.html`;
    chrome.tabs.create({url: linkUrl});
}

function IndexPopup() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                padding: 16
            }}>
            <h2>OpenOneTab</h2>
            <a href="https://github.com/FedericoPonzi/OpenOneTab" target="_blank">View Docs</a>
            <button onClick={storeTabs}>Send to OpenOneTab</button>
            <button onClick={openDisplayPage}>Display OpenOneTab</button>

        </div>
    )
}

export default IndexPopup
