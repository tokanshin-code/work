# Project Memory

## 地块争夺 3D 试玩

- 使用 `game-scaffold` 执行 Step 3 时，脚本挂载 `bind` 的每个字符串/数字属性都必须在对应脚本中声明 `@property`，否则场景验证会报 undefined-property。
- 当前项目的 `Box` schema 不接受 `mouseEnabled` 属性，场景中 2D 面板显隐使用 `visible`，点击事件可直接绑定到可交互子节点或根节点。
- 默认 `assets/Scene.ls` 中存在 `fogRange` 字段会触发 Scene3D schema 校验失败，已移除并通过脚手架验证。
- 六边形占格规则已抽到 `src/data/HexRules.ts`，并用 `.temp/hex-rules.test.mjs` 做轻量行为验证：7x10 棋盘、基地坐标、相邻判断、首格免费占领和收入计算。
- 运行设计尺寸配置在 `settings/PlayerSettings.json` 的 `resolution`：1080x1920、showall、vertical、居中对齐、背景色 #16b5f0；`fixedwidth` 会按设备宽度改写运行时逻辑高度，导致预览尺寸不是设计尺寸。场景 `GameUIRoot` 也保持 1080x1920。
- 当前 CLI 环境未暴露编辑器预览、截图、控制台日志读取接口；Step 4 已用 TypeScript 编译、规则测试和场景验证替代，并在 `doc/output/verification_report.md` 记录人工预览待办。
- 主相机运行时由 `src/game/HexGameController.ts` 的 `setupCamera` 覆盖位置和角度；当前参考广告截图使用稳定正交俯视，`cameraVerticalSize = 15.6`，位置 `(0,22,0.01)`，`rotationEuler=(-90,0,0)`，棋盘更贴近左右边界；不要在近垂直相机上使用运行时 `lookAt`，曾导致初始化失败并停留在默认侧视角；尝试 `(0,18,3.8)` 的斜向偏移会导致前景基地/水面遮挡棋盘。
- 地块层级调试显示在 `src/game/HexGameController.ts` 的 `createDebugLayerLabel` 中生成，文本格式为 `L0` 到 `L9`，用于镜头调试；`.temp/tile-layer-labels.test.mjs` 检查生成逻辑。
- 六边形棋盘视觉间距现在在 `src/game/HexGameController.ts` 中用 `HEX_TILE_RADIUS=0.82`、`HEX_X_STEP=1.42`、`HEX_ROW_X_OFFSET=0.71`、`HEX_Z_STEP=1.23` 固定，保证同一地块六个邻居中心距离一致；`.temp/hex-visual-layout.test.mjs` 检查防回退。
- 程序化地块和建筑颜色改用 `Laya.UnlitMaterial`，避免顶视相机和光照角度削弱玩家/敌方/水/熔岩/中立地块颜色特征。
- 开局产兵流程已改为首次有效点击后启动：`HexGameController` 用 `gameStarted` 阻止倒计时、收入、卡牌、战斗和产兵提前推进；产兵建筑使用 `SpawnCooldown.ts` 的纯函数计时，便于 `.temp/spawn-cooldown.test.mjs` 回归验证。
- 六边形地块不要使用比顶面更大的深色底座，否则会出现边缘错开；当前方案是单体 `Hex_*` 柱块负责立体厚度，子节点 `HexOutline_*` 用 `Laya.PixelLineSprite3D` 沿同半径顶面边缘画 6 条对齐分隔线。
- 开局默认建筑需要显式隐藏：`setupBases` 只摆放并 `active=false`，首次点击后用场景绑定的 `playerBase`/`enemyBase` 激活为真实初始建筑，不再用色块盒子代替；首次占领允许任意可建造中立格启动流程。
- 水面底板使用 `assets/resources/water/water_surface.png`，运行时在 `HexGameController.createWaterFloor` 中先于棋盘创建 `WaterFloor` 平面并用 `Laya.loader.load(..., Laya.Loader.TEXTURE2D)` 贴到 `Laya.UnlitMaterial`；平面高度 `WATER_FLOOR_Y=-0.22`，低于六边形柱体避免遮挡。
- 场景层级中需要显示水面层：`assets/Scene.ls` 已通过 `doc/output/water-layer.game.json` 增量创建 `Scene3D/WaterLayer`，`HexGameController.getWaterLayer` 会优先使用该节点并将运行时 `WaterFloor` 挂到其下。
- `HexGameController` 挂在 `Scene3D/HexBoard` 上时，`this.owner.scene` 返回的就是 `Scene3D`，不能再假设它是 2D 根场景并二次查找 `Scene3D`；已用 `getScene3D()` 同时兼容 `owner.scene` 为 `Scene3D` 或根场景，否则会导致 `getWaterLayer()` 初始化失败、棋盘不生成、预览停留在默认侧视角。
- 卡牌触发规则现在绑定成功占地：`HexGameController.onStageClick` 在 `claimTile` 和首战启动后调用 `showCards()`；`onUpdate` 不再累计卡牌定时器，避免未点击地块时自动弹卡。
