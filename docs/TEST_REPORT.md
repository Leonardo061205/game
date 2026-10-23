# Phase 1 / V3 垂直切片测试记录

执行目录：`/workspace/game`

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm run typecheck` | 通过 | TypeScript strict 检查无错误 |
| `npm test` | 通过 | 2 个测试文件，13 个核心/日程测试 |
| `npm run build` | 通过 | Vite 生产构建完成；Phaser bundle 有体积提示 |
| `npm run test:e2e` | 通过 | Chromium：4 个测试，覆盖启动/选择/保存恢复、手机竖屏、三日闭环、画布点击 NPC 与地点切换 |

已实际覆盖：90 天日期映射、七时段跨日、资源上下限、体力耗尽日结、条件筛选、单次事件、第三天分支、无事件 fallback、存档往返、旧存档迁移、损坏存档处理、Phaser 画布存在、矢量场景、NPC 自动接近与互动菜单、地图切换、浏览器按钮选择、localStorage 恢复和手机宽度布局。

尚未进行：正式美术视觉验收、完整 90 天平衡测试、21 条角色线和真实设备兼容性测试。
