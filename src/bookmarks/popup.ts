chrome.tabs
  .create({ url: chrome.runtime.getURL("bookmarks.html") })
  .then(() => window.close());
