# 工作流状态

## Step 1: 需求细化 ✅
- 已根据用户提供的分析文档创建原始需求与细化需求。
- 产出：`doc/game/prd.md`
- 产出：`doc/output/requirements.md`

## Step 2: 资源准备 ✅
- 已完成资源全集梳理、商店临时资源下载、动画控制器准备和资源清单生成。
- 项目已有：0 个
- 本地目录匹配：0 个（OPC_MATCH_LOCAL = false，已跳过）
- 商店下载：18 个
- 占位创建：6 个（记录为程序化占位，供 Step 3 搭建时生成）
- 产出：`doc/output/resource_list.json`
- 动画：发现 6 个 `.lani` 文件，已生成 `downloads/3d/soldier/soldier.controller` 与 `downloads/3d/dragon/dragon.controller`。

## Step 3: 场景搭建与功能开发 ✅
- 已生成并执行 `doc/output/game.json` 指令流，搭建 3D 战场节点、基地、UI HUD、卡牌面板、结算面板和 CTA。
- 已实现核心脚本：六边形占格、首格免费、资金收入、三选一卡牌、建塔/兵营/龙巢、双方出兵、自动交战、倒计时结算和 CTA 占位。
- 产出：`assets/Scene.ls`
- 产出：`doc/output/game.json`
- 产出：`src/data/GameEvents.ts`
- 产出：`src/data/HexRules.ts`
- 产出：`src/game/HexGameController.ts`
- 验证：`.temp/hex-rules.test.mjs` 通过；TypeScript `--noEmit` 通过；脚手架 waitAssetBusy + 场景验证通过。

## Step 4: 预览验证 ⚠️
- 已完成可用验证：玩法规则测试、TypeScript 编译、场景资源刷新与格式验证均通过。
- 已确认运行设计尺寸为 1080x1920 竖屏。
- 当前命令环境未暴露编辑器预览、截图和控制台日志读取接口，未能生成运行截图或读取预览日志。
- 产出：`doc/output/verification_report.md`
- 建议：在 LayaAir IDE 中手动预览一次，确认画面正常且控制台无 error。

