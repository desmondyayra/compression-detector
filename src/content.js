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

function collectVideoInfo() {
  if (!isYouTubeWatchPage()) return null;

  return {
    isYouTubeVideo: true,
    title: getVideoTitle(),
    url: window.location.href,
    videoId: new URLSearchParams(window.location.search).get('v'),
    timestamp: Date.now()
  };
}

// Send video info every 1 minute
setInterval(() => {

  console.log("starting interval !!!")
  const videoInfo = collectVideoInfo();
  if (videoInfo) {
    chrome.runtime.sendMessage({ action: 'videoUpdate', video: videoInfo });
  }
}, 60000);

// Also send immediately on load
const initialInfo = collectVideoInfo();
if (initialInfo) {
  chrome.runtime.sendMessage({ action: 'videoUpdate', video: initialInfo });
}
