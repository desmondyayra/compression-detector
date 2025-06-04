console.log('YouTube Compression Detector: Content script loaded');

function isYouTubeWatchPage() {
  return window.location.hostname.includes('youtube.com') &&
         window.location.pathname === '/watch';
}

function getVideoTitle() {
  const possibleSelectors = [
    'h1.title.style-scope.ytd-video-primary-info-renderer',
    'h1.ytd-watch-metadata',
    'h1.title',
    'ytd-watch-metadata h1'
  ];

  for (const selector of possibleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.textContent.trim()) {
      return titleElement.textContent.trim();
    }
  }

  return 'Unknown YouTube Video';
}

function getVideoElement() {
  return document.querySelector('video');
}

function isAdPlaying() {
  const adContainer = document.querySelector('.video-ads.ytp-ad-module');
  return adContainer && adContainer.children.length > 0;
}

function getVideoQuality(video) {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (height >= 2160) return '4K';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  return '240p';
}

function waitForNoAdThenMeasure() {
  if (isAdPlaying()) {
    // console.log('Ad detected, waiting for it to finish...');
    const adCheck = setInterval(() => {
      if (!isAdPlaying()) {
        clearInterval(adCheck);
        // console.log('Ad finished. Waiting 5 seconds before measurement...');
        setTimeout(measureOnceAfterDelay, 5000);
      } else {
        // console.log('Ad still playing...');
      }
    }, 10000);
  } else {
    // console.log('No ad playing. Waiting 5 seconds before measurement...');
    setTimeout(measureOnceAfterDelay, 5000);
  }
}

function measureOnceAfterDelay() {
  const video = getVideoElement();
  if (!video) {
    // console.log('No video element found.');
    return;
  }

  if (video.paused) {
    // console.log('Video is paused. Waiting to resume...');
    const onPlay = () => {
      video.removeEventListener('play', onPlay);
      // console.log('Video resumed. Waiting 5 seconds before measuring...');
      setTimeout(measureOnceAfterDelay, 5000);
    };
    video.addEventListener('play', onPlay);
    return;
  }

  // console.log('Waiting 15 seconds to collect data...');
  const startDecodedBytes = video.webkitVideoDecodedByteCount || 0;
  const startStats = video.getVideoPlaybackQuality();
  const startFrames = startStats ? startStats.totalVideoFrames - startStats.droppedVideoFrames : 0;
  const startTime = video.currentTime;
  const startTimestamp = Date.now();

  setTimeout(() => {
    const endDecodedBytes = video.webkitVideoDecodedByteCount || 0;
    const endStats = video.getVideoPlaybackQuality();
    const endFrames = endStats ? endStats.totalVideoFrames - endStats.droppedVideoFrames : 0;
    const endTime = video.currentTime;
    const endTimestamp = Date.now();

    const framesDiff = endFrames - startFrames;
    const bytesDiff = endDecodedBytes - startDecodedBytes;
    const timeDiff = endTime - startTime;

    if (timeDiff <= 0 || framesDiff <= 0 || bytesDiff <= 0) {
      // console.log('Invalid measurement. Try again.');
      return;
    }

    const fps = framesDiff / timeDiff;
    const width = video.videoWidth;
    const height = video.videoHeight;
    const videoQuality = getVideoQuality(video);

    const decodedBytesPerSec = fps * width * height * 1.5;
    const receivedBytesPerSec = bytesDiff / timeDiff;
    const decodedMbps = (decodedBytesPerSec * 8) / 1_000_000;
    const receivedMbps = (receivedBytesPerSec * 8) / 1_000_000;
    const compressionRatio = decodedMbps / receivedMbps;

    const result = {
      title: getVideoTitle(),
      videoQuality,
      resolution: { width, height },
      fps,
      receivedBitrateMbps: receivedMbps,
      decodedBitrateMbps: decodedMbps,
      compressionRatio,
      measurementTime: timeDiff,
      timestamp: Date.now()
    };

    // console.log('=== SINGLE MEASUREMENT RESULT (in Mbps) ===');
    // console.log(result);
    chrome.runtime.sendMessage({ action: 'compressionDataReady', ...result });
  }, 15000);
}

function setupMeasurement() {
  if (!isYouTubeWatchPage()) return;
  const video = getVideoElement();
  if (video) {
    // console.log('Video element found, starting ad check and measurement.');
    waitForNoAdThenMeasure();
  } else {
    // console.log('Waiting for video element...');
    setTimeout(setupMeasurement, 2000);
  }
}

setupMeasurement();

let currentUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    if (isYouTubeWatchPage()) {
      // console.log('New video detected. Resetting measurement...');
      setTimeout(setupMeasurement, 2000);
    }
  }
}, 1000);
