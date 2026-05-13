# Soldier Building Tile Blocking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make soldiers spawn on adjacent non-building tiles and prevent them from entering live building tiles until those buildings are destroyed.

**Architecture:** Keep the current lightweight direct-movement combat model. Add local helpers to `HexGameController` for standable tile checks, adjacent spawn selection, and building approach targets; do not add full pathfinding.

**Tech Stack:** LayaAir 3.3.6, TypeScript, existing `.temp/*.test.mjs` source regression tests, `npm run typecheck`.

---

## File Structure

- Modify: `src/game/HexGameController.ts`
  - Add helper methods near existing tile/building helpers.
  - Change `updateBuildingSpawns()` to pass the source `SpawnBuilding` to unit spawning.
  - Change `spawnUnit()` and movement target selection to avoid live building tiles.
- Create: `.temp/soldier-building-tile-blocking-source.test.mjs`
  - Source-level regression checks for the new helper names and critical logic strings.
- Modify: `doc/output/requirements.md`
  - Add an increment describing the soldier spawn/movement blocking rule.
- Modify: `MEMORY.md`
  - Add a reminder that live building tiles are unit blockers.
- Modify: `.opencode/workflow-state.md`
  - Add an iteration row after verification.

## Task 1: Regression Test

**Files:**
- Create: `.temp/soldier-building-tile-blocking-source.test.mjs`

- [ ] **Step 1: Write the failing source regression test**

```javascript
import fs from "node:fs";

const source = fs.readFileSync("src/game/HexGameController.ts", "utf8");

const checks = [
  ["spawn units from building context", "this.spawnUnit(building.team, building.position, building.unitKind!, building)"],
  ["spawnUnit accepts source building", "private spawnUnit(team: Team, position: Laya.Vector3, kind: UnitKind, sourceBuilding?: SpawnBuilding): void"],
  ["standable tile helper", "private isStandableUnitTile(tile: HexTileState): boolean"],
  ["live building blocks tile", "!this.hasBuildingOnTile(tile)"],
  ["adjacent spawn tile helper", "private findUnitSpawnTile(sourceBuilding: SpawnBuilding, team: Team): HexTileState | null"],
  ["building approach tile helper", "private findApproachTileForBuilding(unit: BattleUnit, building: SpawnBuilding): HexTileState | null"],
  ["movement target avoids live building centers", "const moveTarget = this.getUnitMoveTarget(unit)"],
  ["fallback preserves production", "this.createUnitSpawnPosition(team, position)"],
  ["destroyed buildings become passable through live check", "this.getBuildingCurrentHp(building) > 0 && !building.node.destroyed"],
];

for (const [label, needle] of checks) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

console.log("soldier-building-tile-blocking source checks passed");
```

- [ ] **Step 2: Run test and verify it fails before implementation**

Run: `node .temp/soldier-building-tile-blocking-source.test.mjs`

Expected: FAIL with a missing helper or signature string.

## Task 2: Spawn On Adjacent Standable Tile

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add standable and neighbor helpers**

Add these methods near `hasBuildingOnTile()`:

```typescript
    private isStandableUnitTile(tile: HexTileState): boolean {
        return tile.kind !== "void" && tile.kind !== "water" && !this.hasBuildingOnTile(tile);
    }

    private getAdjacentStandableTiles(centerTile: HexTileState): HexTileState[] {
        return this.tiles.filter((tile) => isAdjacent(centerTile.col, centerTile.row, tile.col, tile.row) && this.isStandableUnitTile(tile));
    }

    private findUnitSpawnTile(sourceBuilding: SpawnBuilding, team: Team): HexTileState | null {
        const sourceTile = this.tiles.find((tile) => tile.col === sourceBuilding.tileCol && tile.row === sourceBuilding.tileRow) ?? this.findNearestTileByWorld(sourceBuilding.position);
        if (!sourceTile) return null;
        const target = team === "player" ? this.enemyBase.transform.position : this.playerBase.transform.position;
        const candidates = this.getAdjacentStandableTiles(sourceTile);
        candidates.sort((a, b) => Laya.Vector3.distance(this.hexToWorld(a.col, a.row), target) - Laya.Vector3.distance(this.hexToWorld(b.col, b.row), target));
        return candidates[0] ?? null;
    }
```

- [ ] **Step 2: Pass source building into unit spawns**

Change unit production in `updateBuildingSpawns()` from:

```typescript
                if (building.category === "unit") this.spawnUnit(building.team, building.position, building.unitKind!);
```

to:

```typescript
                if (building.category === "unit") this.spawnUnit(building.team, building.position, building.unitKind!, building);
```

Change the initial base spawn in `activateInitialBase()` from:

```typescript
        if (this.getBuildingCategory(kind) === "unit") this.spawnUnit(team, base.transform.position, "spear");
```

to:

```typescript
        const sourceBuilding = this.buildings[this.buildings.length - 1];
        if (this.getBuildingCategory(kind) === "unit") this.spawnUnit(team, base.transform.position, "spear", sourceBuilding);
```

- [ ] **Step 3: Update `spawnUnit()` signature and spawn position**

Change:

```typescript
    private spawnUnit(team: Team, position: Laya.Vector3, kind: UnitKind): void {
        const node = new Laya.Sprite3D(`${team}_${kind}_${this.units.length}`);
        const spawnPosition = this.createUnitSpawnPosition(team, position);
```

to:

