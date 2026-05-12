# Enemy AI and Damage Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clear building damage feedback and enemy AI territory/army growth.

**Architecture:** Extend `HexGameController` with focused helpers for target priority, building damage feedback, and enemy expansion. Keep existing scene structure and data models; add only small state fields and source-level regression tests.

**Tech Stack:** LayaAir 3.x, TypeScript, existing `.temp/*.mjs` regression scripts.

---

## File Structure

- Modify: `src/game/HexGameController.ts` — combat targeting, building damage, hit feedback, enemy expansion timers, enemy AI building placement.
- Modify: `.temp/unit-visibility-source.test.mjs` — regression checks for targeting priority, building hit feedback, and enemy expansion.
- Verify: `assets/Scene.ls` — validate unchanged scene asset after code compile.

### Task 1: Add Regression Coverage

**Files:**
- Modify: `.temp/unit-visibility-source.test.mjs`

- [ ] **Step 1: Add failing source checks**

Add these snippets to `requiredSnippets`:

```js
'private findUnitTarget(unit: BattleUnit): BattleTarget | null',
'private findNearestOpponentBuilding(team: Team, position: Laya.Vector3, maxRange: number = Number.MAX_VALUE): SpawnBuilding | null',
'private damageBuilding(building: SpawnBuilding, damage: number): void',
'private playBuildingHitFeedback(building: SpawnBuilding): void',
'private updateEnemyAi(dt: number): void',
'private claimEnemyTile(tile: HexTileState): void',
'private maybeCreateEnemyExpansionBuilding(tile: HexTileState): void',
'type BattleTarget = BattleUnit | SpawnBuilding',
'this.updateEnemyAi(dt);',
'this.damageBuilding(target, unit.damage);',
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .temp/unit-visibility-source.test.mjs`

Expected: FAIL with a missing snippet such as `private findUnitTarget`.

### Task 2: Implement Target Priority and Building Damage

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add battle target type**

Near the existing type aliases, add:

```ts
type BattleTarget = BattleUnit | SpawnBuilding;
```

- [ ] **Step 2: Replace direct unit target selection**

In `updateUnits(dt)`, replace the current opponent/base targeting block with logic that calls `findUnitTarget(unit)`. If the target is a `BattleUnit`, subtract `unit.damage`. If it is a `SpawnBuilding`, call `damageBuilding(target, unit.damage)`.

- [ ] **Step 3: Add target helpers**

Add helper methods inside `HexGameController`:

```ts
private findUnitTarget(unit: BattleUnit): BattleTarget | null {
    const unitTarget = this.findNearestOpponentUnit(unit.team, unit.node.transform.position, unit.range);
    if (unitTarget) return unitTarget;
    const buildingTarget = this.findNearestOpponentBuilding(unit.team, unit.node.transform.position, unit.range);
    if (buildingTarget) return buildingTarget;
    return this.findNearestOpponentBuilding(unit.team, unit.node.transform.position, 1.1);
}

private findNearestOpponentBuilding(team: Team, position: Laya.Vector3, maxRange: number = Number.MAX_VALUE): SpawnBuilding | null {
    let best: SpawnBuilding | null = null;
    let bestDistance = Number.MAX_VALUE;
    for (const building of this.buildings) {
        if (building.team === team || this.getBuildingCurrentHp(building) <= 0 || building.node.destroyed) continue;
        const distance = Laya.Vector3.distance(position, building.node.transform.position);
        if (distance <= maxRange && distance < bestDistance) {
            bestDistance = distance;
            best = building;
        }
    }
    return best;
}
```

- [ ] **Step 4: Add building damage and feedback hooks**

Add:

```ts
private damageBuilding(building: SpawnBuilding, damage: number): void {
    if (building.node === this.playerBase) this.playerBaseHp = Math.max(0, this.playerBaseHp - damage);
    else if (building.node === this.enemyBase) this.enemyBaseHp = Math.max(0, this.enemyBaseHp - damage);
    else building.hp = Math.max(0, building.hp - damage);
    this.playBuildingHitFeedback(building);
    this.playHitSound();
}
```

- [ ] **Step 5: Run test and typecheck**

Run: `node .temp/unit-visibility-source.test.mjs && npm run typecheck`

Expected: test still fails only for feedback/AI snippets until later tasks; typecheck should pass after this task.

### Task 3: Add Building Flash and Shake Feedback

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Implement feedback method**

Add:

