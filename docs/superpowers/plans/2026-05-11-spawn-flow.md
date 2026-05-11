# Spawn Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start the battle only after the first tile click creates both sides' initial buildings, and show circular per-building spawn cooldown progress.

**Architecture:** Keep this as a focused incremental iteration in `src/game/HexGameController.ts`. Add a pure cooldown helper in `src/data/SpawnCooldown.ts` so the new timing behavior can be tested without Laya runtime, then wire the helper into runtime building state and 2D progress indicators.

**Tech Stack:** LayaAir 3.3.6, TypeScript, Node `.mjs` regression tests, existing `tsc --noEmit` compile check.

---

## File Structure

- Create `src/data/SpawnCooldown.ts`: pure helpers for spawn cooldown ticking and first-start gating tests.
- Create `.temp/spawn-cooldown.test.mjs`: Node regression tests using TypeScript transpilation, following `.temp/hex-rules.test.mjs` style.
- Modify `src/game/HexGameController.ts`: add waiting state, first-click start flow, per-building cooldown, progress indicator drawing, cleanup.
- Modify `doc/output/requirements.md`: append an incremental change section describing this iteration.
- Modify `.opencode/workflow-state.md`: append iteration record after implementation and verification.
- Modify `MEMORY.md`: record the spawn cooldown architecture and any Laya drawing notes.

---

### Task 1: Pure Spawn Cooldown Rules

**Files:**
- Create: `src/data/SpawnCooldown.ts`
- Create: `.temp/spawn-cooldown.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `.temp/spawn-cooldown.test.mjs` with this content:

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "../library/packages/com.layabox.layaidea/node_modules/typescript/lib/typescript.js";

const sourcePath = path.resolve("src/data/SpawnCooldown.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 }
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
const cooldown = await import(moduleUrl);

let state = cooldown.createSpawnCooldown(3);
let result = cooldown.tickSpawnCooldown(state, 1, false);
assert.equal(result.spawnCount, 0, "waiting state blocks spawn progress");
assert.equal(result.state.progress, 0, "waiting state leaves progress unchanged");

state = cooldown.createSpawnCooldown(3);
result = cooldown.tickSpawnCooldown(state, 1.5, true);
assert.equal(result.spawnCount, 0, "half cooldown does not spawn");
assert.equal(result.state.progress, 0.5, "half cooldown reaches 50 percent");

result = cooldown.tickSpawnCooldown(result.state, 1.5, true);
assert.equal(result.spawnCount, 1, "full cooldown spawns exactly one unit");
assert.equal(result.state.progress, 0, "full cooldown resets to empty circle");

result = cooldown.tickSpawnCooldown(result.state, 6.25, true);
assert.equal(result.spawnCount, 2, "large delta can emit multiple completed cycles");
assert.equal(Math.round(result.state.progress * 1000), 83, "leftover progress is preserved after multi-spawn tick");

console.log("spawn cooldown tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .temp/spawn-cooldown.test.mjs`

Expected: failure because `src/data/SpawnCooldown.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/data/SpawnCooldown.ts` with this content:

```typescript
export interface SpawnCooldownState {
    duration: number;
    progress: number;
}

export interface SpawnCooldownTickResult {
    state: SpawnCooldownState;
    spawnCount: number;
}

export function createSpawnCooldown(duration: number): SpawnCooldownState {
    return { duration: Math.max(0.001, duration), progress: 0 };
}

export function tickSpawnCooldown(state: SpawnCooldownState, dt: number, running: boolean): SpawnCooldownTickResult {
    if (!running || dt <= 0) {
        return { state: { ...state }, spawnCount: 0 };
    }
    const rawProgress = state.progress + dt / Math.max(0.001, state.duration);
    const spawnCount = Math.floor(rawProgress);
    return {
        state: { duration: state.duration, progress: rawProgress - spawnCount },
        spawnCount
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node .temp/spawn-cooldown.test.mjs`

Expected: `spawn cooldown tests passed`.

---

### Task 2: First-Click Start Gate

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add imports and state fields**

In `src/game/HexGameController.ts`, change imports and private fields as follows:

```typescript
import { GameEvents } from "../data/GameEvents";
import { HexTileState, calculateIncome, canClaimTile, claimTile, createInitialHexGrid } from "../data/HexRules";
import { SpawnCooldownState, createSpawnCooldown, tickSpawnCooldown } from "../data/SpawnCooldown";
```

Add these fields near the existing timer fields:

```typescript
    private gameStarted: boolean = false;
```

Remove these fields because global base timers will be replaced by per-building cooldowns:

```typescript
    private playerSpawnTimer: number = 0;
    private enemySpawnTimer: number = 0;
```

- [ ] **Step 2: Initialize waiting hint**

At the end of `onAwake`, after `this.bindUi();`, set the starting hint before music:

```typescript
        this.hintLabel.text = "点击方块建造据点，开始战斗";
```

- [ ] **Step 3: Gate the update loop**

In `onUpdate`, after `if (this.finished || this.pausedForCards) return;`, add:

```typescript
        if (!this.gameStarted) {
            this.refreshHud();
            return;
        }
```

