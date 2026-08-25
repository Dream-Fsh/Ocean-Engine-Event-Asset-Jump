import { openAccountPages } from './account-utils.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'open-account-pages' || !Array.isArray(message.accountIds)) {
    return undefined;
  }

  openAccountPages(message.accountIds, (options) => chrome.tabs.create(options))
    .then((openedCount) => sendResponse({ openedCount }))
    .catch((error) => sendResponse({ error: error.message }));

  return true;
});
