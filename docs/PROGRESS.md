# 开发进度

## 已完成 · Phase 1 + 可视化垂直切片

- Vite + Phaser 3 + TypeScript strict 工程骨架。
- 七时段、90 天日期映射，初一/初二/初三边界。
- GameState、ResourceSystem、ConditionEvaluator、EventEngine、SaveSystem 和种子随机数服务。
- 统一资源结算、上下限、日志、体力耗尽和心态耗尽的日结规则。
- JSON 驱动班长前三天事件；每一天至少两个带真实状态差异的选择（第三天包含广播前准备和广播检查）。
- 第三天广播事件根据 `keys_returned`、`teacher_trust`、`ledger_secret`、`office_clue`、`wall_plan` 或 `escape_leader` 提供不同可用结果。
- Phaser 主场景：教室、走廊、小卖部、操场，并保留天台/厕所扩展入口。
- 数据驱动场景布局、障碍、课桌/货架/公告/篮球等物品和 NPC 时段日程。
- 原创矢量卡通人物：头部、身体、校服、发型、眼睛、情绪表情和姓名身份标签。
- 点击地面移动、WASD/方向键移动、E 近距离互动、简单障碍碰撞和自动寻路接近 NPC/物品。
- NPC 互动菜单、物品行动菜单、地点地图切换和行动结果反馈气泡。
- 版本化 localStorage 存档与 v0 → v1 基础迁移。
- 核心 Vitest 测试、NPC 日程测试和 Playwright 浏览器测试。

## 未完成

完整 90 天内容、其余 20 条角色线、眼保健操固定日事件池、六类搞事表、特殊玩法区五个子系统、正式 spritesheet、美术动画和音频仍属于后续 Phase。
