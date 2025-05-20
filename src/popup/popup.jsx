import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './popup.css';

const Popup = () => {
  const [loading, setLoading] = useState(true);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log("Popup initialized");

    const getTabAndFetchVideoInfo = () => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          console.log("Chrome tabs query completed", tabs);

          if (!tabs || tabs.length === 0) {
            console.error("No active tabs found");
            setLoading(false);
            setError('No active tab found.');
            setDebugInfo(prev => ({ ...prev, tabsError: "No active tabs" }));
            return;
          }

          const activeTab = tabs[0];
          const tabId = activeTab.id;
          const tabUrl = activeTab.url || "";

          console.log("Active tab info:", { tabId, tabUrl });
          setDebugInfo(prev => ({ ...prev, tabId, tabUrl }));

          if (!tabUrl.includes('youtube.com/watch')) {
            console.log("Not a YouTube watch URL:", tabUrl);
            setLoading(false);
            setError('No YouTube video playing on this page.');
            return;
          }

          console.log("Sending message to background script from popup...");

          chrome.runtime.sendMessage(
            { action: 'getLatestVideoInfo', tabId, url: tabUrl },
            (response) => {
              console.log("Response callback executed", response);
              setLoading(false);

              if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message;
                console.error("Runtime error:", errorMsg);
                setError(`Error: ${errorMsg}`);
                setDebugInfo(prev => ({ ...prev, runtimeError: errorMsg }));
                return;
              }

              if (!response) {
                console.error("No response received");
                setError('No response received from background script.');
                setDebugInfo(prev => ({ ...prev, responseError: "No response" }));
                return;
              }

              setDebugInfo(prev => ({ ...prev, response }));

              if (response.status === 'not_found') {
                console.log("No compression update found for this video");
                setError('No compression update found yet for this video.');
                return;
              }

              if (response.status === 'success') {
                console.log("Success! Video info:", response.video);
                setVideoInfo(response.video);
              } else {
                setError('Unknown response status.');
              }
            }
          );
        });
      } catch (e) {
        console.error("Exception in getTabAndFetchVideoInfo:", e);
        setLoading(false);
        setError(`Exception: ${e.message}`);
        setDebugInfo(prev => ({ ...prev, exception: e.message }));
      }
    };

    getTabAndFetchVideoInfo();
  }, []);

  if (loading) {
    return (
      <div className="popup-container">
        <h1 className="header">YouTube Compression Detector</h1>
        <div className="loading">Loading...</div>
        <pre className="debug-info">Debug: {JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    );
  }

  if (error) {
    return (
      <div className="popup-container">
        <h1 className="header">YouTube Compression Detector</h1>
        <div className="no-video">{error}</div>
        <pre className="debug-info">Debug: {JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <h1 className="header">YouTube Compression Detector</h1>
      <div className="video-container">
        <div className="video-title">{videoInfo?.title || "No title"}</div>
        <div className="video-id">Video ID: {videoInfo?.videoId || "Unknown"}</div>
        <div className="video-time">
          Last update: {videoInfo?.timestamp ? new Date(videoInfo.timestamp).toLocaleTimeString() : "Unknown"}
        </div>
      </div>
      <pre className="debug-info">Debug: {JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Root element not found!");
    document.addEventListener('DOMContentLoaded', () => {
      const fallback = document.getElementById('root');
      ReactDOM.render(<Popup />, fallback);
    });
  } else {
    ReactDOM.render(<Popup />, rootElement); // For React 17
    // For React 18:
    // import { createRoot } from 'react-dom/client';
    // const root = createRoot(rootElement);
    // root.render(<Popup />);
  }
} catch (e) {
  console.error("Error rendering popup:", e);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">
    Error rendering popup: ${e.message}
    <pre>${e.stack}</pre>
  </div>`;
}
