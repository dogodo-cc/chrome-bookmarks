// 当扩展安装时创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "exportLayoutConfig",
    title: "导出布局配置",
    contexts: ["page"],
  });
  chrome.contextMenus.create({
    id: "importLayoutConfig",
    title: "导入布局配置",
    contexts: ["page"],
  });
});

// 监听菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "exportLayoutConfig" && tab?.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, { action: "exportLayoutConfig" });
  }
  if (info.menuItemId === "importLayoutConfig" && tab?.id !== undefined) {
    chrome.tabs.sendMessage(tab.id, { action: "importLayoutConfig" });
  }
});
