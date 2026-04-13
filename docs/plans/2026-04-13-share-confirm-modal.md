# Share Confirmation Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the clipboard-copy share flow with a confirmation modal that lets the owner review permissions, then triggers a native WeChat mini-program forward (share card) to the recipient.

**Architecture:** `ModuleManagementPage` owns the modal state and UI (including a `<button open-type="share">` inside the modal). The alias page `pages/management/index.vue` implements `onShareAppMessage`, reads context from `$refs.managementPage.context`, creates the invite token, and returns the share card path. Recipient lands on the existing `pages/join/index` — no changes needed there.

**Tech Stack:** Vue 2 (uni-app), WeChat Mini Program `onShareAppMessage`, existing `createInviteToken` + `createJoinPageUrl` service calls.

---

### Task 1: Update contract tests to describe the new share behavior

The existing test `'module management share action creates a shareable invite artifact...'` currently asserts `uni.setClipboardData` is present. That assertion will break once we remove clipboard. Update it now so we have a failing test to drive the implementation.

**Files:**
- Modify: `frontend/__tests__/sharing-entry-contract.test.mjs`

**Step 1: Replace the existing management share test and add alias-page test**

Find the test block:
```js
test('module management share action creates a shareable invite artifact instead of navigating the owner into the join acceptance page', () => {
```

Replace the entire test (lines ~35–40) with two new tests:

```js
test('module management share action opens a confirmation modal instead of copying to clipboard', () => {
	const source = readManagementPage();

	assert.match(source, /showShareModal/);
	assert.doesNotMatch(source, /uni\.setClipboardData\(/);
});

test('management alias page defines onShareAppMessage for native WeChat forward', () => {
	const aliasSource = fs.readFileSync(
		path.resolve(repoRoot, 'pages/management/index.vue'),
		'utf8'
	);

	assert.match(aliasSource, /onShareAppMessage/);
	assert.match(aliasSource, /createInviteToken/);
	assert.match(aliasSource, /managementPage\.context/);
});
```

**Step 2: Run tests — expect the two new tests to FAIL**

```bash
node --test frontend/__tests__/sharing-entry-contract.test.mjs
```

Expected: 2 failures (`showShareModal` not found, `onShareAppMessage` not found), other tests still pass.

---

### Task 2: Gut `handleShareAction` and add `showShareModal` state

**Files:**
- Modify: `frontend/components/management/ModuleManagementPage.vue`

**Step 1: Add `showShareModal` to `data()`**

In the `data()` return object, add after `isDemoMode`:
```js
showShareModal: false,
```

**Step 2: Replace `handleShareAction` body**

Find the entire `async handleShareAction()` method and replace it with:

```js
handleShareAction() {
	if (this.isMutating || !this.page?.managementCard?.secondaryAction) return;

	if (this.isDemoMode) {
		uni.showToast({ title: 'Demo 模式暂不支持共享邀请', icon: 'none' });
		return;
	}

	this.showShareModal = true;
},
```

Note: no longer `async`, no longer calls `createInviteToken` or `setClipboardData`. Token creation moves to `onShareAppMessage` in the alias page.

**Step 3: Run the first new contract test — expect it to PASS now**

```bash
node --test frontend/__tests__/sharing-entry-contract.test.mjs
```

Expected: `'opens a confirmation modal...'` passes; `'alias page defines onShareAppMessage...'` still fails; all other tests still pass.

---

### Task 3: Add modal template and styles to `ModuleManagementPage`

**Files:**
- Modify: `frontend/components/management/ModuleManagementPage.vue`

**Step 1: Add modal markup to the template**

At the end of the root `<view class="management-page u-page-shell">`, before the closing `</view>`, add:

