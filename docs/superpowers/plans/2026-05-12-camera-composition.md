# Camera Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the runtime camera to the approved B composition so the board fills more of the vertical playable screen without changing gameplay rules.

**Architecture:** Keep the existing fixed perspective camera path in `HexGameController.setupCamera()`. Update the source-level camera regression test first, then change only the camera constants and append a short requirements note. Do not expand the grid in this pass; that remains a second pass if preview still shows dead space.

**Tech Stack:** LayaAir 3.x TypeScript, Node `.mjs` source regression tests, npm TypeScript typecheck.

---

### Task 1: Lock The B Camera Target In Regression Coverage

**Files:**
- Modify: `.temp/camera-angle.test.mjs`

- [ ] **Step 1: Write the failing test**

Replace the current Y and Z camera expectations with the B composition target:

```js
assert.equal(Number(positionMatch[2]), 22.4, "camera is close enough for the board-first B composition while keeping full edge tiles inside frame");
assert.equal(Number(positionMatch[3]), 8.6, "camera shifts the battlefield upward to reduce empty bottom water space");
```

Keep the current X, rotation, perspective, FOV, and scene lookup assertions:

```js
assert.equal(Number(positionMatch[1]), 0, "camera stays centered on X");
assert.equal(Number(rotationMatch[1]), -66, "camera uses a more top-down perspective tilt");
assert.equal(Number(fovMatch[1]), 42, "camera keeps the current ad perspective FOV");
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node .temp/camera-angle.test.mjs
```

Expected: FAIL because `src/game/HexGameController.ts` still contains `new Laya.Vector3(0, 31, 11.5)`.

### Task 2: Apply The Runtime Camera Composition

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Write the minimal implementation**

Change only the camera position in `setupCamera()`:

```ts
camera.transform.position = new Laya.Vector3(0, 22.4, 8.6);
camera.transform.rotationEuler = new Laya.Vector3(-66, 0, 0);
```

Leave these existing lines unchanged:

```ts
camera.orthographic = false;
camera.fieldOfView = 42;
camera.nearPlane = 0.3;
camera.farPlane = 1000;
camera.clearColor = this.colorFromHex(COLOR_WATER);
```

- [ ] **Step 2: Run the camera test to verify it passes**

Run:

```bash
node .temp/camera-angle.test.mjs
```

Expected: PASS with `camera angle tests passed`.

### Task 3: Record The Composition Change In Requirements

**Files:**
- Modify: `doc/output/requirements.md`

- [ ] **Step 1: Append the increment note**

Append this section after the existing camera/color increment notes:

```md
## 增量变更 v36

- 主相机从完整边缘优先的远景 `(0, 31, 11.5)` 调整为 B 方案板面优先构图 `(0, 22.4, 8.6)`，保持 `fieldOfView = 42` 与 `rotationEuler = (-66, 0, 0)`。
- 目标是压缩 HUD 与棋盘之间、棋盘下方的低信息水面区域，让 7x10 战场更早进入画面主体。
- 本轮不扩展玩法棋盘尺寸；若预览后仍有明显无效区域，再优先增加非玩法边缘方块或装饰填充，最后才考虑扩大实际网格。
```

- [ ] **Step 2: Run required checks**

Run:

```bash
node .temp/camera-angle.test.mjs
node .temp/hex-rules.test.mjs
npm run typecheck
```

Expected:

```text
camera angle tests passed
hex rules tests passed
TypeScript exits with code 0
```

### Task 4: Review Scope And Commit

**Files:**
- Review: `src/game/HexGameController.ts`
- Review: `.temp/camera-angle.test.mjs`
- Review: `doc/output/requirements.md`

- [ ] **Step 1: Review the diff**

Run:

```bash
git diff -- src/game/HexGameController.ts .temp/camera-angle.test.mjs doc/output/requirements.md
```

Expected: the diff contains only the camera target change, the matching camera test expectation change, and the v36 requirements note from this plan, aside from pre-existing unrelated edits already present before this task.

- [ ] **Step 2: Commit only the camera work**

Run:

```bash
git add -- src/game/HexGameController.ts .temp/camera-angle.test.mjs doc/output/requirements.md docs/superpowers/plans/2026-05-12-camera-composition.md
git commit -m "fix: tighten camera composition"
```

Expected: commit succeeds with only the camera implementation, test, requirements note, and plan file staged.
