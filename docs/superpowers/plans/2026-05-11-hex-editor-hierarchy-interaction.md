# Hex Editor Hierarchy Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the editor-friendly opening flow with bounded models, stronger lighting, default clickable tile, card-driven initial building placement, and adjacent unlock cost labels.

**Architecture:** Add persistent scene nodes for marker, initial build slot, and cost label layer using an incremental game.json. Keep gameplay state in `src/game/HexGameController.ts`, with small helper methods for scale caps, opening tile state, cost label drawing, and lighting setup.

**Tech Stack:** LayaAir 3.3.6, TypeScript, Laya scene JSON edited via scaffold/MCP workflow, source-level Node tests in `.temp`.

---

## File Structure

- Create: `doc/output/hex-editor-hierarchy.game.json` - incremental scene command file that adds persistent hierarchy nodes.
- Modify: `assets/Scene.ls` - updated by scaffold execution only, not direct file writes.
- Modify: `src/game/HexGameController.ts` - gameplay and presentation logic.
- Modify: `doc/output/requirements.md` - append one incremental change section.
- Modify: `.opencode/workflow-state.md` - append iteration record.
- Modify: `MEMORY.md` - record implementation notes.
- Create: `.temp/editor-hierarchy-flow.test.mjs` - source assertions for new behavior.

---

### Task 1: Add Persistent Editor Hierarchy Nodes

**Files:**
- Create: `doc/output/hex-editor-hierarchy.game.json`
- Modify: `assets/Scene.ls`

- [ ] **Step 1: Write the incremental game.json**

Create `doc/output/hex-editor-hierarchy.game.json` with:

```json
{
  "commands": [
    { "cmd": "createNode", "parent": "HexBoard", "name": "DefaultClickableTileMarker", "type": "Sprite3D", "position": [0, 0.28, 0] },
    { "cmd": "createNode", "parent": "Buildings", "name": "InitialBuildSlot", "type": "Sprite3D", "position": [0, 0, 0] },
    { "cmd": "createNode", "parent": "GameUIRoot", "name": "UnlockCostLayer", "type": "Box", "props": { "x": 0, "y": 0, "width": 1080, "height": 1920, "visible": true } },
    { "cmd": "waitAssetBusy" }
  ],
  "scripts": {}
}
```

- [ ] **Step 2: Execute the scaffold command**

Run:

```bash
node C:/Users/TU/AppData/Local/Temp/opencode-sca-119476/skills/game-scaffold/scripts/execute.mjs --input=doc/output/hex-editor-hierarchy.game.json --scene=assets/Scene.ls
```

Expected: command completes, saves `assets/Scene.ls`, and reports scene validation success.

- [ ] **Step 3: Validate scene asset**

Run Laya asset validation for `assets/Scene.ls`.

Expected: validation succeeds.

---

### Task 2: Write Failing Source Tests

**Files:**
- Create: `.temp/editor-hierarchy-flow.test.mjs`

- [ ] **Step 1: Create source-level tests**

Create `.temp/editor-hierarchy-flow.test.mjs` with assertions that fail before implementation:

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/game/HexGameController.ts", "utf8");
const scene = fs.readFileSync("assets/Scene.ls", "utf8");

assert.match(scene, /DefaultClickableTileMarker/, "scene exposes default clickable tile marker");
assert.match(scene, /InitialBuildSlot/, "scene exposes initial building slot");
assert.match(scene, /UnlockCostLayer/, "scene exposes unlock cost UI layer");

