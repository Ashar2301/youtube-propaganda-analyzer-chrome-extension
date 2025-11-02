
document.addEventListener('DOMContentLoaded', async () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const reanalyzeBtn = document.getElementById('reanalyzeBtn');
  const loader = document.getElementById('loader');
  const resultsContainer = document.getElementById('resultsContainer');
  const biasScoreEl = document.getElementById('biasScore');
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
    const biasScore = payload?.biasAnalysis?.bias_score ?? 0;
    const explanation = payload?.simplifiedResult?.explanation || '';
    const tags = payload?.simplifiedResult?.tags || [];

    biasScoreEl.textContent = String(biasScore);
    explanationEl.textContent = explanation;
    tagsEl.innerHTML = '';

    if (Array.isArray(tags) && tags.length) {
      tags.forEach(t => tagsEl.appendChild(createChip(t)));
    }

    resultsContainer.style.display = 'block';
    analyzeBtn.style.display = 'none';
  }


  async function analyzeCurrentTab() {
    resetUI();
    setLoading(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showError('No active tab found');
        setLoading(false);
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE' }, async (response) => {

        setLoading(false);

        if (chrome.runtime.lastError) {
          showError('Extension content script not available on this page.');
          return;
        }

        if (!response) {
          showError('No response from analyzer.');
          return;
        }

        if (response.error) {
          showError('Analysis error: ' + response.error);
          return;
        }


        if (tab.url) {
          const key = `analysis_${tab.url}`;
          await chrome.storage.local.set({ [key]: response });
        }

        displayResults(response);
      });
    } catch (err) {
      setLoading(false);
      showError('Unexpected error: ' + (err && err.message ? err.message : String(err)));
    }
  }


  analyzeBtn.addEventListener('click', analyzeCurrentTab);
  reanalyzeBtn.addEventListener('click', analyzeCurrentTab);
});
