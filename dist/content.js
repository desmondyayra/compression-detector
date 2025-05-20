/******/ (() => { // webpackBootstrap
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
console.log('YouTube Compression Detector: Content script loaded');
function isYouTubeWatchPage() {
  return window.location.hostname.includes('youtube.com') && window.location.pathname === '/watch';
}
function getVideoTitle() {
  var possibleSelectors = ['h1.title.style-scope.ytd-video-primary-info-renderer', 'h1.ytd-watch-metadata', 'h1.title', 'ytd-watch-metadata h1'];
  for (var _i = 0, _possibleSelectors = possibleSelectors; _i < _possibleSelectors.length; _i++) {
    var selector = _possibleSelectors[_i];
    var titleElement = document.querySelector(selector);
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
setInterval(function () {
  console.log("starting interval !!!");
  var videoInfo = collectVideoInfo();
  if (videoInfo) {
    chrome.runtime.sendMessage({
      action: 'videoUpdate',
      video: videoInfo
    });
  }
}, 60000);

// Also send immediately on load
var initialInfo = collectVideoInfo();
if (initialInfo) {
  chrome.runtime.sendMessage({
    action: 'videoUpdate',
    video: initialInfo
  });
}
/******/ })()
;
//# sourceMappingURL=content.js.map