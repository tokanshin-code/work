# Result Panel Figma Vector Redraw Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redraw the game result panel as a flat Figma-style vector UI while keeping title, description, and CTA text single-line and replaceable.

**Architecture:** Implement the panel as runtime-created vector layers in `HexGameController`, using `Laya.Sprite.graphics` for Figma-like flat shapes and existing `Laya.Label` / `Laya.Button` nodes for text and interaction. Add lightweight source tests that guard against text being baked into artwork and verify single-line text configuration.

**Tech Stack:** LayaAir 3.3.6, TypeScript, Laya 2D Sprite graphics, existing shell-based `.temp/*.test.mjs` source tests, `npm run typecheck`.

---

## File Structure

- Modify: `src/game/HexGameController.ts`
  - Add constants for result-panel node names and colors near existing UI constants.
  - Expand `styleResultPanel()` to build layered vector art using runtime sprites.
  - Add helper methods for result vector drawing and single-line label setup.
  - Update `finishGame()` to apply victory/failure accent colors without changing CTA click behavior.
- Create: `.temp/result-panel-vector-ui.test.mjs`
  - Source-level regression checks for vector layer creation, single-line text rules, no baked Chinese result text in vector drawing helpers, and state-specific accent refresh.
- Modify: `doc/output/requirements.md`
  - Append an incremental change section describing the result panel redraw and single-line replaceable text rule.
- Modify: `.opencode/workflow-state.md`
  - Append an iteration record for the result panel redraw.
- Modify: `MEMORY.md`
  - Record the result panel rule: text remains runtime labels and should not be baked into vector assets.

---

### Task 1: Add Failing Source Test

**Files:**
- Create: `.temp/result-panel-vector-ui.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `.temp/result-panel-vector-ui.test.mjs` with this exact content:

```javascript
import { readFileSync } from "node:fs";

