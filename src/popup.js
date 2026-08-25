import { buildResultMessage, parseAccountIds } from './account-utils.js';

const textarea = document.querySelector('#account-input');
const openButton = document.querySelector('#open-button');
const status = document.querySelector('#status');

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

async function restoreInput() {
  const { accountInput = '' } = await chrome.storage.local.get('accountInput');
  textarea.value = accountInput;
}

openButton.addEventListener('click', async () => {
  const { validIds, invalidItems } = parseAccountIds(textarea.value);

  if (validIds.length === 0) {
    setStatus(buildResultMessage(0, invalidItems.length), true);
    return;
  }

  openButton.disabled = true;
  setStatus('正在打开页面…');

  try {
    await chrome.storage.local.set({ accountInput: textarea.value });
    const result = await chrome.runtime.sendMessage({
      type: 'open-account-pages',
      accountIds: validIds
    });

    if (result?.error) {
      setStatus(`打开失败：${result.error}`, true);
      return;
    }

    setStatus(buildResultMessage(result?.openedCount ?? 0, invalidItems.length));
  } catch (error) {
    setStatus(`打开失败：${error.message}`, true);
  } finally {
    openButton.disabled = false;
  }
});

restoreInput().catch((error) => setStatus(`无法恢复上次输入：${error.message}`, true));
