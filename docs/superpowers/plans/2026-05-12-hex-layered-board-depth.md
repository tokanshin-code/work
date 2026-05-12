# Hex Layered Board Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtle per-row height offsets to the hex board so tiles are not all on the same spatial plane while preserving click logic and model/UI alignment.

**Architecture:** Keep each tile horizontal and preserve the existing hex X/Z layout. Add a small row-based Y offset helper, then route tile, base, building, unit, prompt, cost label, and progress-bar placement through helper methods so visual objects stay attached to their tile height.

**Tech Stack:** LayaAir 3.3 TypeScript, source-level `.temp/*.test.mjs` regression tests, runtime preview screenshot.

---

### Task 1: Add Failing Test For Layered Board Depth

**Files:**
- Modify: `.temp/hex-visual-layout.test.mjs`
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Write the failing test**

Add assertions to `.temp/hex-visual-layout.test.mjs`:

```js
const rowElevationStep = numberConst("HEX_ROW_ELEVATION_STEP");
assert.equal(rowElevationStep, 0.045, "hex rows use subtle height offsets for 2.5D depth");
assert.match(source, /private\s+getTileElevation\(row:\s*number\):\s*number/, "tile elevation helper exists");
assert.match(source, /return new Laya\.Vector3\(x, this\.getTileElevation\(row\), z\)/, "hexToWorld includes row elevation");
assert.match(source, /private\s+getTileSurfaceY\(position:\s*Laya\.Vector3\):\s*number/, "tile surface helper keeps models and UI aligned to tile height");
assert.match(source, /this\.getTileSurfaceY\(position\) \+ 0\.04/, "buildings use tile-relative surface height");
assert.match(source, /this\.getTileSurfaceY\(worldPos\) \+ 0\.2/, "unlock cost labels project from tile-relative height");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ".temp/hex-visual-layout.test.mjs"`

Expected: FAIL because `HEX_ROW_ELEVATION_STEP` and helper methods do not exist.

- [ ] **Step 3: Implement minimal code**

In `src/game/HexGameController.ts`, add:

```ts
const HEX_ROW_ELEVATION_STEP = 0.045;
```

Add helpers near `hexToWorld`:

```ts
private getTileElevation(row: number): number {
    return (4.5 - row) * HEX_ROW_ELEVATION_STEP;
}

private getTileSurfaceY(position: Laya.Vector3): number {
    return position.y + GROUND_SURFACE_Y;
}

private getModelBaseY(position: Laya.Vector3): number {
    return this.getTileSurfaceY(position) + 0.04;
}
```

Update `hexToWorld`:

```ts
return new Laya.Vector3(x, this.getTileElevation(row), z);
```

- [ ] **Step 4: Route object heights through helpers**

Update relevant placements in `src/game/HexGameController.ts`:

```ts
base.transform.position = new Laya.Vector3(tilePos.x, this.getModelBaseY(tilePos), tilePos.z);
tileVisual.transform.localPosition = new Laya.Vector3(0, -this.getModelBaseY(base.transform.position), 0);
node.transform.position = new Laya.Vector3(position.x, this.getModelBaseY(position), position.z);
return new Laya.Vector3(position.x + dirX / len * UNIT_SPAWN_FORWARD_OFFSET, this.getModelBaseY(position) + UNIT_VISUAL_Y_OFFSET, position.z + dirZ / len * UNIT_SPAWN_FORWARD_OFFSET);
```

Update UI projection heights:

```ts
this.projectWorldToUi(new Laya.Vector3(worldPos.x, this.getTileSurfaceY(worldPos) + 0.24, worldPos.z));
this.projectWorldToUi(new Laya.Vector3(worldPos.x, this.getTileSurfaceY(worldPos) + 0.2, worldPos.z));
this.projectWorldToUi(new Laya.Vector3(position.x, this.getTileSurfaceY(position) + 0.2, position.z));
```

- [ ] **Step 5: Run verification**

Run:

```bash
node ".temp/hex-visual-layout.test.mjs" && npm run typecheck
```

Expected: both pass.

### Task 2: Preview And Document

**Files:**
- Modify: `doc/output/requirements.md`
- Modify: `.opencode/workflow-state.md`
- Modify: `MEMORY.md`

- [ ] **Step 1: Run full checks**

Run:

```bash
node ".temp/hex-visual-layout.test.mjs" && node ".temp/hex-rules.test.mjs" && node ".temp/opening-card-unlock-flow.test.mjs" && npm run typecheck
```

Expected: all pass.

- [ ] **Step 2: Validate scene**

Use Laya scene validation on `assets/Scene.ls`.

Expected: scene asset validation succeeds.

- [ ] **Step 3: Capture preview**

Run editor preview and save screenshot to `.temp/screenshots/hex-layered-board-depth.png`.

Expected: hex tiles show subtle row-depth layering without breaking model/UI alignment.

- [ ] **Step 4: Update documentation**

Append a new incremental note to `doc/output/requirements.md`, append workflow row to `.opencode/workflow-state.md`, and add a MEMORY note with the row elevation constants and helper usage.