const source = readFileSync("src/game/HexGameController.ts", "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(source.includes("RESULT_PANEL_ART_LAYER"), "missing named result panel art layer constant");
assert(source.includes("RESULT_PANEL_BADGE_LAYER"), "missing named result panel badge layer constant");
assert(source.includes("RESULT_PANEL_HEX_STRIP_LAYER"), "missing named result panel hex strip layer constant");
assert(source.includes("RESULT_PANEL_CTA_ART_LAYER"), "missing named result panel CTA art layer constant");
assert(source.includes("private drawResultPanelArt(victory: boolean"), "missing state-aware result art drawing helper");
assert(source.includes("private configureSingleLineResultLabel"), "missing single-line result label helper");
assert(source.includes("wordWrap = false"), "result labels must disable word wrap");
assert(source.includes("overflow = Laya.Text.HIDDEN"), "result labels must hide overflow instead of wrapping");
assert(source.includes("this.resultCtaButton.label ="), "result CTA label must remain runtime-replaceable");
assert(source.includes("drawResultHexTile"), "result panel must include hex tile decoration drawing");

const drawHelperMatch = source.match(/private drawResultPanelArt\(victory: boolean\): void \{[\s\S]*?\n    \}/);
assert(drawHelperMatch, "could not isolate drawResultPanelArt helper");
const drawHelper = drawHelperMatch[0];
assert(!drawHelper.includes("领地守住了"), "victory title must not be baked into vector art");
assert(!drawHelper.includes("敌军压境"), "failure title must not be baked into vector art");
assert(!drawHelper.includes("完整版"), "description text must not be baked into vector art");
assert(!drawHelper.includes("立即下载"), "CTA text must not be baked into vector art");

console.log("result panel vector UI source checks passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node .temp/result-panel-vector-ui.test.mjs
```

Expected: FAIL with `missing named result panel art layer constant` because the vector result panel implementation has not been added yet.

---

### Task 2: Implement Runtime Vector Result Panel

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add result panel constants**

Insert these constants after the existing color constants near `COLOR_VOID_TILE`:

```typescript
const RESULT_PANEL_ART_LAYER = "ResultPanelVectorArt";
const RESULT_PANEL_BADGE_LAYER = "ResultPanelBadge";
const RESULT_PANEL_HEX_STRIP_LAYER = "ResultPanelHexStrip";
const RESULT_PANEL_CTA_ART_LAYER = "ResultPanelCtaArt";
const RESULT_PANEL_DARK = "#123F55";
const RESULT_PANEL_SHADOW = "#0A2B3B";
const RESULT_PANEL_CREAM = "#FFF7D6";
const RESULT_PANEL_GOLD = "#FFCF3D";
const RESULT_PANEL_ORANGE = "#FF7A1A";
const RESULT_PANEL_GREEN = "#82E03A";
const RESULT_PANEL_RED = "#FF3333";
```

- [ ] **Step 2: Replace `styleResultPanel()` with vector layout setup**

Replace the current `styleResultPanel()` method with:

```typescript
    private styleResultPanel(): void {
        const parent = this.uiLayers?.result ?? this.uiRoot;
        if (this.resultPanel.parent !== parent) parent.addChild(this.resultPanel);
        if (this.ctaButton.parent !== parent) parent.addChild(this.ctaButton);
        this.setDesignRect(this.resultPanel, 80, 590, 920, 650);
        this.resultPanel.mouseEnabled = true;

        const legacySkin = this.resultPanel.getChildByName("ResultPanelSkin") as Laya.Image | null;
        if (legacySkin) legacySkin.visible = false;
        const sample = this.resultPanel.getChildByName("ResultPanelAssetSample") as Laya.Sprite | null;
        if (sample) sample.visible = false;

        this.configureSingleLineResultLabel(this.resultTitle, 120, 212, 680, 78, 58, "#123F55", 0, "#123F55");
        this.configureSingleLineResultLabel(this.resultText, 130, 302, 660, 54, 32, "#D98720", 0, "#D98720");
        this.setDesignRect(this.resultCtaButton, 220, 480, 480, 126);
        this.resultCtaButton.stateNum = 2;
        this.resultCtaButton.skin = "";
        this.resultCtaButton.label = "立即下载";
        this.resultCtaButton.labelSize = this.scaleFont(46);
        this.resultCtaButton.labelBold = true;
        this.resultCtaButton.labelColors = "#FFFFFF,#FFFFFF,#FFFFFF";
        this.resultCtaButton.labelStroke = 6;
        this.resultCtaButton.labelStrokeColor = "#123F55";
        this.resultCtaButton.sizeGrid = "0,0,0,0";

        const art = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_ART_LAYER);
        this.resultPanel.setChildIndex(art, 0);
        this.drawResultPanelArt(true);
        this.resultPanel.setChildIndex(this.resultTitle, Math.min(this.resultPanel.numChildren - 1, this.resultPanel.getChildIndex(art) + 3));
        this.resultPanel.setChildIndex(this.resultText, Math.min(this.resultPanel.numChildren - 1, this.resultPanel.getChildIndex(this.resultTitle) + 1));
        this.resultPanel.setChildIndex(this.resultCtaButton, this.resultPanel.numChildren - 1);
    }
```

- [ ] **Step 3: Add helper methods after `styleResultPanel()`**

Insert these methods immediately after `styleResultPanel()`:

```typescript
    private configureSingleLineResultLabel(label: Laya.Label, x: number, y: number, width: number, height: number, fontSize: number, color: string, stroke: number, strokeColor: string): void {
        if (label.parent !== this.resultPanel) this.resultPanel.addChild(label);
        this.setDesignRect(label, x, y, width, height);
        label.fontSize = this.scaleFont(fontSize);
        label.bold = true;
        label.align = "center";
        label.valign = "middle";
        label.color = color;
        label.stroke = stroke;
        label.strokeColor = strokeColor;
        label.wordWrap = false;
        label.overflow = Laya.Text.HIDDEN;
        label.mouseEnabled = false;
    }

    private drawResultPanelArt(victory: boolean): void {
        const accent = victory ? RESULT_PANEL_GREEN : RESULT_PANEL_RED;
        const ctaColor = victory ? RESULT_PANEL_ORANGE : RESULT_PANEL_GREEN;
        const badgeColor = victory ? RESULT_PANEL_GOLD : "#FF8A2A";
        const art = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_ART_LAYER);
        art.width = this.resultPanel.width;
        art.height = this.resultPanel.height;
        art.graphics.clear();
        art.graphics.drawCircle(-68 * this.getUiScaleX(), 80 * this.getUiScaleY(), 130 * Math.min(this.getUiScaleX(), this.getUiScaleY()), "rgba(139,229,255,0.62)");
        art.graphics.drawCircle(890 * this.getUiScaleX(), 210 * this.getUiScaleY(), 112 * Math.min(this.getUiScaleX(), this.getUiScaleY()), victory ? "rgba(130,224,58,0.72)" : "rgba(255,51,51,0.62)");
        art.graphics.drawRect(72 * this.getUiScaleX(), 96 * this.getUiScaleY(), 776 * this.getUiScaleX(), 398 * this.getUiScaleY(), RESULT_PANEL_SHADOW);
        art.graphics.drawRect(72 * this.getUiScaleX(), 72 * this.getUiScaleY(), 776 * this.getUiScaleX(), 398 * this.getUiScaleY(), RESULT_PANEL_DARK);
        art.graphics.drawRect(86 * this.getUiScaleX(), 86 * this.getUiScaleY(), 748 * this.getUiScaleX(), 370 * this.getUiScaleY(), RESULT_PANEL_CREAM);

        const badge = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_BADGE_LAYER);
        badge.width = this.resultPanel.width;
        badge.height = this.resultPanel.height;
        badge.graphics.clear();
        badge.graphics.drawCircle(460 * this.getUiScaleX(), 72 * this.getUiScaleY(), 92 * Math.min(this.getUiScaleX(), this.getUiScaleY()), RESULT_PANEL_DARK);
        badge.graphics.drawCircle(460 * this.getUiScaleX(), 72 * this.getUiScaleY(), 78 * Math.min(this.getUiScaleX(), this.getUiScaleY()), badgeColor);
        this.drawResultHexTile(badge, 460 * this.getUiScaleX(), 72 * this.getUiScaleY(), 38 * Math.min(this.getUiScaleX(), this.getUiScaleY()), accent, RESULT_PANEL_DARK, 5 * Math.min(this.getUiScaleX(), this.getUiScaleY()));

        const hexStrip = this.getOrCreateSprite(this.resultPanel, RESULT_PANEL_HEX_STRIP_LAYER);
        hexStrip.width = this.resultPanel.width;
        hexStrip.height = this.resultPanel.height;
        hexStrip.graphics.clear();
        this.drawResultHexTile(hexStrip, 342 * this.getUiScaleX(), 410 * this.getUiScaleY(), 42 * Math.min(this.getUiScaleX(), this.getUiScaleY()), RESULT_PANEL_GREEN, RESULT_PANEL_DARK, 4 * Math.min(this.getUiScaleX(), this.getUiScaleY()));
        this.drawResultHexTile(hexStrip, 460 * this.getUiScaleX(), 410 * this.getUiScaleY(), 42 * Math.min(this.getUiScaleX(), this.getUiScaleY()), COLOR_NEUTRAL_TILE, RESULT_PANEL_DARK, 4 * Math.min(this.getUiScaleX(), this.getUiScaleY()));
        this.drawResultHexTile(hexStrip, 578 * this.getUiScaleX(), 410 * this.getUiScaleY(), 42 * Math.min(this.getUiScaleX(), this.getUiScaleY()), RESULT_PANEL_RED, RESULT_PANEL_DARK, 4 * Math.min(this.getUiScaleX(), this.getUiScaleY()));

        const ctaArt = this.getOrCreateSprite(this.resultCtaButton, RESULT_PANEL_CTA_ART_LAYER);
        ctaArt.width = this.resultCtaButton.width;
        ctaArt.height = this.resultCtaButton.height;
        ctaArt.graphics.clear();
        ctaArt.graphics.drawRect(0, 10 * this.getUiScaleY(), this.resultCtaButton.width, this.resultCtaButton.height - 10 * this.getUiScaleY(), victory ? "#9D3C10" : "#3C8E1E");
        ctaArt.graphics.drawRect(0, 0, this.resultCtaButton.width, this.resultCtaButton.height - 10 * this.getUiScaleY(), RESULT_PANEL_DARK);
        ctaArt.graphics.drawRect(10 * this.getUiScaleX(), 10 * this.getUiScaleY(), this.resultCtaButton.width - 20 * this.getUiScaleX(), this.resultCtaButton.height - 30 * this.getUiScaleY(), ctaColor);
        this.resultCtaButton.setChildIndex(ctaArt, 0);
    }

    private drawResultHexTile(target: Laya.Sprite, centerX: number, centerY: number, radius: number, fillColor: string, lineColor: string, lineWidth: number): void {
        const points: number[] = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 6 + i * Math.PI / 3;
            points.push(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        }
        target.graphics.drawPoly(0, 0, points, fillColor, lineColor, lineWidth);
    }
