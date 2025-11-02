console.log('YouTube Propaganda Analyzer — background service worker running');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated', details);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'PAGE_LOADED') {
    console.log('Page loaded message from content script:', msg.title, sender.tab && sender.tab.url);
  }
});