Then remove the global spawn timer increments and spawn blocks:

```typescript
        this.playerSpawnTimer += dt;
        this.enemySpawnTimer += dt;
```

and

```typescript
        if (this.playerSpawnTimer >= this.spawnRate) {
            this.playerSpawnTimer = 0;
            this.spawnUnit("player", this.hexToWorld(3, 8), false);
            for (const building of this.buildings) this.spawnUnit("player", building.position, building.kind === "dragon");
        }
        if (this.enemySpawnTimer >= this.spawnRate) {
            this.enemySpawnTimer = 0;
            this.spawnUnit("enemy", this.hexToWorld(3, 1), this.remainingTime < this.timerCount - 24);
        }
```

- [ ] **Step 4: Add first-click start method**

Add this method before `showCards()`:

```typescript
    private startBattleFromTile(tile: HexTileState): void {
        this.gameStarted = true;
        const playerPosition = this.hexToWorld(tile.col, tile.row);
        this.createBuildingMarker(playerPosition, "barracks", "player");
        this.createBuildingMarker(this.hexToWorld(3, 1), "barracks", "enemy");
        this.hintLabel.text = "据点已建成，士兵正在集结！";
    }
```

- [ ] **Step 5: Call the first-click start method**

In `onStageClick`, after updating tile visual and before `this.refreshHud();`, replace the hint assignment block with:

```typescript
        if (!this.gameStarted) {
            this.startBattleFromTile(tile);
        } else {
            this.hintLabel.text = "继续扩张，抵挡敌军！";
        }
```

- [ ] **Step 6: Compile after the gate change**

Run: `npx tsc --noEmit`

Expected: compile errors about `createBuildingMarker` argument count, because Task 3 has not updated building signatures yet. This is the expected intermediate failure.

---

### Task 3: Per-Building Spawn Cooldowns

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Expand building types**

Replace the type definitions at the bottom with:

```typescript
type Team = "player" | "enemy";
type BuildingKind = "tower" | "barracks" | "dragon";

interface BattleUnit {
    team: Team;
    node: Laya.Sprite3D;
    hp: number;
    damage: number;
    speed: number;
    attackCooldown: number;
}

interface SpawnBuilding {
    kind: BuildingKind;
    team: Team;
    position: Laya.Vector3;
    cooldown: SpawnCooldownState;
    progressSprite: Laya.Sprite;
}
```

- [ ] **Step 2: Update building creation signature**

Replace `createBuildingMarker` with:

```typescript
    private createBuildingMarker(position: Laya.Vector3, kind: BuildingKind, team: Team = "player"): void {
        const node = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(BUILDING_FOOTPRINT, kind === "tower" ? 0.95 : 0.56, BUILDING_FOOTPRINT), `${team}_${kind}_${this.buildings.length}`);
        const color = team === "enemy" ? "#FF3333" : kind === "dragon" ? "#FF6600" : kind === "tower" ? "#F8D34C" : "#82E03A";
        node.meshRenderer.sharedMaterial = this.createMaterial(color);
        node.transform.position = new Laya.Vector3(position.x, kind === "tower" ? 0.64 : 0.42, position.z);
        this.buildingsRoot.addChild(node);
        const progressSprite = this.createSpawnProgressSprite(node.transform.position, team);
        this.buildings.push({ kind, team, position: node.transform.position.clone(), cooldown: createSpawnCooldown(this.spawnRate), progressSprite });
        if (kind === "tower" && team === "player") this.enemyBaseHp -= 8;
    }
```

- [ ] **Step 3: Update card building calls**

In `applyCard`, keep the existing `createBuildingMarker` calls for player cards. They now use the default `team = "player"` and compile without changes:

```typescript
            this.createBuildingMarker(position, "dragon");
            this.createBuildingMarker(position, "barracks");
            this.createBuildingMarker(position, "tower");
```

- [ ] **Step 4: Add building spawn updater**

Add this method before `updateUnits(dt: number)`:

```typescript
    private updateBuildingSpawns(dt: number): void {
        for (const building of this.buildings) {
            const result = tickSpawnCooldown(building.cooldown, dt, this.gameStarted && !this.pausedForCards && !this.finished);
            building.cooldown = result.state;
            for (let i = 0; i < result.spawnCount; i++) {
                const strong = building.kind === "dragon" || (building.team === "enemy" && this.remainingTime < this.timerCount - 24);
                this.spawnUnit(building.team, building.position, strong);
            }
            this.drawSpawnProgress(building);
        }
    }
```

- [ ] **Step 5: Call building spawn updater**

In `onUpdate`, after card timer handling and before `this.updateUnits(dt);`, add:

```typescript
        this.updateBuildingSpawns(dt);
```

- [ ] **Step 6: Compile after cooldown wiring**

Run: `npx tsc --noEmit`

Expected: compile errors about missing `createSpawnProgressSprite` and `drawSpawnProgress`, because Task 4 adds visuals.

---

### Task 4: Circular Progress Indicators

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] **Step 1: Add progress sprite factory**

Add this method before `createBuildingMarker`:

