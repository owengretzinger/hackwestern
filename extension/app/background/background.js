chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "changeIcon") {
      chrome.browserAction.setIcon({
        path: message.iconPath,
        tabId: sender.tab.id
      });
    }
  });
  