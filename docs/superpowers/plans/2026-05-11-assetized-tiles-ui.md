# Assetized Tiles And UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one matched asset per visual type act as the reusable source for hex tiles, card option UI, panel UI, result UI, and tutorial hint UI.

**Architecture:** Keep gameplay state and text dynamic in `src/game/HexGameController.ts`, but route visible repeated elements through resource paths in the component properties. Use one sample asset per type, then clone or skin repeated instances at runtime.

**Tech Stack:** LayaAir 3.3.6, TypeScript, classic UI components, `.ls` scene JSON via MCP editing, `.temp` regression scripts.

---

### Task 1: Add Regression Coverage For Assetized Visual Types

**Files:**
- Create: `.temp/assetized-visual-types.test.mjs`
- Read: `src/game/HexGameController.ts`
- Read: `assets/Scene.ls`
- Read: `doc/output/resource_list.json`

- [ ] **Step 1: Write the failing test**

Create `.temp/assetized-visual-types.test.mjs` with:

```javascript
import { readFileSync } from 'node:fs';

const source = readFileSync('src/game/HexGameController.ts', 'utf8');
const scene = readFileSync('assets/Scene.ls', 'utf8');
const resourceList = JSON.parse(readFileSync('doc/output/resource_list.json', 'utf8'));
const resources = resourceList.resources ?? [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resourceByName(name) {
  return resources.find((item) => item.name === name);
}

assert(resourceByName('六边形地块预制体')?.status === 'matched', 'hex tile resource must be matched');
assert(resourceByName('卡牌选项卡背景')?.status === 'matched', 'card option resource must be matched');
assert(resourceByName('三选一卡牌面板')?.status === 'matched', 'card panel resource must be matched');
assert(resourceByName('结算弹窗')?.status === 'matched', 'result panel resource must be matched');
assert(resourceByName('教程点击提示')?.status === 'matched', 'tutorial hint resource must be matched');

for (const snippet of [
  '@property({ type: String }) public hexTilePrefabPath',
  '@property({ type: String }) public cardPanelSkinPath',
  '@property({ type: String }) public cardOptionSkinPath',
  '@property({ type: String }) public resultPanelSkinPath',
  '@property({ type: String }) public tutorialHintSkinPath',
  'this.createHexTileVisual(node, tile)',
  'this.applyUiSkins()',
]) {
  assert(source.includes(snippet), `missing source snippet: ${snippet}`);
}

for (const snippet of [
  '"hexTilePrefabPath": "match/Models/GLB format/grass.glb"',
  '"cardPanelSkinPath": "downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png"',
  '"cardOptionSkinPath": "downloads/2d/card_option/CardFrame_01_White_Bg.png"',
  '"resultPanelSkinPath": "downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png"',
  '"tutorialHintSkinPath": "downloads/2d/tutorial_hint/info.png"',
]) {
  assert(scene.includes(snippet), `missing scene binding: ${snippet}`);
}

console.log('assetized visual type tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .temp/assetized-visual-types.test.mjs`

Expected: FAIL with `card option resource must be matched` or missing source snippet.

### Task 2: Add One Reusable Resource Entry Per Visual Type

**Files:**
- Modify: `doc/output/resource_list.json`
- Copy/Create: `assets/downloads/2d/card_option/CardFrame_01_White_Bg.png`

- [ ] **Step 1: Copy the existing card frame as the single reusable option-card sample**

Run:

```bash
mkdir -p "assets/downloads/2d/card_option" && cp "assets/downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png" "assets/downloads/2d/card_option/CardFrame_01_White_Bg.png"
```

- [ ] **Step 2: Update `resource_list.json`**

Add one resource after `三选一卡牌面板`, using the next available id if ids differ:

```json
{
  "id": 30,
  "name": "卡牌选项卡背景",
  "path": "downloads/2d/card_option/CardFrame_01_White_Bg.png",
  "type": "picture",
  "description": "单张卡牌选项卡背景示例，三选一按钮复用该资源并动态更新文字",
  "status": "matched",
  "lock": false
}
```

Ensure existing entries remain one per type:
- `六边形地块预制体` -> `match/Models/GLB format/grass.glb`
- `三选一卡牌面板` -> `downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png`
- `结算弹窗` -> `downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png`
- `教程点击提示` -> `downloads/2d/tutorial_hint/info.png`

### Task 3: Bind Resource Paths In The Scene Component

**Files:**
- Modify: `assets/Scene.ls`
- Verify: `assets/Scene.ls`

- [ ] **Step 1: Add script property bindings to `HexBoard` component**

Use scene JSON patch on the existing `HexGameController` component:

```json
[
  { "op": "add", "path": "/_$child/0/_$child/2/_$comp/0/hexTilePrefabPath", "value": "\"match/Models/GLB format/grass.glb\"" },
  { "op": "add", "path": "/_$child/0/_$child/2/_$comp/0/cardPanelSkinPath", "value": "\"downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png\"" },
  { "op": "add", "path": "/_$child/0/_$child/2/_$comp/0/cardOptionSkinPath", "value": "\"downloads/2d/card_option/CardFrame_01_White_Bg.png\"" },
  { "op": "add", "path": "/_$child/0/_$child/2/_$comp/0/resultPanelSkinPath", "value": "\"downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png\"" },
  { "op": "add", "path": "/_$child/0/_$child/2/_$comp/0/tutorialHintSkinPath", "value": "\"downloads/2d/tutorial_hint/info.png\"" }
]
```

- [ ] **Step 2: Validate scene**

Run Laya scene validation for `assets/Scene.ls`.

Expected: validation success.

