# 开发进度

## 已完成 · Phase 1

- Vite + Phaser 3 + TypeScript strict 工程骨架。
- 七时段、90 天日期映射，初一/初二/初三边界。
- GameState、ResourceSystem、ConditionEvaluator、EventEngine、SaveSystem 和种子随机数服务。
- 统一资源结算、上下限、日志、体力耗尽和心态耗尽的日结规则。
- JSON 驱动班长前三天事件；每一天至少两个带真实状态差异的选择（第三天包含广播前准备和广播检查）。
- 第三天广播事件根据 `keys_returned`、`teacher_trust`、`ledger_secret`、`office_clue`、`wall_plan` 或 `escape_leader` 提供不同可用结果。
- Phaser 占位背景、HUD、事件对话、状态条、日志、手动保存和继续游戏。
- 版本化 localStorage 存档与 v0 → v1 基础迁移。
- 核心 Vitest 测试和 Playwright 浏览器冒烟测试。

## 未完成

完整 90 天内容、其余 20 条角色线、眼保健操固定日事件池、六类搞事表、特殊玩法区五个子系统、正式美术和音频仍属于后续 Phase。
