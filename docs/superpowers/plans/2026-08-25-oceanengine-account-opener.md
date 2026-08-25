# 巨量引擎账户页批量打开扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可将批量账户 ID 打开为巨量引擎事件管理页的本地 Chrome 扩展。

**Architecture:** 使用 Manifest V3 弹窗收集输入，纯 JavaScript 工具模块负责解析与 URL 生成，后台 Service Worker 通过 Chrome Tabs API 新建标签页。弹窗仅保存原始输入到 `chrome.storage.local`，不读取目标页面或身份凭据。

**Tech Stack:** Chrome Manifest V3、HTML、CSS、原生 JavaScript、Node.js 内置 `node:test`。

**Spec:** `docs/superpowers/specs/2026-08-25-oceanengine-account-opener-design.md`

## Global Constraints

- 只接受纯数字账户 ID，支持换行、英文逗号和中文逗号分隔。
- 保持首次出现顺序去重。
- 目标 URL 必须为 `https://ad.oceanengine.com/oceanus/event_manager/own?aadvid={账户ID}`。
- 不访问、不导出或保存 Cookie、Token、Authorization 或页面数据。
- 输入只存于浏览器本机扩展存储。

---

### Task 1: 账户 ID 解析与 URL 构建

**Files:**
- Create: `src/account-utils.js`
- Create: `test/account-utils.test.js`

**Interfaces:**
- Produces: `parseAccountIds(input: string): { validIds: string[], invalidItems: string[] }`
- Produces: `buildEventManagerUrl(accountId: string): string`

- [ ] **Step 1: Write the failing tests**

```js
assert.deepEqual(parseAccountIds('1860144197120064， 200\n1860144197120064, abc'), {
  validIds: ['1860144197120064', '200'],
  invalidItems: ['abc']
});
assert.equal(
  buildEventManagerUrl('1860144197120064'),
  'https://ad.oceanengine.com/oceanus/event_manager/own?aadvid=1860144197120064'
);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/account-utils.test.js`

Expected: FAIL because `src/account-utils.js` is absent.

- [ ] **Step 3: Write the minimal implementation**

```js
export function parseAccountIds(input) {
  const seen = new Set();
  const validIds = [];
  const invalidItems = [];
  for (const item of String(input).split(/[\n,，]+/).map((value) => value.trim()).filter(Boolean)) {
    if (!/^\d+$/.test(item)) invalidItems.push(item);
    else if (!seen.has(item)) { seen.add(item); validIds.push(item); }
  }
  return { validIds, invalidItems };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/account-utils.test.js`

Expected: PASS.

### Task 2: 扩展清单与后台标签页打开功能

**Files:**
- Create: `manifest.json`
- Create: `src/background.js`
- Modify: `src/account-utils.js`
- Modify: `test/account-utils.test.js`

**Interfaces:**
- Consumes: `buildEventManagerUrl(accountId: string): string`
- Consumes: background message `{ type: 'open-account-pages', accountIds: string[] }`
- Produces: response `{ openedCount: number }`

- [ ] **Step 1: Extend failing tests for invalid IDs and empty input**

```js
assert.deepEqual(parseAccountIds('   \n,，'), { validIds: [], invalidItems: [] });
assert.deepEqual(parseAccountIds('123abc, 456'), { validIds: ['456'], invalidItems: ['123abc'] });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/account-utils.test.js`

Expected: FAIL until parsing handles empty entries and invalid values exactly.

- [ ] **Step 3: Complete parsing and add MV3 background handling**

```js
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'open-account-pages') return undefined;
  Promise.all(message.accountIds.map((accountId) => chrome.tabs.create({ url: buildEventManagerUrl(accountId), active: false })))
    .then((tabs) => sendResponse({ openedCount: tabs.length }))
    .catch((error) => sendResponse({ error: error.message }));
  return true;
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test test/account-utils.test.js`

Expected: PASS.

### Task 3: 弹窗界面与本地输入恢复

**Files:**
- Create: `src/popup.html`
- Create: `src/popup.js`
- Create: `src/styles.css`
- Modify: `manifest.json`

**Interfaces:**
- Consumes: `parseAccountIds(input: string)` from `account-utils.js`
- Consumes: `chrome.storage.local` key `accountInput`
- Sends: `{ type: 'open-account-pages', accountIds: string[] }`

- [ ] **Step 1: Add a failing pure-function test for status text**

```js
assert.equal(buildResultMessage(2, 1), '已打开 2 个页面；已忽略 1 项无效内容。');
assert.equal(buildResultMessage(0, 0), '请输入至少一个纯数字账户 ID。');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/account-utils.test.js`

Expected: FAIL because `buildResultMessage` is not exported.

- [ ] **Step 3: Implement the status helper and popup behavior**

```js
const { accountInput = '' } = await chrome.storage.local.get('accountInput');
textarea.value = accountInput;

button.addEventListener('click', async () => {
  const { validIds, invalidItems } = parseAccountIds(textarea.value);
  if (!validIds.length) { setStatus(buildResultMessage(0, invalidItems.length)); return; }
  await chrome.storage.local.set({ accountInput: textarea.value });
  const result = await chrome.runtime.sendMessage({ type: 'open-account-pages', accountIds: validIds });
  setStatus(result.error ?? buildResultMessage(result.openedCount, invalidItems.length));
});
```

- [ ] **Step 4: Run automated tests and manually load the unpacked extension**

Run: `node --test test/account-utils.test.js`

Expected: PASS; then load the project directory through Chrome extension developer mode and validate the stated sample URL.
