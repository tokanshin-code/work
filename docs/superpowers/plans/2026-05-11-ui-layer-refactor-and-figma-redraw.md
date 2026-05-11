# UI Layer Refactor And Figma Redraw Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the playable UI into explicit layers and redraw the target 9:16 UI in Figma.

**Architecture:** `HexGameController` will own a small `UiLayers` object and a `UiMode` state. Existing Laya nodes are reparented into HUD, world overlay, guide, modal, and result layers, then `setUiMode()` controls visibility at flow transitions.

**Tech Stack:** LayaAir TypeScript, source-level `.temp/*.test.mjs` tests, Figma MCP Plugin API.

---

### Task 1: Lock UI Layer Contract

**Files:**
- Create: `.temp/ui-layer-refactor.test.mjs`
- Modify: none

- [ ] **Step 1: Write the failing test**

```js
import { readFileSync } from "node:fs";

const source = readFileSync("src/game/HexGameController.ts", "utf8");
const snippets = [
  "interface UiLayers",
  "type UiMode = \"tutorial\" | \"battle\" | \"cardChoice\" | \"result\"",
  "private uiLayers?: UiLayers",
  "private uiMode: UiMode = \"tutorial\"",
  "this.setupUiLayers()",
  "private setupUiLayers(): void",
  "private getOrCreateUiLayer(name: string, index: number): Laya.Sprite",
  "private setUiMode(mode: UiMode): void",
  "this.uiLayers.hud.visible = mode !== \"result\"",
  "this.uiLayers.worldOverlay.visible = mode === \"tutorial\" || mode === \"battle\"",
  "this.uiLayers.guide.visible = mode === \"tutorial\"",
  "this.uiLayers.modal.visible = mode === \"cardChoice\"",
  "this.uiLayers.result.visible = mode === \"result\"",
  "this.setUiMode(\"tutorial\")",
  "this.setUiMode(\"battle\")",
  "this.setUiMode(\"cardChoice\")",
  "this.setUiMode(\"result\")",
  "const parent = this.uiLayers?.worldOverlay ?? this.uiRoot",
  "const parent = this.uiLayers?.guide ?? this.uiRoot",
  "const parent = this.uiLayers?.hud ?? this.uiRoot",
  "const parent = this.uiLayers?.modal ?? this.uiRoot",
  "const parent = this.uiLayers?.result ?? this.uiRoot",
];

const missing = snippets.filter((snippet) => !source.includes(snippet));
if (missing.length) {
  console.error(`Missing UI layer snippets:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("ui layer refactor tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .temp/ui-layer-refactor.test.mjs`

Expected: FAIL listing missing layer snippets.

### Task 2: Implement Runtime UI Layers

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/ui-layer-refactor.test.mjs`

- [ ] **Step 1: Add `UiMode`, `UiLayers`, and setup methods**

Add:

```ts
type UiMode = "tutorial" | "battle" | "cardChoice" | "result";

interface UiLayers {
    hud: Laya.Sprite;
    worldOverlay: Laya.Sprite;
    guide: Laya.Sprite;
    modal: Laya.Sprite;
    result: Laya.Sprite;
}
```

Then add `setupUiLayers()`, `getOrCreateUiLayer()`, and `setUiMode()`.

- [ ] **Step 2: Reparent existing UI nodes**

Move timer and wallet to HUD, HP/cost overlays to world overlay, first-tap prompt and hint to guide, card panel to modal, result panel and CTA to result.

- [ ] **Step 3: Wire state transitions**

Call `setUiMode("tutorial")` on awake, `"battle"` after battle starts and card pick, `"cardChoice"` in `showCards()`, and `"result"` in `finishGame()`.

- [ ] **Step 4: Verify layer test passes**

Run: `node .temp/ui-layer-refactor.test.mjs`

Expected: PASS.

### Task 3: Preserve Existing UI And Rule Tests

**Files:**
- Modify: `src/game/HexGameController.ts` only if tests expose missing wiring

- [ ] **Step 1: Run current source-level UI tests**

Run:

```powershell
node .temp/card-option-ui.test.mjs
node .temp/ui-reference-layout.test.mjs
node .temp/hex-visual-interaction-fixes.test.mjs
node .temp/assetized-visual-types.test.mjs
```

Expected: all PASS.

- [ ] **Step 2: Run rules and typecheck**

Run:

```powershell
node .temp/hex-rules.test.mjs
npm.cmd run typecheck
```

Expected: all PASS.

### Task 4: Create Figma Redraw

**Files:**
- External: Figma file `占城大师 UI Layer Redraw`

- [ ] **Step 1: Create Figma file**

Use the user-selected Figma team/organization key.

- [ ] **Step 2: Draw two frames**

Create `Gameplay - Layered UI` and `Card Choice - Modal State`, both `1080 x 1920`.

- [ ] **Step 3: Validate visual hierarchy**

Confirm Figma contains named sections matching runtime layers:

```text
HUD Layer
World Overlay Layer
Guide Layer
Modal Layer
Result Layer
```

Expected: card-choice frame hides board overlays and uses a clean bottom modal.