```typescript
    private createSpawnProgressSprite(position: Laya.Vector3, team: Team): Laya.Sprite {
        const sprite = new Laya.Sprite();
        sprite.name = `${team}_SpawnProgress_${this.buildings.length}`;
        sprite.mouseEnabled = false;
        this.uiRoot.addChild(sprite);
        this.positionProgressSprite(sprite, position);
        return sprite;
    }
```

- [ ] **Step 2: Add progress sprite positioning**

Add this method after `worldZToDebugLabelY`:

```typescript
    private positionProgressSprite(sprite: Laya.Sprite, position: Laya.Vector3): void {
        sprite.x = this.worldXToDebugLabelX(position.x);
        sprite.y = this.worldZToDebugLabelY(position.z) - 38;
    }
```

- [ ] **Step 3: Add circular drawing method**

Add this method after `positionProgressSprite`:

```typescript
    private drawSpawnProgress(building: SpawnBuilding): void {
        const sprite = building.progressSprite;
        this.positionProgressSprite(sprite, building.position);
        sprite.graphics.clear();
        const radius = 22;
        const fillColor = building.team === "player" ? "#E9FF7A" : "#FFB0A8";
        sprite.graphics.drawCircle(0, 0, radius, "rgba(0,0,0,0.35)");
        sprite.graphics.drawPie(0, 0, radius - 4, -90, -90 + building.cooldown.progress * 360, fillColor);
        sprite.graphics.drawCircle(0, 0, radius - 11, "rgba(22,181,240,0.85)");
    }
```

- [ ] **Step 4: Clean up progress sprites**

In `onDestroy`, before `Laya.timer.clearAll(this);`, add:

```typescript
        for (const building of this.buildings) building.progressSprite.destroy();
```

- [ ] **Step 5: Run TypeScript compile**

Run: `npx tsc --noEmit`

Expected: pass. If `drawPie` has type issues in this Laya version, use `sprite.graphics.drawPie(0, 0, radius - 4, -90, -90 + building.cooldown.progress * 360, fillColor, null, 0);` and rerun.

---

### Task 5: Requirements And Workflow Records

**Files:**
- Modify: `doc/output/requirements.md`
- Modify: `.opencode/workflow-state.md`
- Modify: `MEMORY.md`

- [ ] **Step 1: Append requirement change**

Append to `doc/output/requirements.md`:

```markdown

## 增量变更 v8

- 开局进入等待首次点击状态：倒计时、收入、卡牌、单位移动、战斗和产兵都不推进。
- 首次有效点击方块后，该方块生成己方初始建筑，敌方上方阵地生成敌方初始建筑，游戏正式开始。
- 所有产兵建筑使用独立 CD，CD 圆圈转满一圈后产出 1 个士兵并重置。
- 卡牌暂停和局末结算会冻结所有建筑产兵 CD 与圆圈进度。
```

- [ ] **Step 2: Append workflow iteration record**

Append a new row to `.opencode/workflow-state.md` under `## 迭代记录`:

```markdown
| v8 | 2026-05-11 | 完善开局首次点击建造流程，并为产兵建筑增加独立 CD 圆圈进度 | `src/game/HexGameController.ts`, `src/data/SpawnCooldown.ts`, `.temp/spawn-cooldown.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
```

- [ ] **Step 3: Append memory note**

Append to `MEMORY.md`:

```markdown
- 开局产兵流程已改为首次有效点击后启动：`HexGameController` 用 `gameStarted` 阻止倒计时、收入、卡牌、战斗和产兵提前推进；产兵建筑使用 `SpawnCooldown.ts` 的纯函数计时，便于 `.temp/spawn-cooldown.test.mjs` 回归验证。
```

---

### Task 6: Verification

**Files:**
- Test: `.temp/spawn-cooldown.test.mjs`
- Test: `.temp/hex-rules.test.mjs`
- Verify: TypeScript compile

- [ ] **Step 1: Run spawn cooldown test**

Run: `node .temp/spawn-cooldown.test.mjs`

Expected: `spawn cooldown tests passed`.

- [ ] **Step 2: Run existing hex rules test**

Run: `node .temp/hex-rules.test.mjs`

Expected: `hex rules tests passed`.

- [ ] **Step 3: Run TypeScript compile**

Run: `npx tsc --noEmit`

Expected: command exits with code 0 and no TypeScript errors.

- [ ] **Step 4: Manual preview checklist**

If LayaAir IDE preview is available, verify:

```text
1. Scene loads with no soldiers moving and no timer countdown before first tile click.
2. First valid tile click creates a player building on the clicked tile and an enemy building near the enemy side.
3. Both visible circular indicators fill over about 3 seconds.
4. Each full circle creates one soldier and resets the indicator.
5. Opening a card panel freezes progress, and choosing a card resumes progress.
```

---

## Self-Review Notes

- Spec coverage: waiting state, first-click buildings, per-building cooldown, circular progress, pause freeze, tests, requirements, workflow, and memory are all covered.
- Placeholder scan: no placeholder implementation steps remain.
- Type consistency: `SpawnCooldownState`, `createSpawnCooldown`, `tickSpawnCooldown`, `SpawnBuilding`, `Team`, and `BuildingKind` names are consistent across tasks.