## 迭代记录
| 版本 | 日期 | 变更描述 | 影响范围 | 状态 |
|------|------|---------|---------|------|
| v1 | 2026-05-11 | 设置游戏运行设计尺寸为 1080x1920 竖屏 | `settings/PlayerSettings.json` | ✅ 完成 |
| v2 | 2026-05-11 | 将运行时主相机 X 轴俯视角调整为 -60 度，并补充相机角度回归测试 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs` | ✅ 完成 |
| v3 | 2026-05-11 | 为每个地块叠加行层级调试标签，便于调整镜头覆盖范围 | `src/game/HexGameController.ts`, `.temp/tile-layer-labels.test.mjs` | ✅ 完成 |
| v4 | 2026-05-11 | 将主相机改为高位俯视并显式 lookAt 地面中心，避免只改欧拉角导致未对准棋盘 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs` | ✅ 完成 |
| v5 | 2026-05-11 | 参考示例图改为正交俯视广告棋盘视角，完整框住竖屏 7x10 六边形地图 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs` | ✅ 完成 |
| v6 | 2026-05-11 | 将预览缩放模式从 fixedwidth 改为 showall，确保运行时逻辑尺寸保持 1080x1920 | `settings/PlayerSettings.json`, `.temp/player-settings-resolution.test.mjs` | ✅ 完成 |
| v7 | 2026-05-11 | 修正六边形等距衔接、缩小建筑/基地比例并增强地块颜色可读性 | `src/game/HexGameController.ts`, `.temp/hex-visual-layout.test.mjs`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
| v8 | 2026-05-11 | 将六边形地块改为深色底座加彩色顶面的复合块体，增加明显分隔线和立体厚度 | `src/game/HexGameController.ts`, `.temp/hex-visual-layout.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
| v9 | 2026-05-11 | 移除错位底座，改用与六边形顶面轮廓对齐的像素线边框并保留单体块厚度 | `src/game/HexGameController.ts`, `.temp/hex-visual-layout.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
| v10 | 2026-05-11 | 新增水面波纹贴图和运行时水面底板作为棋盘场景底 | `assets/resources/water/water_surface.png`, `src/game/HexGameController.ts`, `.temp/water-floor.test.mjs`, `doc/output/resource_list.json`, `doc/output/requirements.md` | ✅ 完成 |
| v11 | 2026-05-11 | 在场景层级新增 WaterLayer，并将运行时水面底板挂到该层级下显示 | `assets/Scene.ls`, `doc/output/water-layer.game.json`, `src/game/HexGameController.ts`, `.temp/water-layer-hierarchy.test.mjs` | ✅ 完成 |
| v10 | 2026-05-11 | 完善开局首次点击建造流程，并为产兵建筑增加独立 CD 圆圈进度 | `src/game/HexGameController.ts`, `src/data/SpawnCooldown.ts`, `.temp/spawn-cooldown.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
| v11 | 2026-05-11 | 修正开局默认建筑显示和首次点击门槛，开局只保留色块，首次点击后激活双方真实建筑 | `src/game/HexGameController.ts`, `src/data/HexRules.ts`, `.temp/hex-rules.test.mjs`, `.temp/start-flow-source.test.mjs` | ✅ 完成 |
| v12 | 2026-05-11 | 按参考图保持稳定正交俯视、改用显式相机欧拉角、修正 Scene3D 查找并放大棋盘画面占比 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
| v13 | 2026-05-11 | 将卡牌改为成功点击解锁地块后触发，并保证首次解锁立即提供一次三选一 | `src/game/HexGameController.ts`, `.temp/card-trigger-source.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
| v14 | 2026-05-11 | 执行资源对标：用本地 Kenney hexagon kit 替换箭塔、兵营、基地、六边形地块和龙巢等未锁定资源，并补充下载 UI 面板素材 | `doc/output/resource_list.json`, `assets/match/`, `assets/downloads/2d/`, `assets/Scene.ls` | ✅ 完成 |
| v15 | 2026-05-11 | 修复运行时层级资源实例化并切换为斜俯视透视镜头，增强模型可见性与 3D 纵深 | `src/game/HexGameController.ts`, `assets/Scene.ls`, `doc/output/resource_list.json`, `.temp/model-visibility-source.test.mjs` | ✅ 完成 |
| v16 | 2026-05-11 | 隐藏卡牌面板编辑器样例图，移除左上角白色占位块，并将卡牌标题本地化为“选择一项升级” | `src/game/HexGameController.ts`, `.temp/card-panel-ui.test.mjs` | ✅ 完成 |
| v16 | 2026-05-11 | 改为编辑器层级方案：新增默认可点地格标记、初始建筑槽和解锁费用层，限制模型单格尺寸并强化光照表现 | `assets/Scene.ls`, `doc/output/hex-editor-hierarchy.game.json`, `src/game/HexGameController.ts`, `.temp/editor-hierarchy-flow.test.mjs`, `doc/output/requirements.md` | ✅ 完成 |
| v17 | 2026-05-11 | 修复加载模型颜色不受控：实例化 prefab 后统一覆盖 `sharedMaterial`/`sharedMaterials` 为阵营和建筑对应的可读 Unlit 材质 | `src/game/HexGameController.ts`, `.temp/model-color-override.test.mjs`, `MEMORY.md` | ✅ 完成 |
| v18 | 2026-05-11 | 修正模型高度、金币费用投影和图标显示、CTA 结算显示，并为六边形地块增加侧面阴影与解锁翻转反馈 | `src/game/HexGameController.ts`, `.temp/hex-visual-interaction-fixes.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v19 | 2026-05-11 | 修复 FBX 替换后模型比例失效：实例化后按渲染包围盒自适应地格 footprint，避免沿用旧 `.lh` 固定缩放 | `src/game/HexGameController.ts`, `.temp/model-scale-adaptation.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v20 | 2026-05-11 | 增加可在 Inspector 手动调整的模型比例参数，并在场景中放置建筑/士兵/Boss 比例样例节点供编辑器观察 | `src/game/HexGameController.ts`, `assets/Scene.ls`, `doc/output/manual-model-scale-samples.game.json`, `.temp/manual-model-scale-controls.test.mjs` | ✅ 完成 |
| v21 | 2026-05-11 | 将基地改为地块底座+建筑模型组合，并拆分基地建筑、箭塔、兵营、龙巢、士兵和 Boss 的独立缩放参数 | `src/game/HexGameController.ts`, `assets/Scene.ls`, `.temp/base-composite-scale-controls.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v22 | 2026-05-11 | 补齐编辑器分层资源样例：建筑/单位资源分组展示，并在 WaterLayer 中添加水面贴片样例 | `assets/Scene.ls`, `src/game/HexGameController.ts`, `doc/output/editor-resource-samples.game.json`, `.temp/editor-resource-samples.test.mjs` | ✅ 完成 |
| v18 | 2026-05-11 | 执行资源对标：用本地定制试玩减面资产替换士兵、怪物、箭塔、兵营、基地、龙巢和火焰反馈等未锁定资源，并跳过外网下载 | `doc/output/resource_list.json`, `assets/match/`, `assets/Scene.ls`, `MEMORY.md` | ✅ 完成 |
| v22 | 2026-05-11 | 开局直接弹三选一建筑卡，选择后在初始绿色地块生成建筑，并改为点击金币费用解锁相邻地块 | `src/game/HexGameController.ts`, `.temp/opening-card-unlock-flow.test.mjs`, `.temp/card-trigger-source.test.mjs`, `.temp/start-flow-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v23 | 2026-05-11 | 解锁新地块后再次弹三选一建筑卡，并把选择的建筑部署到刚解锁的绿色地块 | `src/game/HexGameController.ts`, `.temp/opening-card-unlock-flow.test.mjs`, `.temp/card-trigger-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