```html
<!-- Share confirmation modal -->
<view v-if="showShareModal" class="share-modal-mask" @tap.self="showShareModal = false">
	<view class="share-modal">
		<view class="share-modal__header">
			<text class="share-modal__title u-text-title-sm">共享模块</text>
			<text class="share-modal__module-name u-text-body">{{ selectedModule && selectedModule.moduleName }}</text>
		</view>

		<view class="share-modal__badge">
			<view class="share-modal__badge-dot" />
			<text class="share-modal__badge-text">只读权限</text>
		</view>

		<view class="share-modal__perms">
			<view class="share-modal__perm-row">
				<view class="share-modal__perm-icon share-modal__perm-icon--ok">
					<text class="share-modal__perm-icon-text">✓</text>
				</view>
				<text class="share-modal__perm-text"><text class="share-modal__perm-bold">可以查看</text>所有周期记录、日历和统计数据</text>
			</view>
			<view class="share-modal__perm-row">
				<view class="share-modal__perm-icon share-modal__perm-icon--no">
					<text class="share-modal__perm-icon-text">✕</text>
				</view>
				<text class="share-modal__perm-text"><text class="share-modal__perm-bold">无法编辑</text>任何数据，仅供阅读</text>
			</view>
		</view>

		<view class="share-modal__actions">
			<button
				class="share-modal__btn share-modal__btn--primary"
				open-type="share"
			>发送邀请</button>
			<view
				class="share-modal__btn share-modal__btn--secondary"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="showShareModal = false"
			>
				<text>取消</text>
			</view>
		</view>
	</view>
</view>
```

**Step 2: Add modal styles to the `<style>` block**

Append to the existing `<style lang="scss">`:

```scss
// ── Share confirmation modal ───────────────────────────────────
$modal-rose:        #c9786a;
$modal-rose-soft:   #f3d7d1;
$modal-amber-bg:    #fdf3e9;
$modal-amber-border:#e8c99a;
$modal-amber-text:  #8a5e28;
$modal-amber-dot:   #c6914b;
$modal-ok-bg:       #ecf5e9;
$modal-ok-text:     #5a8a4a;
$modal-err-bg:      #faeae9;
$modal-err-text:    #b96858;
$modal-brown-900:   #2f2a26;
$modal-brown-700:   #72685f;
$modal-brown-500:   #a29488;
$modal-warm-100:    #f3eee7;
$modal-warm-200:    #e6ded5;

.share-modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	z-index: 999;
}

.share-modal {
	width: 100%;
	background: #ffffff;
	border-radius: 32rpx 32rpx 0 0;
	padding: 36rpx 32rpx 48rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.share-modal__header {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.share-modal__title {
	color: $modal-brown-900;
}

.share-modal__module-name {
	color: $modal-brown-500;
}

.share-modal__badge {
	display: flex;
	align-items: center;
	gap: 8rpx;
	align-self: flex-start;
	background: $modal-amber-bg;
	border: 1rpx solid $modal-amber-border;
	border-radius: 999rpx;
	padding: 6rpx 20rpx;
}

.share-modal__badge-dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	background: $modal-amber-dot;
}

.share-modal__badge-text {
	font-size: 22rpx;
	font-weight: 600;
	color: $modal-amber-text;
}

.share-modal__perms {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.share-modal__perm-row {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
}

.share-modal__perm-icon {
	width: 32rpx;
	height: 32rpx;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	margin-top: 2rpx;

	&--ok { background: $modal-ok-bg; }
	&--no { background: $modal-err-bg; }
}

.share-modal__perm-icon-text {
	font-size: 18rpx;
	font-weight: 700;

	.share-modal__perm-icon--ok & { color: $modal-ok-text; }
	.share-modal__perm-icon--no & { color: $modal-err-text; }
}

.share-modal__perm-text {
	font-size: 26rpx;
	color: $modal-brown-700;
	line-height: 1.6;
}

.share-modal__perm-bold {
	font-weight: 600;
	color: $modal-brown-900;
}

.share-modal__actions {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-top: 8rpx;
}

.share-modal__btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	border-radius: 999rpx;
	border: none;
	font-size: 28rpx;
	font-weight: 600;
	padding: 28rpx 0;
	line-height: 1;
	box-sizing: border-box;

	&::after { border: none; }

	&--primary {
		background: $modal-rose;
		color: #ffffff;
	}

	&--secondary {
		background: $modal-warm-100;
		color: $modal-brown-700;
	}
}
```