```

- [ ] **Step 4: Refresh art state in `finishGame()`**

In `finishGame(victory: boolean)`, insert this line after `this.setUiMode("result");`:

```typescript
        this.drawResultPanelArt(victory);
```

Keep existing title and description assignments unchanged so copy remains replaceable.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node .temp/result-panel-vector-ui.test.mjs
```

Expected: PASS with `result panel vector UI source checks passed`.

---

### Task 3: Validate Compile and Scene Integrity

**Files:**
- Test only: `src/game/HexGameController.ts`
- Validate: `assets/Scene.ls`

- [ ] **Step 1: Run TypeScript compile**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 2: Wait for Laya asset refresh**

Use the LayaAir asset refresh wait with `timeoutMs` set to `30000`.

Expected: asset refresh completes without compile/import errors.

- [ ] **Step 3: Validate scene file**

Validate `assets/Scene.ls` using the LayaAir scene validation tool.

Expected: validation succeeds. No direct scene edits are required for this implementation, but validation catches existing schema breakage before completion.

- [ ] **Step 4: Run relevant existing tests**

Run:

```bash
node .temp/card-panel-ui.test.mjs && node .temp/ui-reference-layout.test.mjs
```

Expected: PASS. These tests guard against accidental regressions in nearby UI layout code.

