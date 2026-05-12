# Result Panel Figma Vector Redraw Design

## Context

The current result panel in `assets/Scene.ls` uses `ResultPanel` with a bitmap-like sample background and runtime text nodes managed by `src/game/HexGameController.ts`. The panel needs a flat vector redraw in a Figma-style visual language while remaining easy to edit in LayaAir.

## Approved Direction

Use the "map badge victory panel" direction:

- Cream rounded result card with thick dark outline and a chunky bottom shadow.
- Circular medal badge at the top center, decorated with a hex tile icon.
- Small flat hex tile strip inside the panel to connect the result UI to the territory-control gameplay.
- Large pill CTA button with thick outline and pressed-shadow treatment.
- Bright blue playable-ad background compatibility, matching the existing water/sky color mood.

## Text Rules

All user-facing text stays as Laya text nodes, not baked into SVG or PNG artwork.

- `ResultTitle` is a single-line replaceable title.
- `ResultText` is a single-line replaceable description.
- `ResultCTAButton` label is replaceable through the button label or child label.
- Text must not wrap. If future copy is too long, prefer font-size reduction or safe truncation rather than increasing panel height.
- The vector artwork must reserve clear text slots and avoid decorative shapes behind text that reduce readability.

## Runtime States

Victory state:

- Badge accent uses player green and gold.
- Title remains compatible with `领地守住了！`.
- Description remains compatible with `完整版解锁更多卡组与关卡`.
- CTA can keep `立即下载`.

Failure state:

- Badge accent can switch to enemy red/orange through tint or an alternate vector part if needed.
- Title remains compatible with `敌军压境！`.
- Description remains compatible with `下载完整版继续挑战`.
- CTA can keep `立即下载` or be replaced by future copy such as `继续挑战`.

## Implementation Shape

Preferred implementation is a layered UI prefab or scene node update, not a single flattened image:

- Vector art layers: panel background, medal badge, hex tile decoration, CTA button background.
- Runtime text layers: result title, result description, CTA label.
- Assets are stored under `assets/resources/ui/` and referenced with paths relative to `assets`.
- Temporary SVG/PNG build artifacts stay under `.temp/`.
- Do not reference `.superpowers/` or AIGC temporary paths from scene or code.

## LayaAir Integration

- Preserve existing node names where practical: `ResultPanel`, `ResultTitle`, `ResultText`, `ResultCTAButton`.
- Keep `ResultPanel` under the existing result UI layer created by `HexGameController`.
- Update `styleResultPanel()` in `src/game/HexGameController.ts` to position the redrawn visual parts and enforce single-line text behavior.
- Keep CTA click behavior unchanged through the existing `onCtaClick()` path.
- If `.ls` or `.lh` files need edits, use LayaAir asset editing tools instead of direct file writes.

## Validation

- Run TypeScript compile after implementation.
- Run existing UI/source tests relevant to result UI if present, or add a focused lightweight source test for single-line result text rules.
- Validate `assets/Scene.ls` after any scene edit.
- Preview the result panel if runtime preview tooling is available; otherwise document manual preview steps.

## Out Of Scope

- Reworking card choice UI.
- Changing game finish logic or CTA redirect behavior.
- Replacing 3D battle assets.
- Adding multi-line localization layout.
