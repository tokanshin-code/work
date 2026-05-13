# Candidate Building Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the runtime card-pick loop with direct on-board building candidates.

**Architecture:** Keep the existing hex grid, building, unit, income, enemy, and victory systems. Add a small candidate state map keyed by tile coordinates; opening click builds a fixed spear barracks, then candidate icons are created around live player buildings and clicked directly to unlock and build.

**Tech Stack:** LayaAir TypeScript, source-level `.temp/*.test.mjs` checks, `npm run typecheck`.

---

### Task 1: Source Tests For Candidate Flow

**Files:**
- Modify: `.temp/opening-card-unlock-flow.test.mjs`
- Modify: `.temp/card-trigger-source.test.mjs`
- Modify: `.temp/gameplay-rules-source.test.mjs`
- Modify: `.temp/building-unit-logic-source.test.mjs`
- Modify: `.temp/building-wall-unlock-source.test.mjs`

- [ ] **Step 1: Write failing tests**

Replace card-opening assertions with source assertions for:

```javascript
assert.doesNotMatch(openingChoiceBody, /this\.showCards\(\)/, "opening no longer opens cards");
assert.match(openingChoiceBody, /this\.setFirstTapPromptVisible\(true\)/, "opening keeps the first tap prompt");
assert.match(stageClickBody, /this\.buildOpeningBarracks\(tile\)/, "first board click builds the fixed opening barracks");
assert.match(stageClickBody, /this\.getCandidateForTile\(tile\)/, "later board clicks resolve an on-board candidate");
assert.match(stageClickBody, /this\.unlockCandidateTile\(candidate\)/, "candidate click unlocks and builds directly");
assert.doesNotMatch(stageClickBody, /this\.showCards\(\)/, "candidate clicks do not open cards");
```

Add candidate-system assertions:

```javascript
assert.match(source, /private readonly candidateBuildingKinds: BuildingKind\[\] = \["tower", "goldMine", "spearBarracks", "archerBarracks", "cavalryBarracks"\]/, "candidate pool uses existing building kinds only");
assert.match(source, /private readonly unlockCandidates: Map<string, BuildCandidate> = new Map\(\)/, "candidate state is stored per tile");
assert.match(source, /this\.unlockCandidates\.has\(key\)/, "old candidates are preserved and not overwritten");
assert.match(source, /Math\.random\(\)/, "new candidate contents refresh randomly");
assert.match(source, /return this\.hexCost \* 4/, "mid-distance candidates cost 100 when hexCost is 25");
assert.match(source, /return this\.hexCost \* 10/, "far candidates cost 250 when hexCost is 25");
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
node .temp/opening-card-unlock-flow.test.mjs
node .temp/card-trigger-source.test.mjs
node .temp/gameplay-rules-source.test.mjs
node .temp/building-unit-logic-source.test.mjs
node .temp/building-wall-unlock-source.test.mjs
```

Expected: at least the opening/card-flow assertions fail because the current runtime still calls `showCards()`.

### Task 2: Direct Opening Build

**Files:**
- Modify: `src/game/HexGameController.ts`
- Modify: `assets/Scene.ls`

- [ ] **Step 1: Implement fixed opening click**

Change defaults:

```typescript
@property({ type: Number }) public initialMoney: number = 100;
@property({ type: Number }) public incomeInterval: number = 2;
```

Update `assets/Scene.ls` script overrides:

```json
"initialMoney": 100,
"incomeInterval": 2
```

Make `showOpeningBuildChoice()` only prepare the first click:

```typescript
private showOpeningBuildChoice(): void {
    const tile = this.tiles.find((item) => item.col === OPENING_TILE_COL && item.row === OPENING_TILE_ROW) ?? null;
    this.unlockCostFocusTile = tile;
    this.clearUnlockCostLabels();
    if (this.defaultClickableTileMarker) this.defaultClickableTileMarker.active = true;
    this.setFirstTapPromptVisible(true);
    this.setUiMode("tutorial");
    this.hintLabel.text = "Tap the opening tile to build";
}
```

Add `buildOpeningBarracks(tile)`:

```typescript
private buildOpeningBarracks(tile: HexTileState): void {
    if (tile.col !== OPENING_TILE_COL || tile.row !== OPENING_TILE_ROW) return;
    const position = this.hexToWorld(tile.col, tile.row);
    const building = this.createBuildingMarker(position, "spearBarracks", "player", this.initialBuildSlot);
    this.startBattleAfterOpeningBuild(position);
    if (building) this.createUnlockCandidatesAroundBuilding(building);
    this.updateUnlockCostLabels();
    this.refreshHud();
}
```

- [ ] **Step 2: Run opening tests**

Run:

```powershell
node .temp/opening-card-unlock-flow.test.mjs
node .temp/card-trigger-source.test.mjs
```

