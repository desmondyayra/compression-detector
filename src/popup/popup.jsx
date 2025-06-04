import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

const Popup = () => {
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        setError('No active tab found.');
        setLoading(false);
        return;
      }

      const activeTab = tabs[0];
      if (!activeTab.url.includes('youtube.com/watch')) {
        setError('Please open a YouTube video.');
        setLoading(false);
        return;
      }

      chrome.runtime.sendMessage(
        { action: 'getLatestVideoData', tabId: activeTab.id },
        (response) => {
          setLoading(false);
          if (chrome.runtime.lastError) {
            setError('Unable to connect. Try again.');
            return;
          }

          if (response?.status === 'success') {
            setVideoData(response.videoData);
          } else {
            setError('Waiting for compression analysis...');
          }
        }
      );
    });
  }, []);

  const renderHeader = () => (
    <div className="header">
      <h1>YouTube Compression Analyzer</h1>
    </div>
  );

  if (loading) {
    return (
      <div className="popup-container">
        {renderHeader()}
        <div className="content centered">
          <div className="spinner"></div>
          <p className="message">Waiting for compression analysis…</p>
        </div>
      </div>
    );
  }

  if (error && !videoData) {
    return (
      <div className="popup-container">
        {renderHeader()}
        <div className="content centered">
          <p className="message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {renderHeader()}
      <div className="content">
        <div className="video-title">{videoData.title}</div>
        <div className="stat-line">
          <span className="label">Quality:</span>
          <span className="value">{videoData.videoQuality}</span>
        </div>
        <div className="stat-line">
          <span className="label">Resolution:</span>
          <span className="value">
            {videoData.resolution.width} × {videoData.resolution.height}
          </span>
        </div>
        <div className="stat-line highlight">
          <span className="label">Compression Ratio:</span>
          <span className="value">{Math.round(videoData.compressionRatio)}:1
          </span>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Popup />);