---

### Task 4: Update Project Documentation

**Files:**
- Modify: `doc/output/requirements.md`
- Modify: `.opencode/workflow-state.md`
- Modify: `MEMORY.md`

- [ ] **Step 1: Append requirements increment**

Append this section to `doc/output/requirements.md`:

```markdown

## 增量变更 v33

- 结束面板重绘为 Figma 风格扁平矢量 UI：奶油色粗描边弹窗、顶部六边形徽章、领地地块装饰和大号 CTA 按钮。
- 结束面板标题、描述和 CTA 文案保持为 Laya 文本节点，不烘焙进矢量图，便于后续替换。
- 结束面板描述文本固定单行显示，不换行；过长文案优先缩小字号或安全截断，避免撑破面板。
```

- [ ] **Step 2: Append workflow iteration record**

Append this row to the iteration table in `.opencode/workflow-state.md`:

```markdown
| v33 | 2026-05-12 | 将结束面板重绘为六边形领地徽章风格的扁平矢量 UI，并保持标题、描述、CTA 文案单行可替换 | `src/game/HexGameController.ts`, `.temp/result-panel-vector-ui.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
```

- [ ] **Step 3: Append memory note**

Append this note to `MEMORY.md`:

```markdown
- 结束面板采用运行时矢量绘制的“六边形领地徽章”风格：`ResultTitle`、`ResultText` 和 `ResultCTAButton` 文案必须保留为 Laya 文本节点，禁止烘焙进 SVG/PNG；描述文本单行显示，不换行，后续换文案只改文本字段。
```

- [ ] **Step 4: Re-run source test after docs updates**

Run:

```bash
node .temp/result-panel-vector-ui.test.mjs
```

Expected: PASS.

---

### Task 5: Final Verification

**Files:**
- Verify all changed files from Tasks 1-4.

- [ ] **Step 1: Run full verification commands**

Run:

```bash
node .temp/result-panel-vector-ui.test.mjs && node .temp/card-panel-ui.test.mjs && node .temp/ui-reference-layout.test.mjs && npm run typecheck
```

Expected: all tests pass and TypeScript reports no errors.

- [ ] **Step 2: Check working tree**

Run:

```bash
git status --short
```

Expected: changed files include the intended implementation, test, docs, and memory files. Do not revert unrelated existing user changes.

- [ ] **Step 3: Preview if available**

If the Laya runtime preview tool is available, run current scene preview, trigger or inspect result mode, and save screenshots under `.temp/screenshots/`.

Expected visual result: cream card, top medal badge with hex tile, hex strip decoration, and large CTA button; title/description/CTA text are rendered by text nodes and remain single-line.

---

## Self-Review

- Spec coverage: The plan covers the approved A visual direction, single-line replaceable text, runtime state accents, Laya integration, and validation.
- Placeholder scan: No TBD/TODO placeholders remain; each command and code change is explicit.
- Type consistency: Helper names used in tests match planned TypeScript methods and constants.
