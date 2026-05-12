# Enemy AI and Damage Feedback Design

## Goal

Make combat clearer and more pressured: enemy attacks should visibly affect player buildings, and enemy AI should expand territory and grow its army over time.

## Confirmed Behavior

- Unit targeting priority is: enemy units in range, then enemy buildings in range, then the opposing core/base building.
- Buildings do not show floating damage numbers.
- Building hit feedback is health bar reduction plus brief red flash and light shake.
- Player-side health bars are green; enemy-side health bars are red.
- Enemy AI automatically claims adjacent neutral tiles on a timer.
- Enemy expansion prioritizes tiles that move toward the player side and avoids water/void tiles.
- Enemy gains new buildings as it expands, increasing pressure and production over time.

## Architecture

- Keep changes in `src/game/HexGameController.ts` because the current battle loop, tile visuals, building list, and UI feedback live there.
- Add small helper methods for target selection, building damage, hit feedback, enemy expansion, and AI building placement to keep the large controller readable.
- Extend `.temp/unit-visibility-source.test.mjs` with source-level regression checks for the new targeting, feedback, and AI expansion behavior.

## Acceptance Criteria

- Enemy units visibly reduce player building/base health bars before the result panel appears.
- Buildings flash red and shake briefly when damaged.
- Units attack soldiers first if any opposing soldier is in range.
- Units attack buildings only when no opposing soldier is in range.
- Enemy claims neutral adjacent tiles over time and creates additional enemy buildings on expansion milestones.
- TypeScript typecheck passes and scene validation remains clean.
