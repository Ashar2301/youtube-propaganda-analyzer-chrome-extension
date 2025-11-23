
document.addEventListener('DOMContentLoaded', async () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const reanalyzeBtn = document.getElementById('reanalyzeBtn');
  const loader = document.getElementById('loader');
  const resultsContainer = document.getElementById('resultsContainer');
  const biasScoreEl = document.getElementById('biasScore');
  const labelEl = document.getElementById('label');
  const explanationEl = document.getElementById('explanation');
  const tagsEl = document.getElementById('tags');
  const errorEl = document.getElementById('errorMessage');


  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    const key = `analysis_${tab.url}`;
    const stored = await chrome.storage.local.get(key);
    if (stored[key]) {
      displayResults(stored[key]);
    }
  }

  function resetUI() {
    errorEl.style.display = 'none';
    resultsContainer.style.display = 'none';
    biasScoreEl.textContent = '';
    labelEl.textContent = '';
    explanationEl.textContent = '';
    tagsEl.innerHTML = '';
  }

  function setLoading(loading) {
    if (loading) {
      loader.style.display = 'inline-block';
      analyzeBtn.disabled = true;
    } else {
      loader.style.display = 'none';
      analyzeBtn.disabled = false;
    }
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function createChip(text) {
    const d = document.createElement('div');
    d.className = 'chip';
    d.textContent = text;
    return d;
  }


  function displayResults(data) {
    const payload = data?.data || data;
    const biasScore = `${((payload?.bias_result?.bias_score ?? 0) * 100).toFixed(2)} %`;
    const label = payload?.bias_result?.analysis?.top_prediction_label || 'N/A';
    const explanation = payload?.simplified_result?.explanation || '';
    const tags = payload?.simplified_result?.tags || [];

    biasScoreEl.textContent = biasScore;
    labelEl.textContent = label;
    explanationEl.textContent = explanation;
    tagsEl.innerHTML = '';

    if (Array.isArray(tags) && tags.length) {
      tags.forEach(t => tagsEl.appendChild(createChip(t)));
    }

    resultsContainer.style.display = 'block';
    analyzeBtn.style.display = 'none';
  }


  // Function to check current analysis state
  async function checkAnalysisState() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;

    return new Promise(resolve => {
      chrome.runtime.sendMessage({
        type: 'GET_ANALYSIS_STATE',
        tabId: tab.id
      }, resolve);
    });
  }

  // Start polling for analysis updates
  let pollInterval = null;
  function startPolling() {
    if (pollInterval) return;

    pollInterval = setInterval(async () => {
      const state = await checkAnalysisState();
      if (!state) return;

      if (state.status === 'complete') {
        clearInterval(pollInterval);
        pollInterval = null;
        setLoading(false);
        displayResults(state.result);
      } else if (state.status === 'error') {
        clearInterval(pollInterval);
        pollInterval = null;
        setLoading(false);
        showError(state.error);
      }
      // Continue polling if status is 'loading'
    }, 1000);
  }

  // Check state when popup opens
  async function checkCurrentState() {
    const state = await checkAnalysisState();
    if (state?.status === 'loading') {
      setLoading(true);
      startPolling();
    } else if (state?.status === 'complete') {
      displayResults(state.result);
    } else if (state?.status === 'error') {
      showError(state.error);
    }
  }
  checkCurrentState();

  async function analyzeCurrentTab(skip_cache = false) {
    resetUI();
    setLoading(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showError('No active tab found');
        setLoading(false);
        return;
      }
      
      chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE', tabId: tab.id, skip_cache: skip_cache }, response => {
        if (chrome.runtime.lastError) {
          showError('Extension content script not available on this page.');
          setLoading(false);
          return;
        }

        if (response?.status === 'started') {
          // Analysis started in background, start polling for updates
          startPolling();
        } else {
          setLoading(false);
          showError('Failed to start analysis');
        }
      });
    } catch (err) {
      setLoading(false);
      showError('Unexpected error: ' + (err && err.message ? err.message : String(err)));
    }
  }


  analyzeBtn.addEventListener('click', () => analyzeCurrentTab(false));
  reanalyzeBtn.addEventListener('click', () => analyzeCurrentTab(true));
});
