# UI Asset Layout Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the confirmed reference-image UI layout in the Laya playable: board-first 9:16 composition, centered timer, right-side coin wallet, first-tap hand/highlight guidance, projected unlock costs, HP bars, and result-only CTA.

**Architecture:** Keep implementation scoped to `src/game/HexGameController.ts` plus source-level `.temp` regression coverage. Use the current scene nodes and existing asset paths; runtime code applies responsive 1080x1920-derived layout and creates idempotent overlay sprites.

**Tech Stack:** LayaAir 3.x TypeScript, source-level Node regression tests, existing `.temp/hex-rules.test.mjs`, `npm run typecheck`.

---

### Task 1: Regression Test For Reference Layout Hooks

**Files:**
- Create: `.temp/ui-reference-layout.test.mjs`
- Read: `src/game/HexGameController.ts`

- [ ] **Step 1: Write the failing test**

Create `.temp/ui-reference-layout.test.mjs` with assertions that require:

```javascript
import { readFileSync } from 'node:fs';

const source = readFileSync('src/game/HexGameController.ts', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const snippet of [
  'const DESIGN_WIDTH = 1080',
  'const DESIGN_HEIGHT = 1920',
  'private applyReferenceUiLayout(): void',
  'this.applyReferenceUiLayout()',
  'private styleTimerLabel(): void',
  'private styleCoinWallet(): void',
  'private setupFirstTapPrompt(): void',
  'FirstTapHighlight',
  'FirstTapHand',
  'private createHpBar',
  'private updateHpBars(): void',
  'this.updateHpBars()',
  'this.coinIconPath',
  'this.handIconPath',
  'this.ctaButton.visible = false',
  'this.ctaButton.visible = true',
]) {
  assert(source.includes(snippet), `missing source snippet: ${snippet}`);
}

assert(/this\\.hintLabel\\.text\\s*=\\s*"点击绿色地块进攻！"/.test(source), 'first prompt copy should match reference layout');
assert(source.includes('WalletCoinIcon'), 'coin wallet should use an image icon');
assert(source.includes('UnlockCostCoin_'), 'unlock costs should keep coin image markers');
assert(source.includes('HpBarFill'), 'HP bars should include fill sprites');
assert(source.includes('projectWorldToUi'), 'HP and cost overlays must project from world space');

console.log('ui reference layout tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .temp/ui-reference-layout.test.mjs`

Expected: FAIL on the first missing layout hook.

### Task 2: Runtime Layout Helpers And Asset Paths

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/ui-reference-layout.test.mjs`

- [ ] **Step 1: Add design basis constants and hand icon path**

Add near constants:

```typescript
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;
```

Add near UI asset properties:

```typescript
@property({ type: String }) public handIconPath: string = "downloads/2d/ui/hand.png";
```

- [ ] **Step 2: Add layout scale helpers**

Add helpers to convert design coordinates to runtime size:

```typescript
private getUiScaleX(): number {
    return (this.uiRoot.width || Laya.stage.width || DESIGN_WIDTH) / DESIGN_WIDTH;
}

private getUiScaleY(): number {
    return (this.uiRoot.height || Laya.stage.height || DESIGN_HEIGHT) / DESIGN_HEIGHT;
}

private setDesignRect(node: Laya.Sprite, x: number, y: number, width: number, height: number): void {
    const sx = this.getUiScaleX();
    const sy = this.getUiScaleY();
    node.x = x * sx;
    node.y = y * sy;
    node.width = width * sx;
    node.height = height * sy;
}
```

### Task 3: Reference HUD, Wallet, And First-Tap Prompt

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/ui-reference-layout.test.mjs`

- [ ] **Step 1: Call the layout setup during awake**

After `this.applyUiSkins();`, call:

```typescript
this.applyReferenceUiLayout();
```

- [ ] **Step 2: Implement layout setup**

Implement:

```typescript
private applyReferenceUiLayout(): void {
    this.styleTimerLabel();
    this.styleCoinWallet();
    this.styleHintLabel();
    this.styleCardPanel();
    this.styleResultPanel();
    this.styleCtaButton();
    this.setupFirstTapPrompt();
}
```

- [ ] **Step 3: Style timer and wallet**

Implement `styleTimerLabel()` as centered top timer. Implement `styleCoinWallet()` by turning `MoneyLabel` into a right-edge tab and adding a `WalletCoinIcon` child image using `coinIconPath`.

- [ ] **Step 4: Style first-tap prompt**

Set `hintLabel` to `点击绿色地块进攻！`, position it in the lower-middle board area, and create idempotent `FirstTapHighlight` and `FirstTapHand` sprites under `uiRoot`.

### Task 4: HP Bars And Overlay Refresh

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/ui-reference-layout.test.mjs`

- [ ] **Step 1: Add HP bar fields**

Add:

```typescript
private playerHpBar?: Laya.Sprite;
private enemyHpBar?: Laya.Sprite;
```

- [ ] **Step 2: Create HP bars idempotently**

Add `createHpBar(name: string)` with background, `HpBarFill`, and `HpBarText` children.

- [ ] **Step 3: Refresh HP bars**

Add `updateHpBars()` that positions bars by projecting `playerBase` and `enemyBase` world positions with `projectWorldToUi`, updates fill width from current HP, and hides bars before battle starts.

- [ ] **Step 4: Call overlay refresh**

Call `this.updateHpBars()` in `onAwake()`, `onUpdate()`, `startBattleFromTile()`, `activateInitialBase()`, and `finishGame()` where appropriate.

### Task 5: First-Tap Overlay Visibility And CTA Rules

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/ui-reference-layout.test.mjs`

- [ ] **Step 1: Add first-tap overlay visibility helper**

Add `setFirstTapPromptVisible(visible: boolean)` to toggle `FirstTapHighlight`, `FirstTapHand`, and the reference prompt.

- [ ] **Step 2: Hide first-tap overlay once battle starts**

Call it with `false` in `startBattleFromTile()` and when showing cards after the first claim.

- [ ] **Step 3: Preserve result-only CTA**

Keep `ctaButton.visible = false` on awake and show it only in `finishGame()`.

### Task 6: Verification

**Files:**
- Verify: `.temp/ui-reference-layout.test.mjs`
- Verify: `.temp/hex-rules.test.mjs`
- Verify: `src/game/HexGameController.ts`

- [ ] **Step 1: Run focused regression**

Run: `node .temp/ui-reference-layout.test.mjs`

Expected: `ui reference layout tests passed`

- [ ] **Step 2: Run rule regression**

Run: `node .temp/hex-rules.test.mjs`

Expected: `hex rules tests passed`

- [ ] **Step 3: Run TypeScript check**

Run: `npm run typecheck`

Expected: exit code 0.
