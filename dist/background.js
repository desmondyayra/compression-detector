/******/ (() => { // webpackBootstrap
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
// console.log('YouTube Compression Detector: Background script loaded');

// Map from tabId to complete video data
const videoDataByTab = new Map();

// Expected compression ratio ranges for different qualities
const COMPRESSION_THRESHOLDS = {
  '240p': {
    min: 100,
    max: 300
  },
  '360p': {
    min: 150,
    max: 400
  },
  '480p': {
    min: 200,
    max: 500
  },
  '720p': {
    min: 300,
    max: 700
  },
  '1080p': {
    min: 400,
    max: 1000
  },
  '1440p': {
    min: 500,
    max: 1200
  },
  '4K': {
    min: 600,
    max: 1500
  }
};
function getQualityFromResolution(width, height) {
  if (height >= 2160) return '4K';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  return '240p';
}
function isCompressionAbnormal(compressionRatio, quality) {
  const threshold = COMPRESSION_THRESHOLDS[quality];
  if (!threshold) return false;

  // Check if compression ratio is significantly higher than expected
  // Using 50% above max threshold as "abnormal"
  const abnormalThreshold = threshold.max * 1.5;
  return compressionRatio > abnormalThreshold;
}
function createCompressionNotification(videoData) {
  const {
    title,
    compressionRatio,
    videoQuality
  } = videoData;
  const threshold = COMPRESSION_THRESHOLDS[videoQuality];
  if (!threshold) return;
  const expectedMax = threshold.max;
  const percentageAbove = ((compressionRatio - expectedMax) / expectedMax * 100).toFixed(0);
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    // Make sure you have this icon file
    title: 'High Compression Detected',
    message: `"${title}" shows unusually high compression (${compressionRatio.toFixed(0)}:1 vs expected max ${expectedMax}:1 for ${videoQuality}). This may indicate over-compression or quality issues.`,
    priority: 1
  }, notificationId => {
    if (chrome.runtime.lastError) {
      // console.log('Notification error:', chrome.runtime.lastError);
    } else {
      // console.log(`Compression notification created: ${notificationId}`);
    }
  });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Message received in background:', message);

  if (message.action === 'compressionDataReady') {
    // console.log("Background received complete compression data");
    const tabId = sender.tab?.id;
    if (tabId !== undefined) {
      // Store the complete video data
      const completeVideoData = {
        title: message.title,
        url: message.url,
        videoId: message.videoId,
        videoQuality: message.videoQuality,
        resolution: message.resolution,
        frameRate: message.frameRate,
        receivedBitrateBytes: message.receivedBitrateBytes,
        decodedBitrateBytes: message.decodedBitrateBytes,
        compressionRatio: message.compressionRatio,
        validMeasurements: message.validMeasurements,
        totalMeasurements: message.totalMeasurements,
        measurements: message.measurements,
        timestamp: message.timestamp
      };
      videoDataByTab.set(tabId, completeVideoData);
      // console.log(`Stored complete video data for tab ${tabId}:`, completeVideoData);

      // Log key metrics for easy debugging
      // console.log(`Video: "${completeVideoData.title}"`);
      // console.log(`Quality: ${completeVideoData.videoQuality} (${completeVideoData.resolution.width}x${completeVideoData.resolution.height})`);
      // console.log(`Compression Ratio: ${completeVideoData.compressionRatio.toFixed(2)}:1`);

      // Check if compression ratio is abnormally high
      const quality = completeVideoData.videoQuality || getQualityFromResolution(completeVideoData.resolution.width, completeVideoData.resolution.height);
      if (isCompressionAbnormal(completeVideoData.compressionRatio, quality)) {
        // console.log(`⚠️ ABNORMAL COMPRESSION DETECTED for ${quality}:`, completeVideoData.compressionRatio);
        createCompressionNotification(completeVideoData);
      }
    }
    sendResponse({
      status: 'received'
    });
    return true;
  }
  if (message.action === 'getLatestVideoData') {
    const tabId = message.tabId;
    // console.log(`Background received request for video data from tab ${tabId}`);

    const videoData = videoDataByTab.get(tabId);
    // console.log("Found video data:", videoData);

    if (!videoData) {
      // console.log("No compression data found for this tab");
      sendResponse({
        status: 'not_found',
        reason: 'No compression data available for this tab yet. Please wait for the measurement to complete.'
      });
    } else {
      // console.log("Sending back complete video data:", videoData);
      sendResponse({
        status: 'success',
        videoData: videoData
      });
    }
    return true;
  }

  // Legacy support - in case other parts still use the old action name
  if (message.action === 'getLatestVideoInfo') {
    const tabId = message.tabId;
    // console.log(`Background received legacy request for tab ${tabId}`);

    const videoData = videoDataByTab.get(tabId);
    if (!videoData) {
      // console.log("No data found for this tab");
      sendResponse({
        status: 'not_found',
        reason: 'No data available for this tab yet'
      });
    } else {
      // Convert to legacy format if needed
      sendResponse({
        status: 'success',
        video: videoData
      });
    }
    return true;
  }
  return true;
});

// Clean up data when tabs are closed to prevent memory leaks
chrome.tabs.onRemoved.addListener(tabId => {
  if (videoDataByTab.has(tabId)) {
    // console.log(`Cleaning up data for closed tab ${tabId}`);
    videoDataByTab.delete(tabId);
  }
});

// Debug function to help identify available video data
chrome.tabs.onActivated.addListener(activeInfo => {
  // console.log(`Tab ${activeInfo.tabId} became active`);
  // console.log(`Video data available for tabs: ${[...videoDataByTab.keys()].join(', ')}`);

  // Show summary of available data
  const data = videoDataByTab.get(activeInfo.tabId);
  if (data) {
    console.log(`Active tab has data for: "${data.title}" (${data.videoQuality}) - Compression: ${data.compressionRatio.toFixed(2)}:1`);

    // Show compression status
    const quality = data.videoQuality || getQualityFromResolution(data.resolution.width, data.resolution.height);
    const threshold = COMPRESSION_THRESHOLDS[quality];
    if (threshold) {
      const status = data.compressionRatio > threshold.max * 1.5 ? '⚠️ HIGH' : '✅ Normal';
      // console.log(`Compression status: ${status} (Expected: ${threshold.min}-${threshold.max}:1)`);
    }
  } else {
    //   console.log('No video data available for active tab');
  }
});
/******/ })()
;
//# sourceMappingURL=background.js.map