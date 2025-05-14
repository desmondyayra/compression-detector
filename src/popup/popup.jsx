import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './popup.css';

const Popup = () => {
  const [loading, setLoading] = useState(true);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState(null);

    useEffect(() => {
      
        console.log("popup loaded !!!!");
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Check if we're on a YouTube watch page
      const activeTab = tabs[0];
      if (!activeTab.url.includes('youtube.com/watch')) {
        setLoading(false);
        setError('Not on a YouTube video page');
        return;
      }

      // Send a message to the content script to get video info
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: 'getVideoInfo' },
        (response) => {
          setLoading(false);
          
          // Check for error in communication with content script
          if (chrome.runtime.lastError) {
            setError('Could not connect to page. Make sure you are on a YouTube video page.');
            return;
          }
          
          // Set video info if we got a valid response
          if (response && response.isYouTubeVideo) {
            setVideoInfo(response);
          }
        }
      );
    });
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="popup-container">
        <h1 className="header">YouTube Compression Detector</h1>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="popup-container">
        <h1 className="header">YouTube Compression Detector</h1>
        <div className="no-video">{error}</div>
      </div>
    );
  }

  // Render no video state
  if (!videoInfo) {
    return (
      <div className="popup-container">
        <h1 className="header">YouTube Compression Detector</h1>
        <div className="no-video">No YouTube video detected</div>
      </div>
    );
  }

  // Render video info
  return (
    <div className="popup-container">
      <h1 className="header">YouTube Compression Detector</h1>
      <div className="video-container">
        <div className="video-title">{videoInfo.title}</div>
        {videoInfo.videoId && (
          <div className="video-id">Video ID: {videoInfo.videoId}</div>
        )}
      </div>
    </div>
  );
};

// Render the popup
ReactDOM.render(<Popup />, document.getElementById('root'));