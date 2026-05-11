# AI Coding Rules

本项目使用 AI coding 辅助开发时，必须优先调用 `Superpowers` 插件技能来管理需求澄清、规划、实现、调试和验证流程。

## 必须调用的技能

- 开始任何项目工作前：使用 `superpowers:using-superpowers`。
- 进行需求规划、玩法设计、功能设计或实现方案讨论前：使用 `superpowers:brainstorming`。
- 根据已确认需求编写实施计划前：使用 `superpowers:writing-plans`。
- 实现功能或修复缺陷前：使用 `superpowers:test-driven-development`，除非用户明确要求跳过测试驱动。
- 调试异常、运行失败或表现不符合预期时：使用 `superpowers:systematic-debugging`。
- 声称完成、修复或通过前：使用 `superpowers:verification-before-completion`。

## 项目执行约定

- 默认使用中文沟通。
- 先对照 `doc/game/prd.md`、`doc/output/requirements.md`、`doc/output/resource_list.json` 和当前代码，再提出改动。
- 不要凭记忆修改 Laya 场景、资源路径或玩法参数。
- 涉及试玩广告体验时，优先保证中文试玩环境下的广告节奏：开局可理解、前 10 秒有交互反馈、卡牌强化可见、局末 CTA 明确。
- 修改前检查当前工作树，避免覆盖用户未提交的改动。
- 修改后至少运行 TypeScript 编译检查；涉及规则逻辑时同时运行 `.temp/hex-rules.test.mjs`。