**Step 3: No test to run here — visual only. Move on.**

---

### Task 4: Add `onShareAppMessage` to the alias page

**Files:**
- Modify: `frontend/pages/management/index.vue`

**Step 1: Add imports**

After the existing `import ModuleManagementPage` line, add:

```js
import { createInviteToken } from '../../services/sharing/sharing-command-service.js';
import { createJoinPageUrl } from '../../services/menstrual/module-shell-service.js';
```

Note: `createJoinPageUrl` is the function that builds the `pages/join/index` path. Verify the exact export name in `module-shell-service.js` before writing (it may be named `createShareableJoinLink` or similar — use whatever is exported).

**Step 2: Add `onShareAppMessage` to the component options**

In the `export default { ... }` object, after `mounted()`, add:

```js
onShareAppMessage() {
	const ctx = this.$refs.managementPage?.context;

	if (!ctx) {
		return { title: '月经记录' };
	}

	return createInviteToken({
		apiBaseUrl: ctx.apiBaseUrl,
		openid: ctx.openid,
		moduleInstanceId: ctx.moduleInstanceId,
	}).then((result) => {
		const path = createJoinPageUrl({
			apiBaseUrl: ctx.apiBaseUrl,
			token: result?.data?.token,
		}).replace(/^\//, '');

		return { title: '邀请你查看月经记录', path };
	}).catch(() => {
		return { title: '月经记录' };
	});
},
```

**Step 3: Run all contract tests — expect all to pass**

```bash
node --test frontend/__tests__/sharing-entry-contract.test.mjs
```

Expected: all 5 tests pass (4 original + 1 new alias test; the clipboard test was replaced in Task 1).

---

### Task 5: Close the modal after the share picker is dismissed (optional polish)

In WeChat mini-program, after the user completes or cancels the forward picker, `onShareAppMessage` has already returned. The modal stays open. Close it in `onShareAppMessage`'s `.then` / `.catch` by emitting a close signal.

Since `onShareAppMessage` is on the alias page and the modal state is in the child component, close the modal via `$refs`:

In `pages/management/index.vue` `onShareAppMessage`, in the `.then()` callback, before `return`, add:

```js
this.$refs.managementPage && (this.$refs.managementPage.showShareModal = false);
```

Do the same in `.catch()`.

No test needed for this step.

---

### Task 6: Commit

```bash
git add frontend/__tests__/sharing-entry-contract.test.mjs \
        frontend/components/management/ModuleManagementPage.vue \
        frontend/pages/management/index.vue
git commit -m "feat(management): replace clipboard share with confirmation modal and native WeChat forward"
```

---

## Verification Checklist

After all tasks:

- [ ] `node --test frontend/__tests__/sharing-entry-contract.test.mjs` — all tests pass
- [ ] In H5 preview: tap "共享" → modal appears with permission rows and "发送邀请" / "取消" buttons
- [ ] In H5 preview: tap "取消" → modal closes
- [ ] In H5 preview: tap outside modal → modal closes
- [ ] In WeChat DevTools (mini-program): tap "共享" → modal appears → tap "发送邀请" → WeChat forward picker opens
- [ ] In WeChat DevTools: complete forward → recipient-side `pages/join/index` opens with token in URL

## Notes

- `createJoinPageUrl` vs `createShareableJoinLink`: check the actual export from `module-shell-service.js` before writing Task 4. They are the same function; use whichever name is exported.
- `context` is a data property on `ModuleManagementPage`, so `this.$refs.managementPage.context` is directly accessible from the alias page.
- In H5, `open-type="share"` does nothing — the "发送邀请" button appears but tapping it has no effect. This is expected and acceptable for local debug.