```ts
private playBuildingHitFeedback(building: SpawnBuilding): void {
    const node = building.node;
    if (node.destroyed) return;
    const originalPosition = node.transform.position.clone();
    const originalScale = node.transform.localScale.clone();
    node.transform.localScale = new Laya.Vector3(originalScale.x * 1.06, originalScale.y * 1.06, originalScale.z * 1.06);
    node.transform.position = new Laya.Vector3(originalPosition.x + 0.05, originalPosition.y, originalPosition.z - 0.05);
    Laya.timer.once(80, this, () => {
        if (node.destroyed) return;
        node.transform.localScale = originalScale;
        node.transform.position = originalPosition;
    });
}
```

- [ ] **Step 2: Run test and typecheck**

Run: `node .temp/unit-visibility-source.test.mjs && npm run typecheck`

Expected: feedback snippets pass; AI snippets may still fail.

### Task 4: Implement Enemy Expansion AI

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add AI state fields**

Near existing private fields add:

```ts
private enemyAiTimer: number = 0;
private enemyExpansionCount: number = 0;
```

Near constants add:

```ts
const ENEMY_EXPANSION_INTERVAL = 5;
const ENEMY_BUILDING_EVERY_EXPANSIONS = 2;
```

- [ ] **Step 2: Call AI from update loop**

In `onUpdate`, after income update and before spawns, add:

```ts
this.updateEnemyAi(dt);
```

- [ ] **Step 3: Add expansion selection and claim helpers**

Add:

```ts
private updateEnemyAi(dt: number): void {
    if (!this.gameStarted || this.pausedForCards || this.finished) return;
    this.enemyAiTimer += dt;
    if (this.enemyAiTimer < ENEMY_EXPANSION_INTERVAL) return;
    this.enemyAiTimer = 0;
    const tile = this.pickEnemyExpansionTile();
    if (!tile) return;
    this.claimEnemyTile(tile);
    this.maybeCreateEnemyExpansionBuilding(tile);
}

private pickEnemyExpansionTile(): HexTileState | null {
    const candidates = this.tiles.filter((tile) => {
        if (tile.owner !== "neutral" || tile.kind === "void" || tile.kind === "water") return false;
        return this.tiles.some((owned) => owned.owner === "enemy" && isAdjacent(owned.col, owned.row, tile.col, tile.row));
    });
    candidates.sort((a, b) => b.row - a.row || Math.abs(a.col - OPENING_TILE_COL) - Math.abs(b.col - OPENING_TILE_COL));
    return candidates[0] ?? null;
}

private claimEnemyTile(tile: HexTileState): void {
    this.tiles = this.tiles.map((item) => item.col === tile.col && item.row === tile.row ? { ...item, owner: "enemy" as const } : item);
    this.updateTileVisual(tile.col, tile.row);
    this.enemyExpansionCount++;
}
```

- [ ] **Step 4: Add enemy building placement**

Add:

```ts
private maybeCreateEnemyExpansionBuilding(tile: HexTileState): void {
    if (this.enemyExpansionCount % ENEMY_BUILDING_EVERY_EXPANSIONS !== 0) return;
    const kind = this.chooseEnemyOpeningBuilding();
    this.createBuildingMarker(this.hexToWorld(tile.col, tile.row), kind, "enemy");
}
```

- [ ] **Step 5: Run test and typecheck**

Run: `node .temp/unit-visibility-source.test.mjs && npm run typecheck`

Expected: PASS.

### Task 5: Verify In Editor Preview

**Files:**
- Runtime only

- [ ] **Step 1: Refresh assets**

Run MCP asset busy wait with 30000 ms timeout.

- [ ] **Step 2: Start preview and open battle**

Use Runtime preview, click opening highlighted tile, select a unit card, wait at least 8 seconds.

- [ ] **Step 3: Capture screenshot**

Save screenshot to `.temp/screenshots/enemy_ai_damage_feedback.png`.

Expected: enemy has expanded at least once after enough time, enemy building/unit pressure is visible, player building bars are green, enemy bars are red, no duplicate base bars overlap.

- [ ] **Step 4: Check logs**

Get runtime console logs.

Expected: no `level: 3` errors. Existing asset dependency warnings are acceptable if gameplay remains visible.

### Task 6: Update Memory and Workflow State

**Files:**
- Modify: `MEMORY.md`
- Modify: `.opencode/workflow-state.md`

- [ ] **Step 1: Record implementation notes**

Add notes that unit targeting uses soldiers-first/buildings-second priority, building damage feedback is blood-bar plus short transform shake, and enemy AI expands from enemy-owned neighbors toward larger row values.

- [ ] **Step 2: Record workflow row**

Add a new iteration row describing enemy AI expansion and building damage feedback.

- [ ] **Step 3: Final verification**

Run: `node .temp/unit-visibility-source.test.mjs && node .temp/card-panel-ui.test.mjs && npm run typecheck`

Expected: PASS.

---

## Self-Review

- Spec coverage: target priority, building feedback, enemy expansion, and enemy building growth are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: helper names and types match planned snippets.