### Task 4: Make Hex Tiles Use One Reusable Asset Sample

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/assetized-visual-types.test.mjs`

- [ ] **Step 1: Add path property**

Add near the other path properties:

```typescript
@property({ type: String }) public hexTilePrefabPath: string = "match/Models/GLB format/grass.glb";
```

- [ ] **Step 2: Replace tile node construction with a visual root**

Change `createHexTileNode` to keep a clickable root and load one reusable visual:

```typescript
private createHexTileNode(tile: HexTileState): Laya.MeshSprite3D {
    const node = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createCylinder(HEX_TILE_RADIUS, HEX_TILE_HEIGHT, 6), `Hex_${tile.col}_${tile.row}`);
    node.meshRenderer.sharedMaterial = this.createMaterial(this.getTileColor(tile));
    node.transform.position = this.hexToWorld(tile.col, tile.row);
    node.transform.rotationEuler = new Laya.Vector3(0, 30, 0);
    this.createHexTileVisual(node, tile);
    node.addChild(this.createHexOutline(tile));
    return node;
}

private createHexTileVisual(parent: Laya.Sprite3D, tile: HexTileState): void {
    if (!this.hexTilePrefabPath) return;
    this.createPrefabVisual(parent, this.hexTilePrefabPath, new Laya.Vector3(0, 0, 0), this.clampPrefabScale(new Laya.Vector3(0.9, 0.9, 0.9)), this.getTileColor(tile));
}
```

- [ ] **Step 3: Update tile visual refresh to recolor assetized children**

Extend `updateTileVisual` so the root and loaded asset tint both update:

```typescript
private updateTileVisual(col: number, row: number): void {
    const tile = this.tiles.find((item) => item.col === col && item.row === row);
    const node = this.tilesByKey.get(this.key(col, row));
    if (!tile || !node) return;
    const color = this.getTileColor(tile);
    node.meshRenderer.sharedMaterial = this.createMaterial(color);
    this.applyModelTint(node, color);
}
```

### Task 5: Apply One Reusable UI Asset Per UI Type

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/assetized-visual-types.test.mjs`

- [ ] **Step 1: Add UI skin properties**

Add near existing UI properties:

```typescript
@property({ type: String }) public cardPanelSkinPath: string = "downloads/2d/card_choice_panel/CardFrame_01_White_Bg.png";
@property({ type: String }) public cardOptionSkinPath: string = "downloads/2d/card_option/CardFrame_01_White_Bg.png";
@property({ type: String }) public resultPanelSkinPath: string = "downloads/2d/result_panel/Popup_Box_05_Bag_Bg.png";
@property({ type: String }) public tutorialHintSkinPath: string = "downloads/2d/tutorial_hint/info.png";
```

- [ ] **Step 2: Call UI skin setup on awake**

Add after `this.setupBases();` in `onAwake()`:

```typescript
this.applyUiSkins();
```

- [ ] **Step 3: Implement reusable skin application**

Add methods:

```typescript
private applyUiSkins(): void {
    this.applyPanelSkin(this.cardPanel, this.cardPanelSkinPath, "CardPanelSkin");
    this.applyPanelSkin(this.resultPanel, this.resultPanelSkinPath, "ResultPanelSkin");
    this.applyButtonSkin(this.cardButtonA, this.cardOptionSkinPath);
    this.applyButtonSkin(this.cardButtonB, this.cardOptionSkinPath);
    this.applyButtonSkin(this.cardButtonC, this.cardOptionSkinPath);
    this.applyTutorialHintSkin();
}

private applyPanelSkin(panel: Laya.Sprite, skinPath: string, name: string): void {
    if (!skinPath) return;
    const skin = new Laya.Image(skinPath);
    skin.name = name;
    skin.width = panel.width;
    skin.height = panel.height;
    skin.sizeGrid = "24,24,24,24";
    panel.addChildAt(skin, 0);
}

private applyButtonSkin(button: Laya.Button, skinPath: string): void {
    if (!skinPath) return;
    button.skin = skinPath;
    button.sizeGrid = "24,24,24,24";
}

private applyTutorialHintSkin(): void {
    if (!this.tutorialHintSkinPath || !this.hintLabel.parent) return;
    const icon = new Laya.Image(this.tutorialHintSkinPath);
    icon.name = "TutorialHintAssetIcon";
    icon.width = 64;
    icon.height = 64;
    icon.x = this.hintLabel.x + 24;
    icon.y = this.hintLabel.y + 12;
    this.hintLabel.parent.addChild(icon);
}
```

### Task 6: Verification

**Files:**
- Verify: `.temp/assetized-visual-types.test.mjs`
- Verify: `.temp/resource-prefab-usage.test.mjs`
- Verify: `.temp/hex-rules.test.mjs`
- Verify: `assets/Scene.ls`

- [ ] **Step 1: Run all relevant checks**

Run:

```bash
node .temp/assetized-visual-types.test.mjs && node .temp/resource-prefab-usage.test.mjs && npm run typecheck && node .temp/hex-rules.test.mjs
```

Expected:

```text
assetized visual type tests passed
resource prefab usage tests passed
typecheck exits 0
hex rules tests passed
```

- [ ] **Step 2: Validate scene**

Run Laya scene validation for `assets/Scene.ls`.

Expected: validation success.

- [ ] **Step 3: Update project memory**

Append to `MEMORY.md`:

```markdown
- 资源抽离规则：每个视觉类型只保留一个对标样例资产（六边形地块、卡牌面板、卡牌选项卡、结算弹窗、教程提示），运行时通过克隆/skin 复用；不要为每个格子或每个选项创建独立资源条目。
```
