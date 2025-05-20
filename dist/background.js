/******/ (() => { // webpackBootstrap
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
console.log('YouTube Compression Detector: Background script loaded');

// Map from tabId to videoInfo
var videoInfoByTab = new Map();
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log('Message received in background:', message);
  if (message.action === 'videoUpdate') {
    var _sender$tab;
    console.log("Background received video update");
    var tabId = (_sender$tab = sender.tab) === null || _sender$tab === void 0 ? void 0 : _sender$tab.id;
    if (tabId !== undefined) {
      videoInfoByTab.set(tabId, message.video);
      console.log("Updated video info for tab ".concat(tabId, ":"), message.video);
    }
    sendResponse({
      status: 'received'
    });
    return true; // Keep the message channel open for async response
  }
  if (message.action === 'getLatestVideoInfo') {
    var _tabId = message.tabId;
    console.log("Background received request for tab ".concat(_tabId));
    var info = videoInfoByTab.get(_tabId);
    console.log("Found info:", info);
    if (!info) {
      console.log("No info found for this tab");
      sendResponse({
        status: 'not_found',
        reason: 'No update for this tab yet'
      });
    } else {
      console.log("Sending back info:", info);
      sendResponse({
        status: 'success',
        video: info
      });
    }
    return true; // Keep the message channel open for async response
  }
  return true; // Always return true to indicate you might respond asynchronously
});

// Add this debug function to help identify if video info exists
chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log("Tab ".concat(activeInfo.tabId, " became active"));
  console.log("Video info available for tabs: ".concat(_toConsumableArray(videoInfoByTab.keys()).join(', ')));
});
/******/ })()
;
//# sourceMappingURL=background.js.map