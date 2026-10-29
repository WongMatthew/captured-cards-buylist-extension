// Opens the buylist maker in a tab (reuses an existing one if it's already open).
const APP = chrome.runtime.getURL('app.html');
chrome.action.onClicked.addListener(async () => {
  const [tab] = await chrome.tabs.query({ url: APP });
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: APP });
  }
});
chrome.runtime.onInstalled.addListener((d) => { if (d.reason === 'install') chrome.tabs.create({ url: APP }); });
