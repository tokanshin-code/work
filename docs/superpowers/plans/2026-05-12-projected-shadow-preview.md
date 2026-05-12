# Projected Shadow Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a switchable projected-shadow preview for buildings and units while preserving the current bright playable-ad style.

**Architecture:** `HexGameController` remains the owner of runtime lighting and procedural visuals. A small set of helper methods configures directional-light shadows, marks caster renderers, and marks receiver renderers without restructuring scene generation.

**Tech Stack:** LayaAir 3.3.6, TypeScript, lightweight Node source assertions.

---

### Task 1: Add Shadow Source Test

**Files:**
- Create: `.temp/projected-shadow-source.test.mjs`
- Modify: none

- [ ] **Step 1: Write the failing test**

```js
import fs from 'node:fs';

const source = fs.readFileSync('src/game/HexGameController.ts', 'utf8');

function assertContains(snippet, message) {
  if (!source.includes(snippet)) {
    console.error(message);
    process.exit(1);
  }
}

assertContains('enableProjectedShadows', 'Expected an Inspector switch for projected shadows.');
assertContains('configureProjectedShadows()', 'Expected lighting setup to call projected shadow configuration.');
assertContains('shadowMode = Laya.ShadowMode.SoftLow', 'Expected directional light to use SoftLow shadows.');
assertContains('setShadowCasting(root: Laya.Sprite3D, enabled: boolean)', 'Expected recursive shadow caster helper.');
assertContains('setShadowReceiving(root: Laya.Sprite3D, enabled: boolean)', 'Expected recursive shadow receiver helper.');
assertContains('this.setShadowCasting(visual, this.enableProjectedShadows)', 'Expected loaded models to cast shadows.');
assertContains('this.setShadowReceiving(node, this.enableProjectedShadows)', 'Expected tile nodes to receive shadows.');
assertContains('this.setShadowReceiving(water, this.enableProjectedShadows)', 'Expected water floor to receive shadows.');

console.log('projected shadow source checks passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .temp/projected-shadow-source.test.mjs`

Expected: FAIL with missing `enableProjectedShadows`.

### Task 2: Implement Runtime Shadow Configuration

**Files:**
- Modify: `src/game/HexGameController.ts`
- Test: `.temp/projected-shadow-source.test.mjs`

- [ ] **Step 1: Add Inspector properties**

Add near existing public `@property` fields:

```ts
@property({ type: Boolean }) public enableProjectedShadows: boolean = true;
@property({ type: Number }) public shadowDistance: number = 24;
@property({ type: Number }) public shadowStrength: number = 0.72;
@property({ type: Number }) public shadowResolution: number = 1024;
```

- [ ] **Step 2: Configure the directional light**

Update `setupLighting()` so it ends with:

```ts
light.color = new Laya.Color(1, 0.95, 0.82, 1);
light.intensity = 1.6;
light.direction = new Laya.Vector3(-1.05, -0.28, -0.72);
this.configureProjectedShadows(light);
```

Add:

```ts
private configureProjectedShadows(light: Laya.DirectionLightCom & { shadowDistance?: number; shadowStrength?: number; shadowResolution?: number }): void {
    if (!this.enableProjectedShadows) {
        light.shadowMode = Laya.ShadowMode.None;
        return;
    }
    light.shadowMode = Laya.ShadowMode.SoftLow;
    light.shadowDistance = this.shadowDistance;
    light.shadowStrength = this.shadowStrength;
    light.shadowResolution = this.shadowResolution;
}
```

- [ ] **Step 3: Add recursive render helpers**

Add near model helper methods:

```ts
private setShadowCasting(root: Laya.Sprite3D, enabled: boolean): void {
    const stack: Laya.Node[] = [root];
    while (stack.length > 0) {
        const node = stack.pop()!;
        const mesh = node as Laya.MeshSprite3D;
        const renderer = mesh.meshRenderer as (Laya.MeshRenderer & { castShadow?: boolean }) | undefined;
        if (renderer) renderer.castShadow = enabled;
        for (let i = 0; i < node.numChildren; i++) stack.push(node.getChildAt(i));
    }
}

private setShadowReceiving(root: Laya.Sprite3D, enabled: boolean): void {
    const stack: Laya.Node[] = [root];
    while (stack.length > 0) {
        const node = stack.pop()!;
        const mesh = node as Laya.MeshSprite3D;
        const renderer = mesh.meshRenderer as (Laya.MeshRenderer & { receiveShadow?: boolean }) | undefined;
        if (renderer) renderer.receiveShadow = enabled;
        for (let i = 0; i < node.numChildren; i++) stack.push(node.getChildAt(i));
    }
}
```

- [ ] **Step 4: Mark casters and receivers**

Call `setShadowReceiving` on tile nodes and water floor. Call `setShadowCasting` on fallback building/unit visuals and loaded prefab visuals.

- [ ] **Step 5: Run test to verify it passes**

Run: `node .temp/projected-shadow-source.test.mjs`

Expected: PASS with `projected shadow source checks passed`.

### Task 3: Verify Project Health

**Files:**
- Modify: `MEMORY.md`
- Modify: `.opencode/workflow-state.md`

- [ ] **Step 1: Run TypeScript check**

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 2: Validate scene asset**

Run the Laya scene validator for `assets/Scene.ls`.

Expected: scene validation succeeds.

- [ ] **Step 3: Update project memory and workflow**

Record that projected shadows are an optional runtime preview controlled by `enableProjectedShadows` and that current Unlit colors are intentionally preserved.
