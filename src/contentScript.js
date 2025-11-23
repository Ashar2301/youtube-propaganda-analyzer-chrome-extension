
(function () {
  console.log('YouTube Propaganda Analyzer — content script loaded');

  try {
    chrome.runtime.sendMessage({ type: 'PAGE_LOADED', title: document.title });
  } catch (e) {
    console.warn('Runtime not available:', e);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'ANALYZE') {
      const videoUrl = window.location.href;
      // Start analysis in background and return immediately
      chrome.runtime.sendMessage({
        type: 'START_ANALYSIS',
        url: videoUrl,
        tabId: msg.tabId,
        skip_cache: msg.skip_cache || false
      });
      sendResponse({ status: 'started' });
    }
    return false;
  });
})();
