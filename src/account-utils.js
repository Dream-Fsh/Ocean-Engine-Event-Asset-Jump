const EVENT_MANAGER_BASE_URL = 'https://ad.oceanengine.com/oceanus/event_manager/own';

export function parseAccountIds(input) {
  const seen = new Set();
  const validIds = [];
  const invalidItems = [];
  const items = String(input)
    .split(/[\n,，]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  for (const item of items) {
    if (!/^\d+$/.test(item)) {
      invalidItems.push(item);
      continue;
    }

    if (!seen.has(item)) {
      seen.add(item);
      validIds.push(item);
    }
  }

  return { validIds, invalidItems };
}

export function buildEventManagerUrl(accountId) {
  return `${EVENT_MANAGER_BASE_URL}?aadvid=${encodeURIComponent(accountId)}`;
}

export async function openAccountPages(accountIds, createTab) {
  const tabs = await Promise.all(
    accountIds.map((accountId) => createTab({
      url: buildEventManagerUrl(accountId),
      active: false
    }))
  );

  return tabs.length;
}

export function buildResultMessage(openedCount, invalidCount) {
  if (openedCount === 0) {
    return '请输入至少一个纯数字账户 ID。';
  }

  const openedMessage = `已打开 ${openedCount} 个页面。`;
  return invalidCount > 0
    ? `${openedMessage.slice(0, -1)}；已忽略 ${invalidCount} 项无效内容。`
    : openedMessage;
}