```typescript
    private spawnUnit(team: Team, position: Laya.Vector3, kind: UnitKind, sourceBuilding?: SpawnBuilding): void {
        const node = new Laya.Sprite3D(`${team}_${kind}_${this.units.length}`);
        const spawnTile = sourceBuilding ? this.findUnitSpawnTile(sourceBuilding, team) : null;
        const spawnPosition = spawnTile ? this.getUnitPositionOnTile(spawnTile) : this.createUnitSpawnPosition(team, position);
```

Add this helper near `createUnitSpawnPosition()`:

```typescript
    private getUnitPositionOnTile(tile: HexTileState): Laya.Vector3 {
        const position = this.hexToWorld(tile.col, tile.row);
        return new Laya.Vector3(position.x, this.getModelBaseY(position) + UNIT_VISUAL_Y_OFFSET, position.z);
    }
```

- [ ] **Step 4: Run regression test**

Run: `node .temp/soldier-building-tile-blocking-source.test.mjs`

Expected: Still FAIL until movement helpers are added.

## Task 3: Prevent Movement Into Live Building Tiles

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add building approach and movement target helpers**

Add these methods near `findUnitTarget()`:

```typescript
    private getUnitMoveTarget(unit: BattleUnit): Laya.Vector3 {
        const buildingTarget = this.findNearestOpponentBuilding(unit.team, unit.node.transform.position);
        if (buildingTarget) {
            const approachTile = this.findApproachTileForBuilding(unit, buildingTarget);
            if (approachTile) return this.getUnitPositionOnTile(approachTile);
        }
        const basePosition = unit.team === "player" ? this.enemyBase.transform.position : this.playerBase.transform.position;
        const baseTile = this.findNearestTileByWorld(basePosition);
        if (baseTile && this.hasBuildingOnTile(baseTile)) {
            const baseBuilding = this.findNearestOpponentBuilding(unit.team, basePosition, 0.8);
            if (baseBuilding) {
                const approachTile = this.findApproachTileForBuilding(unit, baseBuilding);
                if (approachTile) return this.getUnitPositionOnTile(approachTile);
            }
        }
        return basePosition;
    }

    private findApproachTileForBuilding(unit: BattleUnit, building: SpawnBuilding): HexTileState | null {
        const buildingTile = this.tiles.find((tile) => tile.col === building.tileCol && tile.row === building.tileRow) ?? this.findNearestTileByWorld(building.position);
        if (!buildingTile) return null;
        const candidates = this.getAdjacentStandableTiles(buildingTile);
        const unitPosition = unit.node.transform.position;
        candidates.sort((a, b) => Laya.Vector3.distance(this.hexToWorld(a.col, a.row), unitPosition) - Laya.Vector3.distance(this.hexToWorld(b.col, b.row), unitPosition));
        return candidates[0] ?? null;
    }
```

- [ ] **Step 2: Use movement target helper in `updateUnits()`**

Change:

```typescript
            const basePosition = unit.team === "player" ? this.enemyBase.transform.position : this.playerBase.transform.position;
            this.moveToward(unit.node, basePosition, unit.speed * dt);
```

to:

```typescript
            const moveTarget = this.getUnitMoveTarget(unit);
            this.moveToward(unit.node, moveTarget, unit.speed * dt);
```

- [ ] **Step 3: Run source regression**

Run: `node .temp/soldier-building-tile-blocking-source.test.mjs`

Expected: PASS and prints `soldier-building-tile-blocking source checks passed`.

## Task 4: Documentation And Verification

**Files:**
- Modify: `doc/output/requirements.md`
- Modify: `.opencode/workflow-state.md`
- Modify: `MEMORY.md`

- [ ] **Step 1: Update requirements**

Append this section to `doc/output/requirements.md`:

```markdown
## 增量变更 v42

- 士兵生成位置改为产兵建筑相邻的可站立地块，不再直接生成在建筑所在地块上。
- 存活建筑所在地块视为阻挡地块，士兵不能直接进入；士兵会停在建筑相邻可站立地块并攻击建筑。
- 建筑被摧毁并从建筑列表移除后，其地块恢复为普通可站立地块，后续士兵可以进入。
```

- [ ] **Step 2: Update memory**

Append this bullet to `MEMORY.md`:

```markdown
- 士兵与建筑占格规则：存活建筑所在地块是 unit blocker。产兵时优先把士兵放到产兵建筑相邻的非水/非 void/无建筑地块；攻击建筑时先移动到目标建筑相邻可站立地块，建筑销毁并从 `buildings` 移除后该地块才可进入。当前仍是轻量直线移动，不做完整 BFS 寻路。
```

- [ ] **Step 3: Update workflow state**

Append this row to `.opencode/workflow-state.md`:

```markdown
| v42 | 2026-05-12 | 优化士兵生成与建筑阻挡：士兵生成到相邻非建筑地块，存活建筑地块阻挡移动，摧毁后恢复可进入 | `src/game/HexGameController.ts`, `.temp/soldier-building-tile-blocking-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
```

- [ ] **Step 4: Full verification**

Run:

```bash
node .temp/soldier-building-tile-blocking-source.test.mjs && npm run typecheck
```

Expected: Source test prints pass message and TypeScript exits 0.

Then run the existing gameplay source checks that touch movement/combat if time allows:

```bash
node .temp/enemy-ai-damage-feedback-source.test.mjs && node .temp/tile-painting-source.test.mjs && node .temp/building-unit-logic-source.test.mjs
```

Expected: All print their pass messages.

Do not commit unless the user explicitly asks for a commit.
