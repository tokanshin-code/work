# Hex Visual Interaction Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix model height, unlock cost alignment/format, CTA visibility, and hex side/flip feedback.

**Architecture:** Keep the changes inside `src/game/HexGameController.ts` because these are runtime presentation fixes. Add a source-level regression test in `.temp` before changing code, then update documentation and memory after verification.

**Tech Stack:** LayaAir 3.3.6, TypeScript, source-level Node regression tests, Laya asset validation.

---

## Tasks

### Task 1: Regression Test

**Files:**
- Create: `.temp/hex-visual-interaction-fixes.test.mjs`

- [ ] Write source assertions for `GROUND_SURFACE_Y`, `MODEL_BASE_Y`, `createUnlockCostItem`, `coin_2.png`, `projectWorldToUi`, hidden `ctaButton`, `createHexSideShadow`, and `playTileUnlockFlip`.
- [ ] Run `node .temp/hex-visual-interaction-fixes.test.mjs` and confirm it fails before implementation.

### Task 2: Runtime Visual Fixes

**Files:**
- Modify: `src/game/HexGameController.ts`

- [ ] Move buildings, bases, units, and prefab visuals above the tile surface.
- [ ] Replace unlock cost `Label` with a `Sprite` item containing a coin `Image` and cost `Label`.
- [ ] Use camera projection for unlock labels instead of the old debug linear mapping.
- [ ] Hide the normal CTA at startup and show it only when the result panel appears.
- [ ] Add a darker side-shadow cylinder under each tile and play a short flip/ease animation when a tile is unlocked.

### Task 3: Verification and Docs

**Files:**
- Modify: `doc/output/requirements.md`
- Modify: `.opencode/workflow-state.md`
- Modify: `MEMORY.md`

- [ ] Run the new regression test and existing related tests.
- [ ] Run `npm run typecheck`.
- [ ] Run Laya asset refresh and validate `assets/Scene.ls`.
- [ ] Append requirements, workflow, and memory notes for this iteration.