Expected: opening assertions pass after Task 2, candidate click assertions may still fail until Task 3.

### Task 3: Candidate State And Direct Build

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add candidate model and helpers**

Add:

```typescript
private readonly candidateBuildingKinds: BuildingKind[] = ["tower", "goldMine", "spearBarracks", "archerBarracks", "cavalryBarracks"];
private readonly unlockCandidates: Map<string, BuildCandidate> = new Map();
```

Add:

```typescript
interface BuildCandidate {
    col: number;
    row: number;
    kind: BuildingKind;
    cost: number;
}
```

Implement helpers:

```typescript
private getCandidateForTile(tile: HexTileState): BuildCandidate | null {
    return this.unlockCandidates.get(this.key(tile.col, tile.row)) ?? null;
}

private createUnlockCandidatesAroundBuilding(building: SpawnBuilding): void {
    const centerTile = this.tiles.find((tile) => tile.col === building.tileCol && tile.row === building.tileRow);
    if (!centerTile) return;
    for (const tile of this.tiles) {
        if (!isAdjacent(centerTile.col, centerTile.row, tile.col, tile.row)) continue;
        if (!this.canCreateCandidateOnTile(tile)) continue;
        const key = this.key(tile.col, tile.row);
        if (this.unlockCandidates.has(key)) continue;
        this.unlockCandidates.set(key, {
            col: tile.col,
            row: tile.row,
            kind: this.pickRandomCandidateKind(tile),
            cost: this.getCandidateUnlockCost(tile)
        });
    }
}
```

- [ ] **Step 2: Replace paid click flow**

Change `onStageClick()` so:

```typescript
if (!this.gameStarted) {
    if (tile.col === OPENING_TILE_COL && tile.row === OPENING_TILE_ROW) this.buildOpeningBarracks(tile);
    return;
}
const candidate = this.getCandidateForTile(tile);
if (!candidate) return;
if (this.money < candidate.cost) return;
this.unlockCandidateTile(candidate);
```

Implement:

```typescript
private unlockCandidateTile(candidate: BuildCandidate): void {
    this.money -= candidate.cost;
    this.unlockCandidates.delete(this.key(candidate.col, candidate.row));
    this.tiles = claimTile(this.tiles, candidate.col, candidate.row);
    this.updateTileVisual(candidate.col, candidate.row, true);
    const building = this.createBuildingMarker(this.hexToWorld(candidate.col, candidate.row), candidate.kind, "player");
    if (building) this.createUnlockCandidatesAroundBuilding(building);
    this.updateUnlockCostLabels();
    this.refreshHud();
}
```

- [ ] **Step 3: Run candidate tests**

Run:

```powershell
node .temp/opening-card-unlock-flow.test.mjs
node .temp/gameplay-rules-source.test.mjs
node .temp/building-unit-logic-source.test.mjs
node .temp/building-wall-unlock-source.test.mjs
```

Expected: pass.

### Task 4: Candidate Icon UI

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Render building symbol plus price**

Replace cost-only label rendering with `createUnlockCostItem(candidate)`:

```typescript
private createUnlockCostItem(candidate: BuildCandidate): Laya.Sprite {
    const tile = this.tiles.find((item) => item.col === candidate.col && item.row === candidate.row);
    if (!tile) return new Laya.Sprite();
    const item = new Laya.Sprite();
    this.drawCandidateBuildingIcon(item, candidate.kind);
    item.addChild(new Laya.Image(this.coinIconPath));
    const label = new Laya.Label();
    label.text = `${candidate.cost}`;
    item.addChild(label);
    return item;
}
```

Use primitive `graphics` drawing in `drawCandidateBuildingIcon()` so no new image assets are required.

- [ ] **Step 2: Run UI source tests**

Run:

```powershell
node .temp/opening-card-unlock-flow.test.mjs
node .temp/hex-visual-interaction-fixes.test.mjs
```

Expected: pass and still find coin/icon-based unlock UI.

### Task 5: Final Verification

**Files:**
- No code files modified in this task.

- [ ] **Step 1: Run required checks**

Run:

```powershell
node .temp/hex-rules.test.mjs
npm run typecheck
```

Expected: both exit 0.

- [ ] **Step 2: Inspect scoped diff**

Run:

```powershell
git diff -- src/game/HexGameController.ts assets/Scene.ls .temp/opening-card-unlock-flow.test.mjs .temp/card-trigger-source.test.mjs .temp/gameplay-rules-source.test.mjs .temp/building-unit-logic-source.test.mjs .temp/building-wall-unlock-source.test.mjs docs/superpowers/plans/2026-05-13-candidate-building-flow.md
```

Expected: only candidate-flow, initial money, income interval, and related tests changed.
