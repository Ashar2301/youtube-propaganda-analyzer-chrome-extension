console.log('YouTube Propaganda Analyzer — background service worker running');

const analysisState = new Map();

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated', details);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Background received message:', msg);

  if (msg.type === 'START_ANALYSIS') {
    const videoUrl = msg.url;
    const tabId = msg.tabId;
    const skip_cache = msg.skip_cache || false;

    analysisState.set(tabId, { status: 'loading' });



    analyzeVideo(videoUrl, skip_cache)
      .then(result => {

        analysisState.set(tabId, {
          status: 'complete',
          result,
          timestamp: Date.now()
        });

        chrome.storage.local.set({ [`analysis_${videoUrl}`]: result });
        sendResponse({ status: 'complete', result });
      })
      .catch(error => {

        analysisState.set(tabId, {
          status: 'error',
          error: error.message,
          timestamp: Date.now()
        });
        sendResponse({ status: 'error', error: error.message });
      });
    return true;
  }

  if (msg.type === 'GET_ANALYSIS_STATE') {

    const state = analysisState.get(msg.tabId);
    sendResponse(state || { status: 'none' });
    return false;
  }

  if (msg.type === 'PAGE_LOADED') {
    console.log('Page loaded:', msg.title, sender.tab?.url);
    return false;
  }
});

async function analyzeVideo(videoUrl, skip_cache = false) {
  try {
    console.log('Analyzing video:', videoUrl, 'Skip cache:', skip_cache);
    const baseUrl = chrome.runtime.getManifest().backend_config.apiUrl;
    const response = await fetch(`${baseUrl}?skip_cache=${skip_cache}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: videoUrl })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing video:', error);
    throw error;
  }
}