assert.match(source, /OPENING_TILE_COL\s*=\s*3/, "opening tile column is fixed at 3");
assert.match(source, /OPENING_TILE_ROW\s*=\s*7/, "opening tile row is fixed at 7");
assert.match(source, /private pendingInitialBuildPosition/, "first card choice stores initial build position");
assert.match(source, /this\.pendingInitialBuildPosition/, "card selection uses stored initial build position");
assert.match(source, /InitialBuildSlot/, "controller uses editor initial build slot");
assert.match(source, /DefaultClickableTileMarker/, "controller uses editor default tile marker");
assert.match(source, /UnlockCostLayer/, "controller uses editor unlock cost layer");
assert.match(source, /MODEL_TILE_SCALE_CAP/, "model scale cap keeps visuals inside one tile");
assert.match(source, /Math\.min\(MODEL_TILE_SCALE_CAP/, "prefab scales are clamped");
assert.match(source, /#FF3B30/, "insufficient unlock cost uses red text");
assert.match(source, /setupLighting/, "runtime strengthens lighting setup");

console.log("editor hierarchy flow source tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .temp/editor-hierarchy-flow.test.mjs
```

Expected: FAIL on one or more missing source patterns.

---

### Task 3: Implement Controller Logic

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add constants and scene properties**

Add opening tile constants, model scale cap, and optional properties for `DefaultClickableTileMarker`, `InitialBuildSlot`, and `UnlockCostLayer`.

- [ ] **Step 2: Add lighting setup**

Call `setupLighting()` during `onAwake()` after `setupCamera()`. The method sets scene ambient color and directional light intensity/color when available.

- [ ] **Step 3: Add editor node lookup fallbacks**

Implement helpers that find existing nodes by name and create fallback nodes only if absent.

- [ ] **Step 4: Add opening marker and cost labels**

Position the marker at `(3,7)`, draw a simple ring/column highlight inside the tile, and render adjacent unlock costs on `UnlockCostLayer`.

- [ ] **Step 5: Route first card selection to initial slot**

Store `pendingInitialBuildPosition` when the first tile is clicked. `applyCard()` uses that position for the immediate card result, then clears it.

- [ ] **Step 6: Clamp model scale**

Wrap all prefab scale vectors with a clamp helper so no axis exceeds `MODEL_TILE_SCALE_CAP`.

---

### Task 4: Verify Tests and Compilation

**Files:**
- Test: `.temp/editor-hierarchy-flow.test.mjs`
- Test: existing `.temp/*.test.mjs`

- [ ] **Step 1: Run targeted test**

Run:

```bash
node .temp/editor-hierarchy-flow.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run existing source/rule tests**

Run:

```bash
node .temp/hex-rules.test.mjs && node .temp/start-flow-source.test.mjs && node .temp/model-visibility-source.test.mjs
```

Expected: all PASS.

- [ ] **Step 3: Run TypeScript compilation**

Run the repository TypeScript no-emit command used by the project.

Expected: no TypeScript errors.

- [ ] **Step 4: Wait for Laya asset refresh and validate scene**

Run asset busy wait and validate `assets/Scene.ls`.

Expected: wait succeeds and scene validates.

---

### Task 5: Update Documentation and Memory

**Files:**
- Modify: `doc/output/requirements.md`
- Modify: `.opencode/workflow-state.md`
- Modify: `MEMORY.md`

- [ ] **Step 1: Append requirements increment**

Append a new section documenting bounded model scale, stronger lighting, fixed opening tile, card-driven initial building placement, and adjacent red/normal unlock costs.

- [ ] **Step 2: Append workflow record**

Add one iteration row listing `assets/Scene.ls`, `src/game/HexGameController.ts`, `.temp/editor-hierarchy-flow.test.mjs`, and docs.

- [ ] **Step 3: Append memory notes**

Record that persistent editor nodes back the opening marker, initial build slot, and unlock cost labels.

---

## Self-Review

- Spec coverage: all requested points map to Tasks 1-5.
- Placeholder scan: no deferred implementation placeholders remain.
- Type consistency: names are fixed as `DefaultClickableTileMarker`, `InitialBuildSlot`, `UnlockCostLayer`, `OPENING_TILE_COL`, `OPENING_TILE_ROW`, and `MODEL_TILE_SCALE_CAP`.
