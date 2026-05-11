# Project Memory

## 地块争夺 3D 试玩

- 使用 `game-scaffold` 执行 Step 3 时，脚本挂载 `bind` 的每个字符串/数字属性都必须在对应脚本中声明 `@property`，否则场景验证会报 undefined-property。
- 当前项目的 `Box` schema 不接受 `mouseEnabled` 属性，场景中 2D 面板显隐使用 `visible`，点击事件可直接绑定到可交互子节点或根节点。
- 默认 `assets/Scene.ls` 中存在 `fogRange` 字段会触发 Scene3D schema 校验失败，已移除并通过脚手架验证。
- 六边形占格规则已抽到 `src/data/HexRules.ts`，并用 `.temp/hex-rules.test.mjs` 做轻量行为验证：7x10 棋盘、基地坐标、相邻判断、首格免费占领和收入计算。
- 运行设计尺寸配置在 `settings/PlayerSettings.json` 的 `resolution`：1080x1920、showall、vertical、居中对齐、背景色 #16b5f0；`fixedwidth` 会按设备宽度改写运行时逻辑高度，导致预览尺寸不是设计尺寸。场景 `GameUIRoot` 也保持 1080x1920。
- 当前 CLI 环境未暴露编辑器预览、截图、控制台日志读取接口；Step 4 已用 TypeScript 编译、规则测试和场景验证替代，并在 `doc/output/verification_report.md` 记录人工预览待办。
- 主相机运行时由 `src/game/HexGameController.ts` 的 `setupCamera` 覆盖位置和角度；当前参考广告截图使用正交投影，`orthographicVerticalSize = 15`，位置 `(0,18,6)` 并 `lookAt(0,0,0)` 显式朝向地面中心，`.temp/camera-angle.test.mjs` 检查防回退。
- 地块层级调试显示在 `src/game/HexGameController.ts` 的 `createDebugLayerLabel` 中生成，文本格式为 `L0` 到 `L9`，用于镜头调试；`.temp/tile-layer-labels.test.mjs` 检查生成逻辑。
