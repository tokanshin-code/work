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
| v17 | 2026-05-11 | 强化士兵和血条可见性：单位生成位置前移、保留彩色兜底士兵、增加单位血条、限制单帧超大 delta 避免瞬间结算 | `src/game/HexGameController.ts`, `.temp/unit-visibility-source.test.mjs` | ✅ 完成 |
| v18 | 2026-05-11 | 为建筑补充独立血条，并放大我方单位血条显示，建筑和士兵都展示具体血量数字 | `src/game/HexGameController.ts`, `.temp/unit-visibility-source.test.mjs` | ✅ 完成 |
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
| v24 | 2026-05-11 | 统一玩法规则：卡牌改为解锁链路触发，点击只允许金币标记地块，金矿建筑提供周期金币 | `src/game/HexGameController.ts`, `.temp/gameplay-consistency-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v25 | 2026-05-11 | 开局只使用已有 base 地块作为首次三选一建造位置，不再额外占领初始相邻地块 | `src/game/HexGameController.ts`, `.temp/opening-card-unlock-flow.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v26 | 2026-05-11 | 重梳理建筑与兵种逻辑：卡牌全改为建筑，新增三类建筑、三类兵种差异，并用蒙版扇形修复圆形进度条填充 | `src/game/HexGameController.ts`, `.temp/building-unit-logic-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v27 | 2026-05-11 | 敌方开局自动选择不同兵种建筑，并提高金矿生产速度与单次金币产量 | `src/game/HexGameController.ts`, `.temp/enemy-building-economy-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v28 | 2026-05-11 | 下调枪兵、弓兵、骑兵和敌方单位移动速度，提升战斗可读性 | `src/game/HexGameController.ts`, `.temp/unit-speed-balance-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v29 | 2026-05-11 | 补充胜负规则：建筑全灭判负，时间结束按地块数判胜，并添加获胜方地块扩散翻转变色 | `src/game/HexGameController.ts`, `.temp/victory-condition-spread-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v30 | 2026-05-11 | 放慢获胜方地块扩散翻转节奏，使由 base 方向向外变色更清晰 | `src/game/HexGameController.ts`, `.temp/victory-spread-speed-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v25 | 2026-05-12 | 用用户提供的手势图片覆盖手指引导正式资源，并移除中文临时资源文件 | `assets/downloads/2d/ui/hand.png`, `MEMORY.md` | ✅ 完成 |
| v26 | 2026-05-12 | 增加方案 A 投射阴影预览：建筑/单位投影到地块，保留现有地块侧面阴影与广告高亮色 | `src/game/HexGameController.ts`, `.temp/projected-shadow-source.test.mjs`, `.temp/screenshots/projected-shadow-after-card-strong.png`, `MEMORY.md` | ✅ 完成 |
| v27 | 2026-05-12 | 地块改为参与真实投射阴影，移除程序化侧面暗色贴片，并调整方向光为更低侧光 | `src/game/HexGameController.ts`, `.temp/projected-shadow-source.test.mjs`, `.temp/screenshots/tile-shadow-no-side-patch.png`, `.temp/screenshots/tile-shadow-after-card-no-side-patch.png`, `MEMORY.md` | ✅ 完成 |
| v28 | 2026-05-12 | 替换金币图标并确保 HUD 钱包与解锁费用数字前显示金币图标 | `assets/downloads/2d/ui/coin_2.png`, `src/game/HexGameController.ts`, `.temp/coin-icon-ui.test.mjs`, `MEMORY.md` | ✅ 完成 |
| v26 | 2026-05-12 | 修复程序化水面底板运行不可见：水面材质关闭背面剔除并显式保持水平旋转 | `src/game/HexGameController.ts`, `.temp/water-floor-visibility.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v27 | 2026-05-12 | 产兵 CD 进度圈改用用户提供的黑色底图和绿色圆环资源，并按冷却进度旋转显示 | `src/game/HexGameController.ts`, `assets/resources/ui/spawn_progress_bg.png`, `assets/resources/ui/spawn_progress_ring.png`, `.temp/spawn-progress-assets.test.mjs`, `doc/output/requirements.md`, `doc/output/resource_list.json`, `MEMORY.md` | ✅ 完成 |
| v28 | 2026-05-12 | 给六边形地块增加微小真实间隔，让底色/水面从格子之间露出 | `src/game/HexGameController.ts`, `.temp/hex-visual-layout.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v29 | 2026-05-12 | 将斜俯视镜头拉高并后移，使竖屏中可看到左右两侧方块边缘 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v30 | 2026-05-12 | 继续拉远斜俯视镜头，扩大竖屏可见战场范围以贴近参考图 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v31 | 2026-05-12 | 将远景镜头角度调整为更偏俯视，减少斜视压缩并贴近参考图构图 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v32 | 2026-05-12 | 前移远景俯视镜头构图，减少下半部分空白并显示更多上方地块内容 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v33 | 2026-05-12 | 拉远远景俯视镜头并增加画面安全边距，减少边缘地块截断 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v34 | 2026-05-12 | 进一步拉远镜头以完整显示边缘地块，避免画面四周截断 | `src/game/HexGameController.ts`, `.temp/camera-angle.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v29 | 2026-05-12 | 优化地块解锁翻转：地块向上飞起、空中旋转两周后落回原位 | `src/game/HexGameController.ts`, `.temp/tile-unlock-flight-flip.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v30 | 2026-05-12 | 将六边形地块微缝缩减到上一版 60%，收紧棋盘布局 | `src/game/HexGameController.ts`, `.temp/hex-visual-layout.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v32 | 2026-05-12 | 将地块解锁空中翻转改为围绕 X 轴上下翻转，避免横向转圈 | `src/game/HexGameController.ts`, `.temp/tile-unlock-flight-flip.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v33 | 2026-05-12 | 将地块解锁上飞高度提高 80%，增强空中翻转幅度 | `src/game/HexGameController.ts`, `.temp/tile-unlock-flight-flip.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v34 | 2026-05-12 | 调整水面和六边形地块为参考图配色，中立格改为明显灰度并移除水面贴图压暗 | `src/game/HexGameController.ts`, `.temp/reference-board-colors.test.mjs`, `.temp/water-floor.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v35 | 2026-05-12 | 增加 2.5D 错层棋盘高度差，并同步模型与 UI 到地块高度 | `src/game/HexGameController.ts`, `.temp/hex-visual-layout.test.mjs`, `.temp/screenshots/hex-layered-board-depth.png`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v35 | 2026-05-12 | 将结束面板重绘为六边形领地徽章风格的扁平矢量 UI，并保持标题、描述、CTA 文案单行可替换 | `src/game/HexGameController.ts`, `.temp/result-panel-vector-ui.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v36 | 2026-05-12 | 新增建筑周边染色与士兵路径染色，支持双方同格中立灰和染色防抖 | `src/game/HexGameController.ts`, `.temp/tile-painting-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v40 | 2026-05-12 | 核对现有玩法代码并将开局、解锁、卡牌、建筑、单位、染色和胜负逻辑重新整理进需求变更记录 | `doc/output/requirements.md`, `.opencode/workflow-state.md`, `MEMORY.md` | ✅ 完成 |
| v41 | 2026-05-12 | 六边形改为长边朝镜头的平顶朝向，并同步棋盘为列错位布局 | `src/game/HexGameController.ts`, `.temp/hex-visual-layout.test.mjs`, `.temp/screenshots/hex-flat-top-layout.png`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v42 | 2026-05-12 | 清理六边形地块多余线框和阴影轮廓，改用纯色地块与物理微缝表现边界 | `src/game/HexGameController.ts`, `.temp/hex-outline-cleanup.test.mjs`, `.temp/hex-visual-layout.test.mjs`, `.temp/screenshots/hex-outline-cleanup-unlit-final.png`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
| v43 | 2026-05-12 | 补充敌方从己方邻格向玩家侧扩张、单位目标优先级和建筑血条闪抖受击反馈记录 | `src/game/HexGameController.ts`, `.temp/unit-visibility-source.test.mjs`, `.temp/enemy-ai-damage-feedback-source.test.mjs`, `MEMORY.md`, `.opencode/workflow-state.md` | ✅ 完成 |
| v44 | 2026-05-12 | 优化士兵生成与建筑阻挡：士兵生成到相邻非建筑地块，存活建筑地块阻挡移动，摧毁后恢复可进入 | `src/game/HexGameController.ts`, `.temp/soldier-building-tile-blocking-source.test.mjs`, `doc/output/requirements.md`, `MEMORY.md` | ✅ 完成 |
