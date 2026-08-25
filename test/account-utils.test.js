import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEventManagerUrl,
  buildResultMessage,
  openAccountPages,
  parseAccountIds
} from '../src/account-utils.js';

test('解析混合分隔的账户 ID 并保持首次出现顺序', () => {
  assert.deepEqual(
    parseAccountIds('1860144197120064， 200\n1860144197120064, abc'),
    {
      validIds: ['1860144197120064', '200'],
      invalidItems: ['abc']
    }
  );
});

test('为账户 ID 构建精确的事件管理链接', () => {
  assert.equal(
    buildEventManagerUrl('1860144197120064'),
    'https://ad.oceanengine.com/oceanus/event_manager/own?aadvid=1860144197120064'
  );
});

test('为每个账户创建一个不抢占焦点的事件管理标签页', async () => {
  const createdTabs = [];
  const createTab = async (options) => {
    createdTabs.push(options);
    return { id: createdTabs.length };
  };

  const openedCount = await openAccountPages(['1860144197120064', '200'], createTab);

  assert.equal(openedCount, 2);
  assert.deepEqual(createdTabs, [
    {
      url: 'https://ad.oceanengine.com/oceanus/event_manager/own?aadvid=1860144197120064',
      active: false
    },
    {
      url: 'https://ad.oceanengine.com/oceanus/event_manager/own?aadvid=200',
      active: false
    }
  ]);
});

test('为打开结果提供清晰的中文状态提示', () => {
  assert.equal(buildResultMessage(2, 1), '已打开 2 个页面；已忽略 1 项无效内容。');
  assert.equal(buildResultMessage(0, 0), '请输入至少一个纯数字账户 ID。');
});
