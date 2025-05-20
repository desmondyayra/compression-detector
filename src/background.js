console.log('YouTube Compression Detector: Background script loaded');

// Map from tabId to videoInfo
const videoInfoByTab = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);

  if (message.action === 'videoUpdate') {
    console.log("Background received video update");
    const tabId = sender.tab?.id;
    
    if (tabId !== undefined) {
      videoInfoByTab.set(tabId, message.video);
      console.log(`Updated video info for tab ${tabId}:`, message.video);
    }
    
    sendResponse({ status: 'received' });
    return true;  // Keep the message channel open for async response
  }

  if (message.action === 'getLatestVideoInfo') {
    const tabId = message.tabId;
    console.log(`Background received request for tab ${tabId}`);
    
    const info = videoInfoByTab.get(tabId);
    console.log("Found info:", info);

    if (!info) {
      console.log("No info found for this tab");
      sendResponse({ status: 'not_found', reason: 'No update for this tab yet' });
    } else {
      console.log("Sending back info:", info);
      sendResponse({ status: 'success', video: info });
    }
    
    return true;  // Keep the message channel open for async response
  }

  return true;  // Always return true to indicate you might respond asynchronously
});

// Add this debug function to help identify if video info exists
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log(`Tab ${activeInfo.tabId} became active`);
  console.log(`Video info available for tabs: ${[...videoInfoByTab.keys()].join(', ')}`);
});