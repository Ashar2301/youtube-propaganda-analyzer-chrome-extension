
(function () {
  console.log('YouTube Propaganda Analyzer — content script loaded');
  async function analyzeVideo(videoUrl) {
    try {
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl })
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

  try {
    chrome.runtime.sendMessage({ type: 'PAGE_LOADED', title: document.title });
  } catch (e) {
    console.warn('Runtime not available:', e);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'ANALYZE') {
      const videoUrl = window.location.href;
      console.log('Sending video URL for analysis:', videoUrl);

      analyzeVideo(videoUrl)
        .then(result => {
          console.log('Analysis result:', result);
          sendResponse(result);
        })
        .catch(error => {
          sendResponse({ error: error.message });
        });

      return true;
    }
    return false;
  });
})();
