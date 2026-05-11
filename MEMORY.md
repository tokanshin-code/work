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
- 开局流程现在是直接弹三选一建筑卡：`onAwake()` 先把 `(3,7)` 设为绿色己方空地并调用 `showOpeningBuildChoice()`；选卡后 `applyCard()` 在 `InitialBuildSlot` 生成建筑并显示相邻金币解锁点，`onStageClick()` 只负责付费解锁相邻地块，不再点击黄色/高亮地块或解锁后弹卡。
- 付费解锁新地块后也会进入三选一：`onStageClick()` 先 `claimTile` 并扣金币，再把 `pendingInitialBuildPosition` 设为新地块世界坐标并调用 `showCards()`；`applyCard()` 只有 `!gameStarted` 的开局选卡才使用 `InitialBuildSlot`，后续选卡会在刚解锁地块动态创建建筑。
- 资源对标已接入本地 `D:\项目资产\3D资产\共享资产\kenney_hexagon-kit`：优先使用 `assets/match/Models/GLB format/` 下的 GLB（如 `building-archery.glb`、`building-cabin.glb`、`building-castle.glb`、`building-wizard-tower.glb`、`grass.glb`），场景 `.ls` 中 `_$prefab` 仍需写 UUID，资源清单和脚本属性可记录项目相对路径。
- `HexGameController` 过去只把 `towerPrefabPath`/`barracksPrefabPath` 作为场景属性保存，运行时 `createBuildingMarker` 和 `spawnUnit` 仍创建程序化 Box/Capsule，导致资源对标后模型看起来没生效；已改为先显示兜底几何体，再异步加载 `Laya.Loader.HIERARCHY` 并用匹配模型替换子视觉节点。
- 资源抽离规则：每个视觉类型只保留一个对标样例资产（六边形地块、卡牌面板、卡牌选项卡、结算弹窗、教程提示），运行时通过克隆/skin 复用；不要为每个格子或每个选项创建独立资源条目。
- 编辑器层级预览规则：仅在脚本属性里保存资源路径不够直观，需在 `assets/Scene.ls` 放置可见样例节点；当前 `Scene3D/EditorAssetSamples/HexTileAssetSample` 用于地块模型预览，`CardPanelAssetSample`、`CardOptionAssetSample`、`ResultPanelAssetSample`、`TutorialHintAssetSample` 用于 UI 预览，运行时通过 `hideEditorAssetSamples()` 隐藏 3D 编辑器样例。
- 用户要求后续场景搭建优先以预制体与清晰层级组织实现，方便在 LayaAir 编辑器中手动调整；除非确有必要，避免完全依赖运行时动态生成场景结构。
- `Laya.loader.load(..., Laya.Loader.HIERARCHY)` 加载 `.lh` 时运行时返回值可能是带 `create()` 的预制体工厂，而不是可直接 `clone` 的 `Sprite3D`；动态模型实例化需优先调用 `create()`，并且只有实例创建成功后再移除兜底几何体，否则会出现模型不可见。
- 当前 3D 观感改为运行时显式设置主相机：透视镜头、`fieldOfView=42`、位置 `(0,13,11)`、欧拉角 `(-55,0,0)`；仅改 `.ls` 相机配置可能被编辑器缓存或旧运行状态影响，脚本中保留 `setupCamera()` 防回退。
- 开局编辑器层级方案已接入：`assets/Scene.ls` 中 `HexBoard/DefaultClickableTileMarker` 标记固定首点 `(3,7)`，`Buildings/InitialBuildSlot` 承接首张卡生成的建筑，`GameUIRoot/UnlockCostLayer` 显示相邻可解锁地格费用；费用不足用 `#FF3B30` 红字，充足用黄色。
- 模型不超格通过 `HexGameController.ts` 的 `MODEL_TILE_SCALE_CAP=0.42` 统一限制，基地缩放 `BASE_VISUAL_SCALE=0.45`；运行时 `setupLighting()` 会强化环境光与方向光，不要只改场景静态灯光后移除此兜底。
- Kenney 解包模型的 `.lh` 使用 `MeshRenderer.sharedMaterials` 数组引用 `glTFPBR` 材质，之前只尝试改 `sharedMaterial.albedoIntensity`，加载成功后还会删除带阵营色的兜底几何体，导致模型颜色仍是资源原色/发灰；现在 `createPrefabVisual(..., tintColor)` 会在实例化后用 `applyModelTint()` 同时覆盖 `sharedMaterial` 和 `sharedMaterials` 为可读的 `UnlitMaterial` 阵营/建筑色。
- 资源对标已接入本地 `D:\项目资产\试玩资产\定制试玩减面资产`：按本次命令保留 FBX 原文件不解包，复制到 `assets/match/` 并将贴图集中复制到 `assets/match/textures/`；`assets/Scene.ls` 的 `HexGameController` 资源属性已改为引用本地士兵、丧尸 Boss、FGH 主塔、主楼、城墙和喷火器 FBX。
- 模型高度统一以 `GROUND_SURFACE_Y = HEX_TILE_HEIGHT * 0.5` 和 `MODEL_BASE_Y = GROUND_SURFACE_Y + 0.04` 为基准，建筑/基地不要再放回 `y=0`；解锁费用 UI 现在是 `Sprite(Image coin_2 + Label)`，优先用 `projectWorldToUi()` 相机投影定位；`CTAButton` 开局隐藏，`finishGame()` 才显示。
- 六边形地块新增 `createHexSideShadow()` 暗色侧面层，解锁时 `playTileUnlockFlip()` 对地块节点做短暂翻转动画；如果后续替换地块模型，需保留侧面阴影和翻转反馈逻辑。
- 本地 FBX 与旧 Kenney `.lh` 原始单位差异很大，不能再依赖 `0.42/0.38/0.55` 这类固定缩放。`createPrefabVisual(..., footprintLimit)` 现在会实例化后通过 `fitPrefabToTile()` 读取 `MeshRenderer.bounds`，只把超过地格 footprint 的模型等比缩小；建筑/地块用 `MODEL_FOOTPRINT_LIMIT = HEX_TILE_RADIUS * 1.15`，单位用 `UNIT_FOOTPRINT_LIMIT = HEX_TILE_RADIUS * 0.58`。
- 为避免自动包围盒适配无法完全匹配广告视觉比例，`HexGameController` 已暴露 `buildingModelScale`、`soldierModelScale`、`bossModelScale`、`tileModelScale` 四个 Inspector 参数，当前场景默认值分别为 `0.28/0.22/0.2/0.42`；`Scene3D/EditorAssetSamples` 下有 `BuildingScaleSample`、`SoldierScaleSample`、`BossScaleSample` 可在编辑器中观察和手调参考，运行时会由 `hideEditorAssetSamples()` 隐藏。
- 基地视觉已改为组合结构：`PlayerBase` / `EnemyBase` 是普通 `Sprite3D` 容器，不再挂一体化 prefab；运行时 `setupBaseComposite()` 会创建 `BaseTileVisual` 和 `BaseBuildingVisual` 两个子节点。基地建筑资源通过 `baseBuildingPrefabPath` 指定，比例通过 `baseBuildingModelScale` 单独调；箭塔、兵营、龙巢分别使用 `towerModelScale`、`barracksModelScale`、`dragonNestModelScale`，士兵和 Boss 分别使用 `soldierModelScale`、`bossModelScale`。
- `CardChoicePanel` 下的 `CardPanelAssetSample` / `CardOptionAssetSample` / 旧 `CardTitle` 只是编辑器预览样例，运行时必须在 `styleCardPanel()` 中隐藏；否则卡牌弹窗左上会出现大白色样例图。卡牌主标题使用运行时创建的 `CardPanelTitle`，当前文案为“选择一项升级”。
- 编辑器分层资源样例已补齐：`Scene3D/EditorAssetSamples/BuildingSamples` 展示 `BaseBuildingSample`、`TowerSample`、`BarracksSample`、`DragonNestSample`、`FireEffectSample`；`UnitSamples` 展示 `SoldierLayerSample`、`BossLayerSample`。`WaterLayer/WaterSurfaceSample` 用作水面贴片分层占位，运行时 `hideEditorWaterSample()` 会先隐藏它再创建动态 `WaterFloor`。
