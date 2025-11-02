# YouTube Propaganda Analyzer — Chrome Extension Starter

This repository contains a minimal Chrome extension boilerplate (Manifest V3) intended as a starting point for the YouTube Propaganda Analyzer project.

What is included
- `manifest.json` — extension manifest (v3).
- `src/background.js` — background service worker (minimal).
- `src/contentScript.js` — content script that runs on YouTube pages and responds to ANALYZE messages.
- `src/popup/` — simple popup UI (`popup.html`, `popup.js`, `popup.css`) with an "Analyze current tab" button.
- `icons/` — simple placeholder SVG icons.

How to load locally
1. Open Chrome and navigate to chrome://extensions.
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select this repository folder.

Notes and next steps
- The content script and background are stubs — replace the placeholder analysis with your actual detection logic.
- If you want to use a build step (TypeScript, bundlers), add a `package.json` and build pipeline; keep the output paths aligned with `manifest.json`.
